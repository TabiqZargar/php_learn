import { NextResponse } from "next/server";
import { getProgramBySlug } from "@/content";
import { runLocalPhp } from "@/lib/practice/localPhpRunner";
import { evaluateSolution } from "@/lib/practice/evaluator";
import {
  evaluateStatefulSolution,
  type StatefulRunStep,
  type StatefulSnapshotFiles,
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
 * expectedFiles). Returns a typed EvaluationResult, or a typed error for
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

  if (execution === "stateful" || execution === "filesystem") {
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
      createSession: () => createStatefulSession(program.slug),
      destroySession: (id) => destroyStatefulSession(id).then(() => undefined),
      runStep: statefulCheckRunStep(program.slug),
    };
    if (execution === "filesystem") {
      deps.snapshotFiles = statefulCheckSnapshotFiles();
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