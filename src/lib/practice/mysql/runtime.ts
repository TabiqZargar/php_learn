/**
 * SERVER-ONLY MySQL practice runtime (Phase 9C). Read
 * docs/MYSQL_PHP_EXECUTION.md before changing anything here.
 *
 * This module is the ONLY place allowed to talk to MySQL on behalf of
 * practice sessions. It spawns small, read-only PHP helper snippets with the
 * practice credentials passed over the process environment — never through
 * shell strings, never into learner code, and never out to the client.
 *
 * The learner's OWN program (inside the php -S sandbox) connects through the
 * same credentials via a generated `academy_db_config.php` file in its
 * session workspace. This module covers the trusted side: availability probe,
 * session seeding, session cleanup and grader snapshots.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { sandboxEnv } from "../localPhpRunner.ts";
import { MYSQL_SERVER_TIMEOUT_MS, PHP_BIN } from "../limits.ts";
import { isSafeSqlIdentifier, resolveMysqlEnvConfig } from "./config.ts";
import type { MysqlEnvConfig } from "./config.ts";
import { loginUsersSeedJson } from "./loginSeed.ts";

/**
 * The per-session database configuration. `tablePrefix` scopes every table of
 * this session inside the single practice database so sessions cannot
 * collide. Stored on the (server-side) session record — never serialized to
 * the client metadata.
 */
export interface MysqlSessionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  /** Physical table prefix, e.g. "s3f9c2ab1d0e_". Random per session. */
  tablePrefix: string;
}

/** Raised when MySQL practice cannot be used (unconfigured or unreachable). */
export class MysqlRuntimeUnavailableError extends Error {}

export interface MysqlRuntimeStatus {
  available: boolean;
  reason?: string;
}

const PREFIX_RE = /^s[0-9a-f]{8,64}_$/;

function envFor(config: MysqlEnvConfig | MysqlSessionConfig, extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...sandboxEnv(),
    DP_HOST: config.host,
    DP_PORT: String(config.port),
    DP_DB: config.database,
    DP_USER: config.user,
    DP_PASS: config.password,
    DP_PREFIX: "tablePrefix" in config ? config.tablePrefix : "",
    ...extra,
  };
}

/** Spawn a PHP helper snippet and return its output; never rejects. */
async function runMysqlPhp(
  script: string,
  env: NodeJS.ProcessEnv,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const args = ["-n", ...(await mysqlExtensionArgs()), "-r", script];
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(PHP_BIN, args, {
        env,
        stdio: ["ignore", "pipe", "pipe"] as const,
        windowsHide: true,
      });
    } catch {
      resolve({ exitCode: -1, stdout: "", stderr: "" });
      return;
    }
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // Already gone.
      }
    }, MYSQL_SERVER_TIMEOUT_MS);
    child.stdout?.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", () => {
      clearTimeout(timer);
      resolve({ exitCode: -1, stdout: "", stderr: "" });
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? -1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

/* -------------------------------------------------------------------- */
/* mysqli extension loading                                              */
/* -------------------------------------------------------------------- */

let cachedExtensionArgs: string[] | null = null;
let cachedPhpBinaryDir: string | null | undefined;

async function phpBinaryDirectory(): Promise<string | null> {
  if (cachedPhpBinaryDir !== undefined) return cachedPhpBinaryDir;
  const { stdout } = await runRawPhp(["-n", "-r", "echo PHP_BINARY;"]);
  const binary = stdout.trim();
  cachedPhpBinaryDir = binary ? dirname(binary) : null;
  return cachedPhpBinaryDir;
}

/**
 * Raw PHP spawn used only to locate the binary's directory. Runs without the
 * mysql extension (the probe below runs with it) and never rejects.
 */
function runRawPhp(args: string[]): Promise<{ stdout: string }> {
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(PHP_BIN, args, {
        env: sandboxEnv(),
        stdio: ["ignore", "pipe", "ignore"] as const,
        windowsHide: true,
      });
    } catch {
      resolve({ stdout: "" });
      return;
    }
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // Already gone.
      }
    }, MYSQL_SERVER_TIMEOUT_MS);
    child.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.once("error", () => {
      clearTimeout(timer);
      resolve({ stdout: "" });
    });
    child.once("close", () => {
      clearTimeout(timer);
      resolve({ stdout: Buffer.concat(chunks).toString("utf8") });
    });
  });
}

/**
 * PHP flags that enable the mysqli extension for EVERY PHP spawn in a mysql
 * practice session (the learner's php -S server, probes and helpers). The
 * binary's sibling `ext` directory is preferred because it is where the
 * extension lives in official Windows/POSIX builds; when it cannot be found
 * the extension is requested by name and PHP's own extension_dir is used.
 */
export async function mysqlExtensionArgs(): Promise<string[]> {
  if (cachedExtensionArgs) return cachedExtensionArgs;
  const binDir = await phpBinaryDirectory();
  if (binDir) {
    const extDir = join(binDir, "ext");
    if (existsSync(join(extDir, "php_mysqli.dll")) || existsSync(join(extDir, "mysqli.so"))) {
      cachedExtensionArgs = [
        "-d",
        `extension_dir=${extDir}`,
        "-d",
        "extension=mysqli",
      ];
      return cachedExtensionArgs;
    }
  }
  cachedExtensionArgs = ["-d", "extension=mysqli"];
  return cachedExtensionArgs;
}

/* -------------------------------------------------------------------- */
/* Availability probe                                                    */
/* -------------------------------------------------------------------- */

const CONNECT_PROBE_SCRIPT = `<?php
$conn = @mysqli_connect(getenv("DP_HOST"), getenv("DP_USER"), getenv("DP_PASS"), getenv("DP_DB"), (int) getenv("DP_PORT"));
if (!$conn) { exit(1); }
exit(0);
`;

let cachedProbe: { trust: boolean; result: MysqlRuntimeStatus } | null = null;

/**
 * True (cached per process) when a MySQL server answers with the configured
 * credentials. All MySQL practice gating funnels through this so "missing
 * infra" is always a typed runtime_unavailable, never a wrong answer.
 */
export async function isMysqlRuntimeAvailable(
  config: MysqlEnvConfig,
): Promise<MysqlRuntimeStatus> {
  if (cachedProbe?.trust) return cachedProbe.result;
  const outcome = await runMysqlPhp(CONNECT_PROBE_SCRIPT, envFor(config));
  const status: MysqlRuntimeStatus = outcome.exitCode === 0
    ? { available: true }
    : { available: false, reason: "The MySQL practice server is not reachable with the configured credentials." };
  cachedProbe = { trust: status.available, result: status };
  return status;
}

/**
 * Resolve the environment config and verify the server in one call. Returns
 * the validated config on success or a reason string on failure. This is the
 * single entry point the session manager uses to gate session creation.
 */
export async function resolveMysqlRuntime(): Promise<
  | { ok: true; config: MysqlEnvConfig }
  | { ok: false; reason: string }
> {
  const config = resolveMysqlEnvConfig(process.env);
  if (!config) {
    return {
      ok: false,
      reason: "MySQL practice is not configured. Set MYSQL_USER and MYSQL_PASSWORD (and optionally MYSQL_HOST/MYSQL_PORT/MYSQL_DATABASE) in the server environment.",
    };
  }
  const status = await isMysqlRuntimeAvailable(config);
  if (!status.available) return { ok: false, reason: status.reason ?? "MySQL practice is unavailable." };
  return { ok: true, config };
}

/* -------------------------------------------------------------------- */
/* Seeding (session creation for seeded programs)                        */
/* -------------------------------------------------------------------- */

const SEED_SCRIPT = `<?php
$conn = @mysqli_connect(getenv("DP_HOST"), getenv("DP_USER"), getenv("DP_PASS"), getenv("DP_DB"), (int) getenv("DP_PORT"));
if (!$conn) { fwrite(STDERR, "ERR_CONNECT"); exit(1); }
mysqli_set_charset($conn, "utf8mb4");
$prefix = getenv("DP_PREFIX");
if (!preg_match('/^s[0-9a-f]{8,64}_$/', $prefix)) { fwrite(STDERR, "ERR_PREFIX"); exit(2); }
foreach (explode("|", getenv("DP_TABLES")) as $logical) {
    if (!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/', $logical)) { fwrite(STDERR, "ERR_NAME"); exit(2); }
    $full = $prefix . $logical;
    if ($logical === "students") {
        $q = @mysqli_query($conn, "CREATE TABLE IF NOT EXISTS \`$full\` (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, grade INT NOT NULL)");
        if (!$q) { fwrite(STDERR, "ERR_DDL"); exit(3); }
        $count = @mysqli_query($conn, "SELECT COUNT(*) AS n FROM \`$full\`");
        if ($count) {
            $row = mysqli_fetch_assoc($count);
            if ((int) $row["n"] === 0) {
                mysqli_query($conn, "INSERT INTO \`$full\` (id, name, grade) VALUES (1, 'Alice', 85), (2, 'Bob', 92), (3, 'Carol', 78)");
            }
        }
    } elseif ($logical === "users") {
        $q = @mysqli_query($conn, "CREATE TABLE IF NOT EXISTS \`$full\` (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL)");
        if (!$q) { fwrite(STDERR, "ERR_DDL"); exit(3); }
        $count = @mysqli_query($conn, "SELECT COUNT(*) AS n FROM \`$full\`");
        if ($count) {
            $row = mysqli_fetch_assoc($count);
            if ((int) $row["n"] === 0) {
                $users = json_decode(getenv("DP_USERS"), true);
                if (!is_array($users)) { fwrite(STDERR, "ERR_USERS"); exit(4); }
                $stmt = mysqli_prepare($conn, "INSERT INTO \`$full\` (id, username, password_hash) VALUES (?, ?, ?)");
                if (!$stmt) { fwrite(STDERR, "ERR_DDL"); exit(3); }
                $index = 1;
                foreach ($users as $entry) {
                    if (!is_array($entry)) { fwrite(STDERR, "ERR_USERS"); exit(4); }
                    $id = $index++;
                    $username = (string) ($entry["username"] ?? "");
                    $hash = (string) ($entry["hash"] ?? "");
                    if (!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/', $username)) { fwrite(STDERR, "ERR_USERS"); exit(4); }
                    mysqli_stmt_bind_param($stmt, "iss", $id, $username, $hash);
                    if (!mysqli_stmt_execute($stmt)) { fwrite(STDERR, "ERR_DDL"); exit(3); }
                }
                mysqli_stmt_close($stmt);
            }
        }
    }
}
mysqli_close($conn);
exit(0);
`;

/**
 * Create + seed the session's physical tables. Deterministic seed rows are
 * injected only into an empty table, so bootstrap is safe to repeat.
 */
export async function seedMysqlSessionTables(
  config: MysqlSessionConfig,
  seedTables: readonly string[],
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!PREFIX_RE.test(config.tablePrefix)) {
    return { ok: false, reason: "Invalid session table prefix." };
  }
  for (const name of seedTables) {
    if (!isSafeSqlIdentifier(name)) {
      return { ok: false, reason: `Invalid seed table name "${name}".` };
    }
  }
  const outcome = await runMysqlPhp(
    SEED_SCRIPT,
    envFor(config, {
      DP_TABLES: seedTables.join("|"),
      ...(seedTables.includes("users") ? { DP_USERS: loginUsersSeedJson() } : {}),
    }),
  );
  if (outcome.exitCode !== 0) {
    return {
      ok: false,
      reason: "The practice database could not be seeded for this session.",
    };
  }
  return { ok: true };
}

/* -------------------------------------------------------------------- */
/* Cleanup (session destruction)                                         */
/* -------------------------------------------------------------------- */

const CLEANUP_SCRIPT = `<?php
$conn = @mysqli_connect(getenv("DP_HOST"), getenv("DP_USER"), getenv("DP_PASS"), getenv("DP_DB"), (int) getenv("DP_PORT"));
if (!$conn) { exit(0); }
$prefix = getenv("DP_PREFIX");
if (!preg_match('/^s[0-9a-f]{8,64}_$/', $prefix)) { exit(0); }
$res = @mysqli_query($conn, "SHOW TABLES LIKE '" . $prefix . "%'");
if ($res) {
    while (($row = mysqli_fetch_row($res)) !== null) {
        @mysqli_query($conn, "DROP TABLE IF EXISTS \`" . $row[0] . "\`");
    }
}
mysqli_close($conn);
exit(0);
`;

/**
 * Best-effort removal of a session's physical tables (all tables matching its
 * prefix in the practice database). Never rejects; failures keep the session
 * workspace cleanup path from being blocked.
 */
export async function cleanupMysqlSessionTables(
  config: MysqlSessionConfig,
): Promise<void> {
  if (!PREFIX_RE.test(config.tablePrefix)) return;
  await runMysqlPhp(CLEANUP_SCRIPT, envFor(config));
}

/* -------------------------------------------------------------------- */
/* Grader snapshot (expectedDb assertions)                               */
/* -------------------------------------------------------------------- */

const SNAPSHOT_SCRIPT = `<?php
$conn = @mysqli_connect(getenv("DP_HOST"), getenv("DP_USER"), getenv("DP_PASS"), getenv("DP_DB"), (int) getenv("DP_PORT"));
if (!$conn) { echo "ERR_CONNECT"; exit(1); }
mysqli_set_charset($conn, "utf8mb4");
$prefix = getenv("DP_PREFIX");
if (!preg_match('/^s[0-9a-f]{8,64}_$/', $prefix)) { echo "ERR_PREFIX"; exit(2); }
$out = array();
foreach (explode("|", getenv("DP_TABLES")) as $logical) {
    if (!preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/', $logical)) { echo "ERR_NAME"; exit(2); }
    $full = $prefix . $logical;
    $res = @mysqli_query($conn, "SELECT * FROM \`" . $full . "\`");
    if ($res === false) { $out[$logical] = false; continue; }
    $rows = array();
    while (($row = mysqli_fetch_assoc($res)) !== null) { $rows[] = $row; }
    $out[$logical] = $rows;
}
mysqli_close($conn);
echo json_encode($out);
exit(0);
`;

export interface MysqlTableSnapshot {
  /** true when the table exists (created or seeded), false when missing. */
  exists: boolean;
  /** Every row as column-name -> value (missing tables yield []). */
  rows: Record<string, string>[];
}

export async function snapshotMysqlRows(
  config: MysqlSessionConfig,
  logicalTables: readonly string[],
): Promise<{ ok: true; tables: Record<string, MysqlTableSnapshot> } | { ok: false; reason: string }> {
  if (!PREFIX_RE.test(config.tablePrefix)) {
    return { ok: false, reason: "Invalid session table prefix." };
  }
  for (const name of logicalTables) {
    if (!isSafeSqlIdentifier(name)) {
      return { ok: false, reason: `Invalid snapshot table name "${name}".` };
    }
  }
  const outcome = await runMysqlPhp(
    SNAPSHOT_SCRIPT,
    envFor(config, { DP_TABLES: logicalTables.join("|") }),
  );
  if (outcome.exitCode !== 0) {
    return {
      ok: false,
      reason: "The practice database could not be queried while grading the solution.",
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(outcome.stdout);
  } catch {
    return {
      ok: false,
      reason: "The practice database returned an unreadable response while grading.",
    };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "The practice database returned an unexpected response." };
  }
  const tables: Record<string, MysqlTableSnapshot> = {};
  for (const logical of logicalTables) {
    const value = (parsed as Record<string, unknown>)[logical];
    if (value === false) {
      tables[logical] = { exists: false, rows: [] };
    } else if (Array.isArray(value)) {
      tables[logical] = {
        exists: true,
        rows: value.map((row) => {
          const normalized: Record<string, string> = {};
          if (typeof row === "object" && row !== null && !Array.isArray(row)) {
            for (const [key, cell] of Object.entries(row as Record<string, unknown>)) {
              normalized[key] = String(cell);
            }
          }
          return normalized;
        }),
      };
    } else {
      return { ok: false, reason: "The practice database returned an unexpected row shape." };
    }
  }
  return { ok: true, tables };
}