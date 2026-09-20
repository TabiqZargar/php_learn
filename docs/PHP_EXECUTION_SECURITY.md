# PHP Execution Security

The practice feature lets students run arbitrary PHP against the local PHP
CLI. This document explains exactly what is (and is NOT) protected, so nobody
mistakes this feature for a production sandbox.

## Current architecture (dev only)

```
Browser (Practice UI)
   │  POST /api/practice/execute  { code, inputs }
   ▼
Next.js API route  src/app/api/practice/execute/route.ts
   │  validates payload (shape + size limits)
   ▼
src/lib/practice/localPhpRunner.ts
   │  server-only, child_process.spawn()
   ▼
local PHP CLI  (php -n … program.php arg1 …)
```

Key properties of the local runner:

- **Dev-only gate.** `runLocalPhp` refuses to execute anything unless
  `NODE_ENV === "development"`. In built production servers every submission
  returns `execution_disabled`. Do not remove this gate without a production
  sandbox (see below).
- **No shell, ever.** User input and code are passed via
  `child_process.spawn()` as a raw argument array — never through
  `exec`, `execSync`, `shell_exec`, `system`, `popen`, or a shell string — so
  command-string injection is not possible.
- **Throwaway directory.** Code is written to a fresh `os.tmpdir()` directory
  (`php-academy-*`) that is deleted after every run. Nothing is ever written to
  project files, and the working directory is that throwaway directory.
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