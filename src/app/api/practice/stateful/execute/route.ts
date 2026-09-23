import { NextResponse } from "next/server";
import { getProgramBySlug } from "@/content";
import { runStatefulRequest } from "@/lib/practice/stateful/runner";
import {
  destroyStatefulSession,
  getSessionCookieName,
  replaceSessionJar,
  resolveStatefulSession,
  serializedStatefulRequest,
  sessionResolveStatus,
} from "@/lib/practice/stateful/sessionManager";
import type { StatefulRunStep } from "@/lib/practice/statefulEvaluator";
import { cookieHeaderForPath, applySetCookies, changedClientCookieCount } from "@/lib/practice/stateful/cookieJar";
import { validateStatefulExecuteBody } from "@/lib/practice/stateful/payload";

// PHP spawning requires the Node.js runtime — never Edge.
export const runtime = "nodejs";

/**
 * POST /api/practice/stateful/execute
 * Body: { sessionId, programSlug, code, inputs }
 * Runs exactly one raw HTTP request inside the session's isolated php -S
 * sandbox. The cookie jar lives server-side; the client only ever sees the
 * learner-visible status/stdout and a count of changed cookies. For filesystem
 * programs the session workspace doubles as the learner's disk: files created
 * here persist across requests until the session is reset or expires.
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

  const validated = validateStatefulExecuteBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  const program = getProgramBySlug(validated.value.programSlug);
  if (!program) {
    return NextResponse.json(
      { error: `Unknown program "${validated.value.programSlug}".` },
      { status: 404 },
    );
  }
  if (program.practice?.execution !== "stateful" && program.practice?.execution !== "filesystem") {
    return NextResponse.json(
      { error: `Program "${validated.value.programSlug}" does not support stateful practice.` },
      { status: 400 },
    );
  }

  const { sessionId, code, inputs, programSlug } = validated.value;

  const resolved = resolveStatefulSession(sessionId);
  if (!resolved.ok) {
    const status = sessionResolveStatus(resolved)!;
    if (status === "session_expired") await destroyStatefulSession(sessionId);
    const message =
      status === "session_expired"
        ? "The practice session expired. Start a new practice session to continue."
        : "The practice session no longer exists. Start a new practice session to continue.";
    return NextResponse.json(
      { status, message, exitCode: null },
      { status: 200 },
    );
  }
  if (resolved.record.session.programSlug !== programSlug) {
    return NextResponse.json(
      { error: "The session does not belong to this program." },
      { status: 400 },
    );
  }

  const result = await runIntoSession()(sessionId, code, inputs);
  return NextResponse.json(result);
}

/** Wire the sandboxed runner + session cookie jar into a StatefulRunStep. */
function runIntoSession(): StatefulRunStep {
  return (sid, code, inputs) =>
    serializedStatefulRequest(sid, async () => {
      const resolved = resolveStatefulSession(sid);
      if (!resolved.ok) {
        const status = sessionResolveStatus(resolved)!;
        const message =
          status === "session_expired"
            ? "The practice session expired. Start a new practice session to continue."
            : "The practice session no longer exists. Start a new practice session to continue.";
        return { status, message };
      }

      const { session, jar } = resolved.record;
      const response = await runStatefulRequest({
        session,
        code,
        inputs,
        cookieHeader: cookieHeaderForPath(jar, "/"),
      });

      const now = Date.now();
      const nextJar = applySetCookies(jar, response.setCookieHeaders, now);
      const cookiesUpdated = changedClientCookieCount(
        jar,
        nextJar,
        getSessionCookieName(),
      );
      replaceSessionJar(sid, nextJar);

      return {
        status: response.status,
        stdout: response.stdout,
        message: response.message,
        cookiesUpdated:
          response.status === "success" ? cookiesUpdated : undefined,
      };
    });
}