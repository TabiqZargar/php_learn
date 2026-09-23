import { NextResponse } from "next/server";
import { getProgramBySlug } from "@/content";
import { runLocalPhp } from "@/lib/practice/localPhpRunner";
import { evaluateSolution } from "@/lib/practice/evaluator";
import {
  evaluateStatefulSolution,
  type StatefulRunStep,
  type StatefulSnapshotFiles,
  type StatefulSnapshotDb,
} from "@/lib/practice/statefulEvaluator";
import {
  createStatefulSession,
  destroyStatefulSession,
  replaceSessionJar,
  resolveStatefulSession,
  serializedStatefulRequest,
  sessionResolveStatus,
} from "@/lib/practice/stateful/sessionManager";
import { runStatefulRequest } from "@/lib/practice/stateful/runner";
import {
  MysqlRuntimeUnavailableError,
  snapshotMysqlRows,
} from "@/lib/practice/mysql/runtime";
import { resolveLoginSeedTokens } from "@/lib/practice/mysql/loginSeed";
import {
  applySetCookies,
  cookieHeaderForPath,
  jarToRecord,
} from "@/lib/practice/stateful/cookieJar";
import { readWorkspaceFiles } from "@/lib/practice/stateful/workspace";
import { validateCheckPayload } from "@/lib/practice/checkPayload";

// PHP spawning requires the Node.js runtime — never Edge.
export const runtime = "nodejs";

/**
 * POST /api/practice/check
 * Body: { programSlug: string, code: string }
 * The client sends only code + slug; the server owns the test cases and
 * every execution. Pure programs reuse the CLI evaluator; stateful and
 * filesystem programs run sequential requests through per-case isolated
 * sessions (filesystem programs additionally assert on-disk file state via
 * expectedFiles). MySQL programs assert real database state via expectedDb,
 * snapshotted server-side in the session's prefixed namespace; a missing or
 * unreachable practice database is surfaced as runtime_unavailable, never a
 * wrong answer. Returns a typed EvaluationResult, or a typed error for
 * malformed/unknown requests.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validated = validateCheckPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const program = getProgramBySlug(validated.payload.programSlug);
  if (!program) {
    return NextResponse.json(
      { error: `Unknown program "${validated.payload.programSlug}".` },
      { status: 404 },
    );
  }

  const execution = program.practice?.execution ?? "pure";

  if (
    execution === "stateful" ||
    execution === "filesystem" ||
    execution === "mysql"
  ) {
    const testCases = program.statefulTestCases;
    if (!testCases || testCases.length === 0) {
      return NextResponse.json(
        {
          error: `Program "${validated.payload.programSlug}" does not support solution evaluation yet.`,
        },
        { status: 400 },
      );
    }
    const deps: Parameters<typeof evaluateStatefulSolution>[2] = {
      createSession: () =>
        createStatefulSession(program.slug, {
          capability: execution,
          mysql: program.practice?.mysql,
        }).catch((error: unknown) => {
          if (error instanceof MysqlRuntimeUnavailableError) {
            return { unavailable: true as const, message: error.message };
          }
          throw error;
        }),
      destroySession: (id) => destroyStatefulSession(id).then(() => undefined),
      runStep: statefulCheckRunStep(program.slug),
      resolveRunInputs: resolveLoginSeedTokens,
    };
    if (execution === "filesystem") {
      deps.snapshotFiles = statefulCheckSnapshotFiles();
    }
    if (execution === "mysql") {
      deps.snapshotDb = statefulCheckSnapshotDb();
    }
    const evaluation = await evaluateStatefulSolution(validated.payload.code, testCases, deps);
    return NextResponse.json(evaluation);
  }

  const testCases = program.testCases;
  if (!testCases || testCases.length === 0) {
    return NextResponse.json(
      {
        error: `Program "${validated.payload.programSlug}" does not support solution evaluation yet.`,
      },
      { status: 400 },
    );
  }

  const evaluation = await evaluateSolution(validated.payload.code, testCases, runLocalPhp);
  return NextResponse.json(evaluation);
}

/** Sandboxed per-request stateful step wired into the evaluator's deps. */
function statefulCheckRunStep(expectedProgramSlug: string): StatefulRunStep {
  return (sessionId, code, inputs) =>
    serializedStatefulRequest(sessionId, async () => {
      const resolved = resolveStatefulSession(sessionId);
      if (!resolved.ok) {
        const status = sessionResolveStatus(resolved)!;
        if (status === "session_expired") await destroyStatefulSession(sessionId);
        const message =
          status === "session_expired"
            ? "A practice session expired before the test finished."
            : "A practice session disappeared before the test finished.";
        return { status, message };
      }
      if (resolved.record.session.programSlug !== expectedProgramSlug) {
        return {
          status: "invalid_request",
          message: "The practice session does not belong to this program.",
        };
      }

      const { session, jar } = resolved.record;
      const response = await runStatefulRequest({
        session,
        code,
        inputs,
        cookieHeader: cookieHeaderForPath(jar, "/"),
      });
      const nextJar = applySetCookies(jar, response.setCookieHeaders, Date.now());
      replaceSessionJar(sessionId, nextJar);

      return {
        status: response.status,
        stdout: response.stdout,
        message: response.message,
        cookies: jarToRecord(nextJar),
      };
    });
}

/**
 * Sandboxed on-disk snapshot wired into the evaluator's expectedFiles checks.
 * Runs inside the session's serialized chain so a snapshot can never race the
 * php -S server of the step that just finished.
 */
function statefulCheckSnapshotFiles(): StatefulSnapshotFiles {
  return (sessionId, names) =>
    serializedStatefulRequest(sessionId, async () => {
      const resolved = resolveStatefulSession(sessionId);
      if (!resolved.ok) {
        return Object.fromEntries(names.map((name) => [name, null]));
      }
      return readWorkspaceFiles(resolved.record.session.workspacePath, names);
    });
}

/**
 * Sandboxed database snapshot wired into the evaluator's expectedDb checks.
 * Resolves the live session's MySQL config (server-side only, never shipped)
 * and snapshots the requested logical tables inside its prefixed namespace.
 * Like expectedFiles this runs inside the session's serialized chain so a
 * snapshot can never race the php -S request that produced the state.
 */
function statefulCheckSnapshotDb(): StatefulSnapshotDb {
  return (sessionId, tables) =>
    serializedStatefulRequest(sessionId, async () => {
      const resolved = resolveStatefulSession(sessionId);
      if (!resolved.ok) {
        return {
          ok: false as const,
          reason: "runtime_unavailable" as const,
          message: "A practice session disappeared before grading.",
        };
      }
      const mysql = resolved.record.session.mysql;
      if (!mysql) {
        return {
          ok: false as const,
          reason: "runtime_unavailable" as const,
          message: "This session has no database configured.",
        };
      }
      const snapshot = await snapshotMysqlRows(
        mysql,
        tables.map((entry) => entry.table),
      );
      if (!snapshot.ok) {
        return {
          ok: false as const,
          reason: "runtime_unavailable" as const,
          message: snapshot.reason,
        };
      }
      return {
        ok: true as const,
        tables: tables.map((entry) => ({
          table: entry.table,
          exists: snapshot.tables[entry.table]?.exists ?? false,
          rows: snapshot.tables[entry.table]?.rows ?? [],
        })),
      };
    });
}