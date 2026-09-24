# PHP Academy

A Windows-XP-inspired desktop that teaches PHP through practical exercises.
Everything runs on your local machine — no cloud, no accounts, no tracking.

## What you can do

- **13 lessons** — interactive, sequential content from PHP basics through
  MySQL, sessions, cookies and a full login exercise.
- **18 practice programs** — each with a problem statement, an editor, an
  Input panel, a Run action, a graded Check Solution and progressive hints.
  Some programs are view-only by design (visible solutions, no grader).
- **Four execution capabilities**, all sandboxed locally:

  | Capability | Runs as | Program examples |
  | --- | --- | --- |
  | `pure` | `php -n program.php arg…` (CLI) | Largest Number, Factorial, Array Sorting |
  | `stateful` | fresh `php -S` per request + session/cookie jar | PHP Session Login / Logout, PHP Cookies |
  | `filesystem` | `php -S` inside an isolated workspace | Write/Append/Delete `academy.txt` |
  | `mysql` | `php -S` + real `mysqli` against a practice DB | MySQL exercises + PHP MySQL Login |

- **Local progress & resume** — lesson completion, best scores, hint
  reveal levels and the last-opened item persist in the browser
  (`localStorage`, key `php-academy-progress:v1`). Nothing is sent anywhere.

## Requirements

- **Node.js** (the app itself).
- **PHP CLI 8.x** on the `PATH` for `pure` exercises. Sessions, cookies,
  filesystem and MySQL exercises also need it; without PHP every execution
  honestly reports `runtime_unavailable`.

### Optional: MySQL practice environment

The six `mysql` programs need a MySQL/MariaDB server plus env vars on the
server process:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=academy
MYSQL_PASSWORD=…
MYSQL_DATABASE=php_academy_practice
```

A dedicated practice database is **required** — the app provisions
session-prefixed tables inside it and never touches real data. When it is
missing or unreachable, sessions fail with a clear 503 notice and Check
Solution reports `runtime_unavailable` instead of a wrong answer. See
`docs/MYSQL_PHP_EXECUTION.md`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run the full Node test suite |
| `npm run lint` | ESLint over the codebase |
| `npm run build` | Production build (PHP execution is disabled in production) |
| `npm run start` | Serve the production build |

## Security model

Student PHP runs unprivileged on **your own machine** and only in
development mode. Key guardrails (full detail in
`docs/PHP_EXECUTION_SECURITY.md`):

- `child_process.spawn()` with an explicit argument array — never a shell.
- Throwaway temp directories deleted after every run; host temp paths are
  scrubbed from all surfaced output.
- `open_basedir`, `disable_functions`, `allow_url_fopen=0`, 2 s timeout,
  64 KB output/source caps and a 16 KB input cap.
- MySQL credentials are server-only and passed via process env; seed
  passwords/hashes never reach the browser; login-seed tokens are resolved
  only server-side at the Check boundary.
- In production (`next build` + `npm start`) every execution is disabled.

## Documentation

- `docs/PHP_EXECUTION_SECURITY.md` — the security boundary.
- `docs/STATEFUL_PHP_EXECUTION.md` — sessions/cookies runner.
- `docs/FILESYSTEM_PHP_EXECUTION.md` — filesystem capability.
- `docs/MYSQL_PHP_EXECUTION.md` — MySQL capability & setup.
- `docs/PHP_MYSQL_LOGIN.md` — the login exercise and seed handling.
- `docs/PROGRESS_ARCHITECTURE.md` — local progress & resume.