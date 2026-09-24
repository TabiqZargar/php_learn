# PHP Execution Security

The practice feature lets students run arbitrary PHP against the local PHP
CLI. This document explains exactly what is (and is NOT) protected, so nobody
mistakes this feature for a production sandbox.

## Current architecture (dev only)

```
Browser (Practice UI)
   │  POST /api/practice/execute  { code, inputs }
   │  POST /api/practice/check    { programSlug, code }
   │  POST /api/practice/stateful/session   (create/destroy practice session)
   │  POST /api/practice/stateful/execute   (one stateful request)
   ▼
Next.js API routes  src/app/api/practice/{execute,check}/route.ts
                    + src/app/api/practice/stateful/{session,execute}/route.ts
   │  validates payloads (shape + size limits), resolves the program
   ▼
Run path:   src/lib/practice/localPhpRunner.ts     → local PHP CLI
Check path: src/lib/practice/{evaluator,statefulEvaluator}.ts
Stateful:   src/lib/practice/stateful/{runner,sessionManager,cookieJar}.ts
Filesystem: src/lib/practice/stateful/workspace.ts (expectedFiles snapshot)
MySQL:      src/lib/practice/mysql/{config,runtime,loginSeed}.ts (server-only)
   │  server-only, child_process.spawn()
   ▼
pure      → php -n … program.php arg1 …
stateful  → fresh php -n -S 127.0.0.1:PORT (per request) behind a gated router
filesystem→ same gated php -S; learner files persist in the session workspace
mysql     → same gated php -S + mysqli flags; learner connects to a dedicated
             practice DB through session-scoped (prefixed) tables
```

All limits live in one place — `src/lib/practice/limits.ts` — so a reviewer sees
the security knobs at a glance.

Key properties of the local runner:

- **Dev-only gate.** `runLocalPhp` refuses to execute anything unless
  `NODE_ENV === "development"`. In built production servers every submission
  returns `execution_disabled`. Do not remove this gate without a production
  sandbox (see below).
- **No shell, ever.** User input and code are passed via
  `child_process.spawn()` as a raw argument array — never through
  `exec`, `execSync`, `shell_exec`, `system`, `popen`, or a shell string — so
  command-string injection is not possible.
- **Process execution is disabled inside PHP.** Both runners launch with
  `-d disable_functions=<DISABLED_PHP_FUNCTIONS>` (`proc_open`, `popen`,
  `exec`, `system`, `shell_exec`, `passthru`, `pcntl_exec`). Calling any of
  them raises "Call to undefined function" and the run is reported as a
  runtime error — no child processes can be started by student code.
- **Throwaway directory.** Code is written to a fresh `os.tmpdir()` directory
  (`php-academy-*`) that is deleted after every run. Nothing is ever written to
  project files, and the working directory is that throwaway directory.
- **Temp-path output is scrubbed.** PHP prints the absolute path of the
  throwaway script in diagnostics (e.g.
  `C:\...\Temp\php-academy-AbC123\program.php`). `sanitizePhpOutput`
  (`src/lib/practice/localPhpRunner.ts`) replaces that path with a bare
  `program.php` on **every** runner result — the Run route, the pure check
  route and the evaluator diagnostics — so the host temp path never reaches
  the client.
- **Big-OS hammer limits.** The Node process enforces a 2 s wall-clock timeout,
  a 64 KB output cap (process killed at the limit), a 64 KB source cap and a
  16 KB input cap. The PHP side is launched with `-n` (no user `php.ini`),
  `memory_limit=64M`, `max_execution_time=2`, `allow_url_fopen=0`,
  `allow_url_include=0`, `display_errors=1`, `error_reporting=E_ALL`, and
  `open_basedir=<tmpdir>`.
- **Clean environment.** The child inherits only an allow-listed subset of the
  server's environment (`PATH`, `SystemRoot`, temp dirs, locale, …). Secrets in
  `process.env` never reach the child.
- **Never fabricate output.** Every result is what the process actually
  produced or an explicit status (`runtime_unavailable`,
  `execution_disabled`, `timeout`, `output_limit`, …).

## Check Solution evaluation

`POST /api/practice/check` grades a student's code against each program's
`testCases` (pure programs) or `statefulTestCases` (stateful **and**
filesystem programs), defined in `src/content/programs/*`. Only programs that
declare test cases are gradable; every other program is rejected with a typed
400. Notable properties:

- **Execution goes through the same sandbox.** The evaluator
  (`src/lib/practice/evaluator.ts`) never spawns PHP itself — the route injects
  `runLocalPhp` (pure) or the session runner + session manager, so every case
  respects the same limits, temp-dir cleanup and dev-only gate as Run.
- **Filesystem tests can assert on-disk state.** Steps may declare
  `expectedFiles`; the route then snapshots those files from the session
  workspace through `src/lib/practice/stateful/workspace.ts` (name-validated,
  size-capped, never through PHP). See `docs/FILESYSTEM_PHP_EXECUTION.md`.
- **MySQL tests can assert database state.** Steps may declare `expectedDb`;
  the route snapshots the session's prefixed tables server-side through
  `src/lib/practice/mysql/runtime.ts` (identifiers validated, never through
  learner code). See `docs/MYSQL_PHP_EXECUTION.md`.
- **Login-seed tokens are resolved only at the check boundary.** The
  `php-mysql-login` program references its seed passwords through
  `{{PASSWORD:alice}}`-style tokens in shipped content. The check route passes
  `resolveRunInputs` (`src/lib/practice/mysql/loginSeed.ts`) into the
  evaluator, which substitutes the plaintext **only for the inputs actually
  executed** — the recorded/returned `inputs` keep the token, so neither the
  API response nor the UI ever sees the plaintext. The stateful execute route
  (manual Run) resolves no seed tokens — learners must supply real credentials
  they discover during the exercise. `sanitizeMysqlText` redacts the seed
  plaintexts from surfaced output. See `docs/PHP_MYSQL_LOGIN.md`.
- **Expected outputs are client-visible by design.** Test cases ship inside the
  content bundle, which the browser already downloads. This is acceptable for a
  teaching tool, but any future *sensitive* evaluation assets (reference
  implementations, randomized data, anti-cheat keys) must live server-side and
  never be shipped to the client. Do not add a `solutionCode` /
  reference-implementation field to the content model.

## Stateful web runner (sessions, cookies & filesystem)

Stateful and filesystem programs run through a per-request `php -S` server
instead of the CLI so HTTP semantics (sessions, cookies, header flushing)
are real. Filesystem programs use the same isolated workspace as their disk:
learner writes persist across the session's requests. The runner inherits
every limit above and adds:

- **One fresh server per request**, bound to `127.0.0.1` on an ephemeral
  port, killed (and awaited to detach, on Windows) before the request
  returns. No long-lived listener exists.
- **Gated router.** The server only answers `POST` requests carrying a random
  per-session bearer token (`__token.txt`) that the runner reads straight from
  the workspace. Anything else gets `403`.
- **Strict filesystem boundary.** `open_basedir` and the working directory are
  the session workspace. PHP session files live in
  `<workspace>/sess` (set via `-d session.save_path` *and* `ini_set` inside the
  router, because `-d` alone is not reliable for that key).
- **Server-side cookie jar.** `Set-Cookie` headers are parsed into an in-memory
  jar keyed by name+path; the next request's `Cookie` header is rebuilt from it.
  The jar is the model of a browser's jar — it is never shipped to the client;
  only a count of changed cookies is surfaced to the learner UI. The browser's
  real cookies are never used or sent.
- **Throwables become HTTP 500.** The router catches every uncaught PHP error,
  returns `500` with a one-line diagnostic (learners see the message, not a
  stack trace), so the runner can classify success / syntax / runtime failures.
  The `Parse error|syntax error` classifier maps `500`s accordingly.
- **Expiry & cleanup.** Sessions expire 30 minutes after creation; expired
  sessions are rejected (`session_expired`) and destroyed, deleting their
  workspace. Workspace deletion retries on Windows to keep temp dirs from
  leaking. The registry is in-memory and single-process (documented in
  `docs/STATEFUL_PHP_EXECUTION.md`); a server restart clears all sessions.

## Capability split

`PracticeConfig.execution: "pure" | "stateful" | "filesystem" | "mysql"` is
explicit per program and validated server-side — never inferred from the slug.

- **Available now:** CLI computation (`pure`); HTTP request lifecycle with
  `$_SESSION` + `setcookie`/`$_COOKIE` (`stateful`); file create / write /
  read / append / delete inside an isolated per-session workspace
  (`filesystem`, Phase 9B — see `docs/FILESYSTEM_PHP_EXECUTION.md`);
  MySQL practice against a dedicated, session-prefixed database
  (`mysql`, Phase 9C — see `docs/MYSQL_PHP_EXECUTION.md`);
  MySQL-backed login against a seeded `users` table (`php-mysql-login`,
  Phase 9D — see `docs/PHP_MYSQL_LOGIN.md`).
- **Deliberately NOT available:** file uploads. Do not present a program that
  relies on uploads as if it worked.

## What is still NOT safe

`LocalPhpRunner` runs the student's code with the privileges of the local
development user. That means the code can, among other things:

- read/write files it can reach (only `open_basedir` restrains this, and it is
  not a security boundary — the path is supplied by the runner and PHP's
  handling of `open_basedir` on Windows is best-effort);
- call functions that talk to the OS (network is the main blind spot:
  `allow_url_fopen=0` blocks the stream wrappers `file://`/`http://`/`https://`
  **outside** the allow-list behaviour, but DNS, sockets via `stream_socket_*`
  and similar APIs may still be reachable);
- consume the machine's CPU/memory up to the configured caps.

The stateful `php -S` runner has the same exposure: `open_basedir` is scoped to
the session workspace (not a security boundary), network APIs beyond the
`allow_url_*` stream wrappers may still be reachable, and state persists
across requests *within a single practice session* by design — so a learner
could store small amounts of data on the dev machine's session files or inside
the throwaway workspace until the session expires. That is the point of the
exercise; it is still dev-only.

MySQL practice adds a further, deliberate interface: learner code connects
with the session credentials to a **dedicated practice database** whose tables
are prefixed per session, and the server-side helpers run probe / seed /
cleanup / snapshot queries with the same credentials. The account is granted
rights on `php_academy_practice.*` only (never `*.*`), but the GRANT cannot
scope per prefix — a guessed prefix (`s` + 48 random bits) would still be
writable by another session. Point `MYSQL_HOST` at the local practice server
only. See `docs/MYSQL_PHP_EXECUTION.md` for the full boundaries and residual
risks.

This is a **teaching convenience for local development only**. It is not a
production sandbox and must never run against the published site.

## The right answer for production

Real, untrusted-execution hosting belongs **outside** this application in
isolated infrastructure:

- one isolated Linux container or VM per submission, with cgroups CPU/memory
  limits, no network, a read-only code volume, and no credentials mounted;
- or a dedicated execution worker/queue fed by this API with the same
  per-submission isolation;
- or a remote execution service that enforces those limits on its own.

Until that exists, keep the `NODE_ENV === "development"` gate, keep the result
statuses honest, and never weaken the limits "temporarily".