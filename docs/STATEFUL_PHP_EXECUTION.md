# Stateful PHP Execution (Phase 9A — Sessions & Cookies)

Stateful programs let learners practice the HTTP request lifecycle against a
real PHP built-in web server: `$_SESSION` login/logout and
`setcookie` / `$_COOKIE` creation, reading and deletion.

Security first: read `docs/PHP_EXECUTION_SECURITY.md` before changing anything
in `src/lib/practice/stateful/`.

## Architecture

```
Browser (PracticeWindow)
   │  POST /api/practice/stateful/session      { programSlug }  → 201 { sessionId, … }
   │  POST /api/practice/stateful/execute      { sessionId, code, inputs }
   │  DELETE /api/practice/stateful/session    { sessionId }
   ▼
Next.js API routes  src/app/api/practice/stateful/{session,execute}/route.ts
   ▼
src/lib/practice/stateful/sessionManager.ts   in-memory session registry
   │   workspace = <os.tmpdir>/php-academy-stateful-<random>/
   │     router.php   gate + ini_set session.save_path + Throwable→500
   │     __token.txt  random bearer token
   │     sess/        PHP session.save_path (isolated per session)
   │     program.php  learner code, rewritten on every request
   │   jar = server-side cookie jar (Map, keyed name+path)
   ▼
src/lib/practice/stateful/runner.ts           runStatefulRequest()
   │   boots ONE fresh php -n -S 127.0.0.1:<ephemeral-port> per request
   │   sends the POST via fetch() with the token + rebuilt Cookie header
   │   applies Set-Cookie headers back into the jar (cookieJar.ts)
   │   kills and awaits the server detach in a finally
   ▼
PHP CLI (built-in web server)
```

## Session lifecycle

- `createStatefulSession(programSlug)` makes a throwaway workspace and a random
  opaque `sessionId`. The registry maps it to `{ session, jar, chain }`.
- A learner starts a practice session from the UI (Start Practice Session).
  The session is distinct from the browser's cookies — the server owns the
  state and the browser only receives the session id.
- Requests to a session are serialized through `serializedStatefulRequest` so
  two PHP server boots can never touch one workspace concurrently.
- `resolveStatefulSession(id)` resolves only live sessions. Expired or unknown
  ids produce `session_expired` / `session_not_found`; the surrounding routes
  destroy the workspace in the expired case.
- `destroyStatefulSession(id)` deletes the registry record and the workspace
  (with retries on Windows so temp dirs do not leak).
- `sweepExpiredSessions()` runs periodically; sessions last
  `STATEFUL_SESSION_TTL_MS` (30 minutes) and expire regardless of activity.
  `forceExpireStatefulSession(id)` is a test hook.

IMPORTANT: the registry is **in-memory and single-process**. Restarting the
Next server clears every practice session, and multiple server instances do
not share state. That is acceptable for a local teaching tool; a production
deployment needs a shared session store out of scope for this phase.

## Cookie jar (server-side)

The jar models how a browser would store `Set-Cookie` responses, so PHP's
own `session_start()` and `setcookie()` semantics play out authentically:

- `parseSetCookieHeader` extracts name, value, path, `Expires` and `Max-Age`
  (`Max-Age` wins when both are present, per RFC 6265) and unquotes values.
- `applySetCookies` returns a new jar; empty or already-expired cookies are
  removed, later same-key headers win.
- `cookieHeaderForPath` rebuilds the `Cookie` request header for the target
  path (path scoping honored).
- `changedClientCookieCount` reports how many learner-visible cookies changed;
  the PHP session cookie (`PHPSESSID`) is excluded so learners see only what
  they set (or deleted).
- The jar is **never shipped to the browser**. The client only receives the
  `sessionId` and per-request results. This keeps opaque ids and internal
  session state off the wire.

## Session persistence (how it works)

Each evaluation test case gets a **fresh session** (fresh workspace + fresh
jar). Steps within a case are sequential requests to that same session, so
request N+1 sees what request N stored:

```
case 1:  login  → (response sets PHPSESSID + sess/user = bob)
         status → same id, sess/user read → "Logged in as bob"
         logout → session_destroy() removes the file
         status → same id, file gone → not logged in
case 2:  fresh session — state from case 1 is unobservable
```

The router deliberately does not call `session_start()` itself: exercises must
call it, exactly like on a real host. It pins `session.save_path` with `ini_set`
(before any learner `session_start`) so session files land in
`<workspace>/sess`, and it converts every uncaught PHP `Throwable` into HTTP
500 with a one-line diagnostic, which the runner classifies as
`syntax_error` / `runtime_error`. Uncatchable engine-level failures (OOM, raw
`exit`) can still surface as 200 with diagnostic text — an accepted edge case.

## Evaluation

`POST /api/practice/check` for a stateful program delegates to
`evaluateStatefulSolution` (`src/lib/practice/statefulEvaluator.ts`). It never
spawns PHP itself; the route injects `createSession` / `destroySession` /
`runStep` so every request still passes through the sandboxed web runner and
the session registry. Semantics:

- one fresh session per test case, always destroyed (even on failure);
- steps run in order; the first failing step stops the case;
- `expectedCookies` on a step must hold after that request (`null` = absent,
  non-null = exact value match);
- overall status is the first failure (`passed`, `wrong_answer`, or a mapped
  runtime/syntax/timeout/output-limit/unavailable/execution-disabled status);
  statuses outside the evaluation model (`session_expired`,
  `session_not_found`, `invalid_request`) collapse to `runtime_error`.

## Learner UI

`PracticeWindow` renders stateful programs with "Execution: Stateful PHP".
The `StatefulSessionBar` provides Start Practice Session → (session active)
Run / Check Solution / Reset Practice Session; Reset Editor is separate. Both
resets only affect the practice session / editor — learning progress
(lessons, best result, hints) is untouched. Expired or missing sessions put
the UI back into the Start state with a neutral message.

See `src/components/practice/StatefulSessionBar.tsx` and
`src/components/practice/PracticeWindow.tsx` for the lifecycle.

## Content

Two stateful programs exist: `sessions` ("PHP Session Login / Logout") and
`cookies` ("PHP Cookies"). Each declares:
`practice.execution: "stateful"`, `starterCode` (a scaffold — never the
solution), `hints` (3 prose-only hints, no code snippets), `lessonReferences`
to the `sessions` and `cookies` lessons, and `statefulTestCases` (4 cases of
sequential steps each). Pure programs carry `testCases` and never
`statefulTestCases`; stateful programs are the mirror image.