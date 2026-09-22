/**
 * Single source of truth for the local execution limits shared by the
 * runner, the API routes and the request validators. Keep every knob in
 * this file — never redefine a limit inline. See
 * docs/PHP_EXECUTION_SECURITY.md before changing any value.
 */

/** The PHP binary name resolved through PATH (CLI and built-in web server). */
export const PHP_BIN = "php";
export const MAX_SOURCE_BYTES = 64 * 1024;
export const MAX_INPUT_BYTES = 16 * 1024;
export const MAX_OUTPUT_BYTES = 64 * 1024;
export const EXECUTION_TIMEOUT_MS = 2000;

/** Wall-clock budget for booting a php -S server inside a practice session. */
export const STATEFUL_SERVER_STARTUP_MS = 2000;

/**
 * Live span of an in-memory stateful practice session (PHP sessions and the
 * cookie jar are isolated per session and sweep-destroyed after this window).
 * Sessions are a development-only convenience, not a production system.
 */
export const STATEFUL_SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Process / output-routing functions that are explicitly prohibited for
 * untrusted PHP, both in the pure CLI runner and the stateful web runner.
 * Keeping the list in one place makes the security story easy to audit.
 */
export const DISABLED_PHP_FUNCTIONS = [
  "exec",
  "system",
  "shell_exec",
  "passthru",
  "popen",
  "proc_open",
  "pcntl_exec",
].join(",");

/**
 * Name of the session cookie PHP issues for stateful executions. Excluded
 * from the "Cookies updated" counter shown to learners so the encoded id
 * never leaks into the UI or the client-visible API surface.
 */
export const SESSION_COOKIE_NAME = "PHPSESSID";