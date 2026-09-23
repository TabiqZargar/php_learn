/**
 * Pure parsing of the MySQL practice runtime configuration. This module does
 * NOT touch DNS, sockets, PHP or the filesystem — it only turns environment
 * variables into a validated, tightly-scoped configuration object, or null.
 *
 * The values are server-side secrets: they are injected into a session-owned
 * configuration file at session creation and are never shipped to the client
 * (see docs/MYSQL_PHP_EXECUTION.md). Keep this module import-free of Node and
 * React so it is unit-testable in any runtime.
 */

export interface MysqlEnvConfig {
  /** Defaults to 127.0.0.1 — the practice server is a local MySQL only. */
  host: string;
  /** Defaults to 3306; a reasonable TCP port or null when malformed. */
  port: number;
  /** Single dedicated practice database; grants are scoped to it only. */
  database: string;
  /** Low-privilege MySQL account. Required. */
  user: string;
  /** Password for the account above. Required. */
  password: string;
}

const HOST_RE = /^[A-Za-z0-9.:[\]\-]+$/;
const DATABASE_RE = /^[A-Za-z0-9_]{1,64}$/;

/**
 * Read + validate the MySQL environment. Every value that ends up embedded in
 * a generated PHP file must be checked here first so nothing hostile (newlines
 * included) can ever reach the config file or a SQL string.
 */
export function resolveMysqlEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): MysqlEnvConfig | null {
  const host = env.MYSQL_HOST?.trim() || "127.0.0.1";
  if (!HOST_RE.test(host)) return null;

  const portRaw = env.MYSQL_PORT?.trim();
  const port =
    portRaw === undefined || portRaw === ""
      ? 3306
      : Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  const database = env.MYSQL_DATABASE?.trim() || "php_academy_practice";
  if (!DATABASE_RE.test(database)) return null;

  const user = env.MYSQL_USER?.trim() ?? "";
  const password = env.MYSQL_PASSWORD ?? "";
  if (user.length === 0 || password.length === 0) return null;

  return { host, port, database, user, password };
}

/**
 * A bare SQL identifier a content author (or the server) is allowed to use:
 * starts with a letter, then word characters, bounded length. Backticks,
 * dots, dashes, prefixes and spaces are all rejected so nothing can break
 * out of a quoted table name.
 */
export function isSafeSqlIdentifier(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name);
}

/**
 * Render a PHP single-quoted string literal safely. Escapes backslashes,
 * single quotes and newlines so a password/host value can never smuggle PHP
 * syntax into the generated configuration file.
 */
export function phpStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")}'`;
}