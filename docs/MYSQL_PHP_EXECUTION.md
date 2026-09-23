# MySQL PHP Execution (Phase 9C)

The MySQL capability lets learners connect to a real local MySQL server from
PHP practice programs and run CREATE / INSERT / SELECT / UPDATE / DELETE
against session-scoped tables. It reuses the isolated session + workspace of
Phases 9A/9B and adds a **restricted connection to a dedicated practice
database** whose physical table names are prefixed per session.

Read `docs/PHP_EXECUTION_SECURITY.md` first — this document assumes it.

## Capability model

`PracticeConfig.execution` gains a fourth value: `"mysql"` (see
`src/lib/practice/types.ts`). It is declared explicitly per program and
validated server-side, never inferred from the slug.

- `pure` — throwaway CLI process per run (Phases 1–8).
- `stateful` — raw HTTP requests inside an isolated `php -S` session; sessions
  and cookies persist per practice session (Phase 9A).
- `filesystem` — same isolated session + workspace; learner file operations
  persist like disk (Phase 9B).
- `mysql` — same isolated session + workspace plus a restricted connection to
  a dedicated practice database (Phase 9C).

Only `stateful`, `filesystem` and `mysql` programs may create practice
sessions; the session, execute and check routes accept exactly those three
capabilities.

## Why a session-scoped table prefix instead of CREATE DATABASE

Creating a fresh database per session would demand the MySQL account hold
`CREATE` at the `*.*` level (global `CREATE DATABASE` is a global privilege).
Granting that to the account the learner's code connects with is unacceptable.
Instead there is **one** practice database (`php_academy_practice`, configurable
via `MYSQL_DATABASE`) and every session receives a **random table prefix**
(`s<12 hex>_`) — e.g. `s3f9c2ab1d0e_students`. The account is granted
`CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE, INDEX, REFERENCES` on
`php_academy_practice.*` and nothing else:

```sql
CREATE DATABASE php_academy_practice;
CREATE USER 'php_academy_practice'@'localhost' IDENTIFIED BY '<a password>';
GRANT CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE, INDEX, REFERENCES
  ON php_academy_practice.* TO 'php_academy_practice'@'localhost';
FLUSH PRIVILEGES;
```

Sessions cannot collide: a session only ever sees its own prefixed tables, and
cleanup drops exactly the tables whose names start with the session's prefix.
This is `CREATE DATABASE`-free by design and documented in `.env.example`.

> Residual risk: MySQL's GRANT syntax cannot express "this prefix only", so a
> session that guesses *another session's* prefix still holds rights to those
> tables. Prefixes are 48 random bits (`crypto.randomBytes(6).toString("hex")`),
> so that is cryptographically infeasible — but the grant is prefix-agnostic at
> the DB level. This is a documented trade-off of the single-practice-DB model.

## Runtime configuration

The practice runtime reads `MYSQL_HOST` (default `127.0.0.1`), `MYSQL_PORT`
(default `3306`), `MYSQL_DATABASE` (default `php_academy_practice`), and
requires `MYSQL_USER` / `MYSQL_PASSWORD`. Parsing + validation lives in the
pure, import-free module `src/lib/practice/mysql/config.ts`
(`resolveMysqlEnvConfig`). Invalid values (bad host chars, non-numeric port,
unsafe database name, missing credentials) resolve to "not configured".

The MySQL layer is server-only and lives in
`src/lib/practice/mysql/runtime.ts`:

- `mysqlExtensionArgs()` — resolves the mysqli extension flags by probing
  `PHP_BINARY`'s directory for a sibling `ext` dir (`php_mysqli.dll` /
  `mysqli.so`); falls back to `-d extension=mysqli` when absent. Cached. The
  learner's `php -S` processes boot with these flags so `mysqli_*` is
  available.
- `isMysqlRuntimeAvailable(config)` / `resolveMysqlRuntime()` — probes the
  server with the configured credentials once per process (cached). MySQL
  practice gating funnels through this so a missing/unreachable server is
  always a typed **runtime_unavailable**, never a wrong answer.
- `seedMysqlSessionTables(config, seedTables)` — creates + seeds the session's
  tables (`students` gets deterministic rows 1 Alice 85, 2 Bob 92, 3 Carol 78;
  inserts only when the table is empty so bootstrap is repeatable).
- `cleanupMysqlSessionTables(config)` — best-effort `SHOW TABLES LIKE
  '<prefix>%'` then `DROP TABLE IF EXISTS` each.
- `snapshotMysqlRows(config, tables)` — server-side grader snapshot of the
  session's tables (see Test assertions).

Every helper runs through a direct `spawn("php", ["-n", ...extargs, "-r",
script])` with the credentials in the **process environment** (`DP_*`), never
as shell strings and never in learner-visible output. All identifiers are
validated with `isSafeSqlIdentifier` before use; a bad identifier exits the
helper instead of being interpolated. Each helper is bounded by
`MYSQL_SERVER_TIMEOUT_MS` (5 s) and enforced by a Node-side kill.

## The session config file

At session creation the manager writes `academy_db_config.php` into the
session workspace (no BOM, values single-quote escaped via
`phpStringLiteral` so nothing can break out of the file):

```php
<?php
// Generated by the PHP Academy runner for this practice session.
return array(
  "host" => "127.0.0.1",
  "port" => 3306,
  "database" => "php_academy_practice",
  "user" => "php_academy_practice",
  "password" => "<session-credential>",
  "table_prefix" => "<session-prefix>",
);
```

Learner code loads it with `$config = require __DIR__ .
"/academy_db_config.php";` and passes the values to `mysqli_connect`. The
credentials are per-session and server-side; they are **never** shipped to the
client and are redacted (`<hidden>`) from any surfaced program output (values
long enough to be meaningful, i.e. length ≥ 4, to avoid mangling ordinary
output).

## How state works

Everything from the filesystem model (sessions, workspace, multi-request
flows, per-case fresh sessions) applies unchanged. On top of that, a mysql
session's tables exist in the practice database from the moment the session is
created — empty by default, or seeded (`students`) for the update/delete
programs.

- **Reset Session** destroys the session, drops its prefixed tables
  (best-effort) and deletes the workspace.
- **Sessions expire** after `STATEFUL_SESSION_TTL_MS`; the sweep drops the
  tables and workspace.
- **Each test case** gets a brand-new session (fresh prefix + tables), so the
  grader genuinely exercises `create → recreate → drop`, `insert → insert →
  list`, `update → list`, `delete → delete → empty` flows against real
  database state.

## Test assertions

Graded tests assert up to three kinds of learner-visible state per step
(`expectedOutput` always; `expectedDb` for mysql programs):

1. Program output — `expectedOutput` (exact match via `matchesOutput`).
2. On-disk file state — `expectedFiles` (filesystem programs; see
   `docs/FILESYSTEM_PHP_EXECUTION.md`).
3. Database state — `expectedDb`, a list of `DbTableExpectation`:
   - `{ table: "students", rows: null }` — the table must **not exist**
     (e.g. after DROP).
   - `{ table: "students", rows: [] }` — the table must exist but be **empty**
     (e.g. after deleting every row).
   - `{ table: "students", rows: [{...}, ...] }` — the table must contain
     exactly those rows, compared as an **unordered multiset** of
     column-name → value maps with values normalized to strings, so numeric vs
     string cells from the driver never cause false mismatches.

`expectedDb` declares **logical** table names; the server applies the session
prefix. Table names are validated with `isSafeSqlIdentifier` in both content
and evaluator — a name with path/backtick/dot/dash characters fails the case
without ever reaching the server. Snapshotting runs inside the session's
serialized chain (same lock as requests), so it can never race the `php -S`
request that produced the state.

## The mysqli extension

PHP's `mysqli` extension is **not** compiled into every PHP distribution —
this project verifies it on first use. `mysqlExtensionArgs()` locates the
binary's `ext` directory and loads `php_mysqli.dll`/`mysqli.so` with
`-d extension_dir=… -d extension=mysqli`. The learner server, the
availability probe and all helpers use the same flags, so behavior is identical
across them. When the extension cannot be loaded the session-facing errors
surface as `runtime_unavailable` — never a fabricated wrong answer.

## Program set (5)

- `mysql-connect` — load config + `mysqli_connect`, verify, close.
- `mysql-create-table` — CREATE TABLE IF NOT EXISTS / DROP TABLE IF EXISTS /
  status via COUNT(*).
- `mysql-insert-read` — setup table, INSERT rows, SELECT back in id order.
- `mysql-update` — UPDATE by id with affected-rows semantics (seeded table).
- `mysql-delete` — DELETE by id with affected-rows semantics (seeded table).

## UI

MySQL programs are regular practice programs: side-pane shows
Not attempted / Best X/Y / Completed (they carry `statefulTestCases`). The
practice header and session strip show **Execution: MySQL PHP**. The same
four controls apply — Run, Check Solution, Reset Editor, Reset Session.

## Boundaries & residual risks

MySQL practice adds two real interfaces beyond the pure/stateful model:

- **Learner code connects to the practice database** with the session
  credentials over local TCP. `disable_functions` (process spawning),
  `open_basedir` (workspace), the gated router and `allow_url_*`
  (stream-wrapper network) all still apply — but the learner's process is
  genuinely on the wire to a MySQL server.
- **Server-side helpers run MySQL queries** (probe, seed, cleanup, snapshot)
  with the environment-injected credentials.

Documented residual risks:

1. The practice account can `CREATE/ALTER/DROP/INSERT/UPDATE/DELETE/SELECT` on
   `php_academy_practice.*` — any table in the practice DB, including another
   session's tables if a prefix is guessed (48 random bits makes that
   infeasible, but the GRANT cannot scope per prefix).
2. A learner whose code keeps a connection open could in principle issue DDL
   against the practice database beyond their session's prefix — same
   privilege as (1). The account cannot touch any other database, user, or
   `*.*`.
3. The MySQL server is expected to be the local practice server (`MYSQL_HOST`
   defaults to 127.0.0.1). Do not point this at a shared production database.
4. `open_basedir` is not a security boundary; nothing here changes that.

This stays a **teaching convenience for local development only** (the
`NODE_ENV === "development"` gate still applies), and a missing MySQL server
must always surface as `runtime_unavailable`, never a wrong answer.

## Verification

Covered by `test/mysqlRuntime.test.ts`, `test/mysqlSessionManager.test.ts`,
`test/mysqlEvaluator.test.ts` and `test/mysqlContent.test.ts` (plus the updated
`test/statefulContent.test.ts`), and the `p9c-cdp.mjs` UI harness. Live-DB
integration (real connect/seed/snapshot round-trips) is **not** exercised in
the automated suite when no MySQL server is present — the unavailable paths
are the contract in that case.