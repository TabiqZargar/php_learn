# Filesystem PHP Execution (Phase 9B)

The filesystem capability lets learners create, read, append to and delete
files from inside PHP practice programs. It reuses the exact same isolated
session architecture as the stateful (sessions & cookies) runner — it is a
**capability flag on top of the proven Phase 9A engine**, not a second
runtime.

This document explains the model, the boundaries and what the unit tests and
the `p9b-cdp.mjs` harness verify.

## Capability model

`PracticeConfig.execution` gains a third value: `"filesystem"`. It is
declared explicitly in every program's content and validated server-side —
it is never inferred from the slug.

- `pure` — throwaway CLI process per run (Phases 1–8).
- `stateful` — raw HTTP requests inside an isolated `php -S` session;
  sessions and cookies persist per practice session (Phase 9A).
- `filesystem` — the same isolated session + workspace, where learner file
  operations persist across requests exactly like disk storage.

Only `stateful` and `filesystem` programs may create practice sessions; the
session and execute routes accept exactly those two capabilities. `pure`
programs keep using the CLI runner.

## How state works

A practice session owns a throwaway workspace:

```
<tmp>/php-academy-stateful-<random>/
  router.php    gated bootstrap that runs program.php
  __token.txt   per-session bearer token
  sess/         PHP session.save_path (isolated per session)
  program.php   the learner's current code (written per request)
  academy.txt   learner-created files live here too
```

- The learner's code runs with `cwd` = workspace and `open_basedir` =
  workspace, so `__DIR__ . "/academy.txt"` and relative writes stay inside.
- Files written by one Run are still there for the next Run **of the same
  practice session** — the Create → Write → Read → Append → Delete flows are
  real multi-request exercises.
- **Reset Editor** restores starter code only; it never touches the workspace.
- **Reset Session** destroys the session and deletes the whole workspace,
  including every learner-created file.
- Sessions expire after `STATEFUL_SESSION_TTL_MS` (30 minutes); the sweep
  destroys the workspace. A server restart clears all sessions (the registry
  is in-memory and single-process).
- Each **test case** gets a brand-new session (fresh workspace). Steps within
  a case share that workspace, so the grader genuinely exercises
  `create → read`, `append twice → read`, `delete → status`.

## Test assertions

Graded tests assert two kinds of learner-visible state per step:

1. Program output — `expectedOutput` (exact match via `matchesOutput`).
2. On-disk file state — `expectedFiles`, e.g.
   `{ "academy.txt": "Welcome to PHP!" }` (exact contents) or
   `{ "academy.txt": null }` (file must be absent).

`expectedFiles` keys are **bare, safe filenames** only. A key that contains
path separators, traversal, a drive/URI prefix, a leading dot, a reserved
workspace name or exceeds 80 chars fails the case without ever touching the
host filesystem. Reserved names (`program.php`, `router.php`,
`__token.txt`, `sess`) can never be asserted — they are infrastructure, not
learner content.

The server-side snapshot implementation lives in
`src/lib/practice/stateful/workspace.ts`. It reads files directly from the
session workspace (never through PHP), caps each file at the output limit,
and resolves missing/unreadable files to `null`. The evaluator only consults
it when a step declares `expectedFiles`; states list which files the step
actually asserts.

## Security boundaries

Filesystem programs inherit every guard of the stateful runner:

- `open_basedir=<workspace>` — reads/writes anywhere else fail.
- `disable_functions` blocks `exec`, `system`, `shell_exec`, `passthru`,
  `popen`, `proc_open`, `pcntl_exec` — no child processes from student code.
- `allow_url_fopen=0` / `allow_url_include=0` — no URL/stream wrapper network
  access.
- Per-request fresh `php -S` bound to `127.0.0.1`, killed (and awaited to
  detach on Windows) before the request returns.
- Gated router: only POST requests carrying the per-session token are served.
- Host paths are stripped from every surfaced string; server logs never reach
  the client.
- `expectedFiles` names are validated before any path join (see above); the
  snapshot reader never follows the workspace path out.

Covered directly by `test/statefulFilesystem.test.ts`:

- writes persist across requests; append accumulates; delete works.
- sessions have isolated workspaces (data in one is invisible in another).
- open_basedir blocks absolute-path and `../` traversal reads.
- symlink reads cannot escape the workspace (blocked or unusable).
- an outside "guardian" file is never modified by learner `..` writes.
- host workspace paths never appear in surfaced output.
- destroying a session removes learner-created files with the workspace, and
  no `php-academy-stateful-*` directories are left behind.

## UI

Filesystem programs are regular practice programs: the side pane shows
Not attempted / Best X/Y / Completed (they carry `statefulTestCases`). The
practice header and the session strip show **Execution: Filesystem PHP** so
the capability is unmistakable, and the same four controls apply — Run,
Check Solution, Reset Editor, Reset Session.

## Out of scope

No MySQL/PDO, file uploads, shell access, host-path exposure, or machine
specific paths in authored content. See `docs/PHP_EXECUTION_SECURITY.md` for
what still is NOT safe.