# PHP MySQL Login System (Phase 9D)

Phase 9D adds one beginner practice program, `php-mysql-login`: authenticate
against a seeded `users` table with a prepared statement, verify the submitted
password with `password_verify()`, and keep the authenticated identity across
requests with a PHP session — including a working logout.

It is a **composition** of the already-delivered Phase 9A (`stateful`
execution, `$_SESSION`/cookies) and Phase 9C (`mysql` execution, prefixed
tables, `expectedDb` snapshots). **No new auth architecture, no new capability
value, no new API route.** Read `docs/PHP_EXECUTION_SECURITY.md` and
`docs/MYSQL_PHP_EXECUTION.md` first — this document assumes both.

Scope is deliberately educational: a teaching exercise for local development
only. It explicitly does **not** ship password reset, email verification, OAuth
/ third-party login, NextAuth/Supabase, roles, password policies or any
production hardening. Those remain out of scope on purpose — see
"Boundaries & residual risks".

## Program & lesson

- Program: `src/content/programs/php-mysql-login.ts`
  (`execution: "mysql"`, `mysql.seedTables: ["users"]`, slug
  `php-mysql-login`, difficulty `beginner`).
- Lesson: `src/content/lessons/php-mysql-login.ts` (`order: 13`, immediately
  after the MySQL lesson at `order: 12`).
- Registered in `src/content/index.ts` (now 13 lessons / 18 programs).

The program teaches one specific thing: **credentials are proved, not
compared.** Learners must (1) select the user's row by username through a
prepared statement (defeats SQL injection), (2) verify the submitted password
against the stored bcrypt hash with `password_verify()` (never store or
compare plaintext), (3) only on success store the identity in `$_SESSION`
after `session_regenerate_id(true)` (defeats session fixation), (4) report
`AUTHENTICATED as <user>` on status from the session, and (5) clear
`$_SESSION`, expire the cookie and `session_destroy()` on logout.

Output contract (exact tokens the grader matches):

| Action   | Result                    |
|----------|---------------------------|
| `login` success | `LOGIN_SUCCESS`     |
| `login` failure | `LOGIN_FAILED`     |
| `status` logged in | `AUTHENTICATED as <username>` |
| `status` logged out | `UNAUTHORIZED`  |
| `logout` | `LOGGED_OUT`              |

## The seeded `users` table

`seedMysqlSessionTables()` (`src/lib/practice/mysql/runtime.ts`) gained a
`users` branch in its `SEED_SCRIPT`. It creates the session-prefixed table

```sql
CREATE TABLE IF NOT EXISTS <prefix>users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
```

and, **only when the table is empty** (so bootstrap stays repeatable), inserts
the two practice accounts via a prepared statement with bound parameters.

The rows are supplied to the helper through the `DP_USERS` environment
variable — a JSON array of `{ username, hash }` built by
`loginUsersSeedJson()`. **The plaintexts never enter the helper's
environment, the PHP source, or any log.** Only `seedTables` containing
`"users"` injects `DP_USERS`; the `students` path is untouched.

### Deterministic hashes → `expectedDb` can assert `users` exactly

Bcrypt hashes embed their own salt. Phase 9D therefore ships **fixed,
pre-computed bcrypt digests** (cost 12) rather than calling `password_hash()`
at seed time:

```ts
// src/lib/practice/mysql/loginSeed.ts (server-only)
LOGIN_SEED_USERS = [
  { username: "alice", password: "alice2564",
    passwordHash: "$2y$12$mv5xig3JrzdpsJ68HfyHsub/TrpE.anpoILsKE5oH71gC08HpSN.W" },
  { username: "bob",   password: "bob8753",
    passwordHash: "$2y$12$Qb1SDkQ0NwwpjZwXeXL8OOQfzkqI/fwEvzgxNhHPdy6YDC7N2tQV2" },
];
```

Because the digests are constant, every session seeds **byte-identical rows**.
That means `expectedDb` for `users` is exact (same reasoning as the `students`
seed) — this phase therefore does **not** need an `expectedDb` exemption for
the login program, and `test/phpMysqlLogin.test.ts` locks the two sides
together (content hash ⇔ `LOGIN_SEED_USERS` hash) so they cannot drift
independently. The hashes are not secret and are safe to appear in shipped
content; the plaintexts are secret (below).

Verified in PHP (`password_verify`) at authoring time: correct plaintexts
return `true`, a wrong password returns `false`.

## Keeping plaintexts out of shipped content

Practice content (`@/content`) is imported by client components, so anything
in a program/lesson file reaches the browser. The test-step inputs therefore
reference a **placeholder token**, never the password itself:

```
{{PASSWORD:alice}}     {{PASSWORD:bob}}
```

- Content declares `inputs` with an empty password field (no default
  plaintext anywhere — `test/phpMysqlLogin.test.ts` asserts this over every
  program's serialized fields).
- Only the **check route** resolves tokens. `src/app/api/practice/check/route.ts`
  passes `resolveRunInputs: resolveLoginSeedTokens` into the evaluator's deps;
  `evaluateStatefulSolution` applies it **only to the inputs actually
  executed** (`runStep`). The recorded `inputs` in `TestCaseResult` keep the
  token, so neither the API response nor the UI ever sees the plaintext.
- The stateful **execute route** (`/api/practice/stateful/execute`, the manual
  Run path) is deliberately **not** wrapped: the learner types real passwords
  there themselves, and leaving it honest keeps Run indistinguishable from a
  normal POST. The resolver is a no-op for non-token values anyway.
- `sanitizeMysqlText()` (`src/lib/practice/stateful/runner.ts`) now also
  redacts `LOGIN_SEED_PASSWORDS` (length ≥ 4, `<hidden>` marker). A learner
  script that prints `$_POST["password"]` cannot surface the submitted seed
  password in its output.

Server-only placement: `src/lib/practice/mysql/loginSeed.ts` must never be
imported by content, client components, or anything that serializes
learner-visible metadata (documented at the top of the file).

## Grading

Eight designed scenarios, each a fresh session with fresh prefixed tables
(single-fresh-session semantics inherited from Phase 9A):

1. Correct credentials authenticate Alice (`LOGIN_SUCCESS`, plus `expectedDb`
   asserting both seeded rows unchanged).
2. Wrong password is rejected (`LOGIN_FAILED`).
3. Unknown user is rejected (`LOGIN_FAILED`).
4. SQL injection in the username — `' OR '1'='1` — stays a failed login
   (`LOGIN_FAILED`, plus `expectedDb`: the table is untouched). A naive
   concatenated query would match a row; a prepared statement binds the value
   as data, and `password_verify` still fails.
5. Login survives the next request (login → status = `AUTHENTICATED as alice`).
6. Login → logout reports `LOGGED_OUT`.
7. Login → logout → status reports `UNAUTHORIZED`.
8. User isolation: Bob authenticates as himself (`AUTHENTICATED as bob`), not
   Alice.

`expectedDb` entries reference the logical table `"users"` (added to
`KNOWN_TABLES` in `test/statefulContent.test.ts`); the server applies the
session prefix and snapshots through the same
`snapshotMysqlRows()`/`dbStateMatch()` multiset comparison as every other
mysql program. `users` rows are compared with all three columns
(`id`, `username`, `password_hash`) as strings.

## Files touched by this phase

- **New:** `src/lib/practice/mysql/loginSeed.ts`,
  `src/content/programs/php-mysql-login.ts`,
  `src/content/lessons/php-mysql-login.ts`, `test/phpMysqlLogin.test.ts`,
  `docs/PHP_MYSQL_LOGIN.md` (this file), `p9d-cdp.mjs`.
- **Modified:** `src/lib/practice/mysql/runtime.ts` (`users` SEED_SCRIPT
  branch + `DP_USERS` env), `src/lib/practice/stateful/runner.ts`
  (`sanitizeMysqlText` redacts seed passwords),
  `src/app/api/practice/check/route.ts` (`resolveRunInputs`),
  `src/lib/practice/statefulEvaluator.ts` (`resolveRunInputs` dep, applied at
  the execution boundary only), `src/content/index.ts` (registration),
  `test/statefulContent.test.ts` (six programs, scenario counts, `users`
  table, seed assertions), `docs/MYSQL_PHP_EXECUTION.md`,
  `docs/PHP_EXECUTION_SECURITY.md`.

## Boundaries & residual risks

1. **Educational only.** This is a local-dev teaching exercise, not an
   authentication system. There is no password reset, no email verification,
   no rate limiting or lockout, no CSRF token on the login form, no password
   policy, no MFA, no OAuth/third-party login, no roles/authorization, no
   NextAuth/Supabase/Passport integration, no account lockout or session
   invalidation across devices. Presenting any of that as "how to build
   production auth" would be wrong — the lesson says so explicitly.
2. **The two plaintexts are developer-known.** `alice2564`/`bob8753` are
   fixed teaching credentials for a seeded local table. They are a documented,
   deliberate property of the fixture, not a secret that could be
   compromised — but they must never be reused for anything real, and they
   never appear in shipped content (enforced by test).
3. **Plaintext reachability is bounded, not eliminated.** The check route
   resolves tokens server-side and the runner redacts seed passwords from
   surfaced output, but the learner's own PHP process legitimately receives
   the submitted password in `$_POST` — that is the exercise. Nothing here
   makes the local PHP process trustworthy; see the standing caveats in
   `docs/PHP_EXECUTION_SECURITY.md`.
4. **MySQL availability.** If the practice MySQL server is absent or
   unreachable, grading reports a typed `runtime_unavailable` — never a wrong
   answer. The automated suite in this environment (no MySQL server) exercises
   the unavailable path and the pure content/seed/resolver contracts; live
   connect → seed → login → snapshot round-trips are exercised only when a
   server is configured (see `test/mysqlRuntime.test.ts`,
   `test/mysqlSessionManager.test.ts`, `test/mysqlEvaluator.test.ts`, and the
   `p9d-cdp.mjs` harness, which probes for a server first).
5. **Dev-only, as always.** The `NODE_ENV === "development"` gate on every
   execution path still applies. Nothing in this phase weakens it.

## Verification

- `npm test` — `test/phpMysqlLogin.test.ts` (seed registry, token resolver,
  no-plaintext-in-content, hash↔seed drift, scenario names, sanitize
  redaction) plus the updated `test/statefulContent.test.ts` contract.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `p9d-cdp.mjs` (in `C:\Users\Tabiq\AppData\Local\Temp\opencode\`) drives the
  real UI over CDP: program list contains the sixth mysql program, lesson
  order 13, Check Solution on the reference solution, and reports MySQL
  availability honestly rather than asserting a pass without a server.
