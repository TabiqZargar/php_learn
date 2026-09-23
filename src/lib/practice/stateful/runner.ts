/**
 * SECURITY BOUNDARY — server-only. Read docs/STATEFUL_PHP_EXECUTION.md and
 * docs/PHP_EXECUTION_SECURITY.md before changing anything here.
 *
 * Runs one untrusted PHP request inside an already-isolated practice session.
 * Every request boots a FRESH php -S server bound to 127.0.0.1 on an
 * ephemeral port, serves the request through a gated router, then kills the
 * server in a finally. HTTP semantics are real, so PHP sessions, cookies and
 * header/body ordering behave exactly like a web request.
 *
 * MySQL practice sessions boot the server with the mysqli extension loaded so
 * learner code can connect through the session's academy_db_config.php;
 * session-scoped secrets are redacted from any surfaced output.
 *
 * Hard guarantees layered on top of the Phase 1–8 pure runner:
 *   - open_basedir = the session workspace only (no project or home reads)
 *   - session.save_path = <workspace>/sess (no host session dir, isolated)
 *   - disable_functions = exec/system/shell_exec/passthru/popen/proc_open/...
 *   - allow_url_fopen=0 / allow_url_include=0 (no network or remote code)
 *   - no shell anywhere; spawn() is called directly with literal arguments
 *   - the router only accepts POST requests presenting the workspace token
 *   - server logs are swallowed; host paths are stripped from any surfaced text
 */
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import { join } from "node:path";
import { isPhpAvailable, sandboxEnv } from "../localPhpRunner.ts";
import { mysqlExtensionArgs } from "../mysql/runtime.ts";
import {
  DISABLED_PHP_FUNCTIONS,
  EXECUTION_TIMEOUT_MS,
  MAX_INPUT_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_BYTES,
  PHP_BIN,
  STATEFUL_SERVER_STARTUP_MS,
} from "../limits.ts";
import type { PracticeResultStatus } from "../types.ts";
import type { StatefulPhpResponse, StatefulPracticeSession } from "./types.ts";

export interface ExecuteStatefulRequest {
  session: StatefulPracticeSession;
  /** Learner source, written into the workspace as program.php. */
  code: string;
  /** POST form fields carried on this request. */
  inputs: Record<string, string>;
  /** Serialized Cookie header read from the session's cookie jar. */
  cookieHeader: string;
}

const REQUEST_URL_ROOT = "http://127.0.0.1";

function statusResponse(
  status: PracticeResultStatus,
  message?: string,
): StatefulPhpResponse {
  return {
    status,
    stdout: "",
    stderr: "",
    executionTimeMs: 0,
    setCookieHeaders: [],
    message,
  };
}

/** Strip the temp workspace path from any surfaced text. */
function sanitizeWorkspaceText(text: string, workspacePath: string): string {
  const fileTarget = join(workspacePath, "program.php");
  let sanitized = text.split(fileTarget).join("program.php");
  sanitized = sanitized.split(fileTarget.replaceAll("\\", "/")).join("program.php");
  sanitized = sanitized.split(workspacePath).join("<workspace>");
  sanitized = sanitized.split(workspacePath.replaceAll("\\", "/")).join("<workspace>");
  return sanitized;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

function waitForServer(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.connect({ port, host: "127.0.0.1" });
      socket.setTimeout(200);
      socket.unref();
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          resolve(false);
        } else {
          setTimeout(attempt, 60);
        }
      });
      socket.once("timeout", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          resolve(false);
        } else {
          setTimeout(attempt, 60);
        }
      });
    };
    attempt();
  });
}

function killProcess(child: ReturnType<typeof spawn>): void {
  if (!child.pid) return;
  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        // Already gone.
      }
    }
  } else {
    try {
      child.kill();
    } catch {
      // Already gone.
    }
  }
}

/**
 * Kill the php -S server and wait for its process to fully detach before the
 * request returns. On Windows the workspace files stay locked until the OS
 * releases the process handle; awaiting close prevents session cleanup races.
 */
async function stopServer(child: ReturnType<typeof spawn>): Promise<void> {
  killProcess(child);
  if (process.platform !== "win32") return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 750);
    timer.unref?.();
    child.once("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function phpServerArgs(session: StatefulPracticeSession, port: number, mysqlExtensionArgs: string[]): string[] {
  return [
    "-n",
    ...mysqlExtensionArgs,
    "-d", "display_errors=1",
    "-d", "display_startup_errors=1",
    "-d", "error_reporting=32767",
    "-d", "memory_limit=64M",
    "-d", "max_execution_time=2",
    "-d", "allow_url_fopen=0",
    "-d", "allow_url_include=0",
    "-d", `session.save_path=${join(session.workspacePath, "sess")}`,
    "-d", `open_basedir=${session.workspacePath}`,
    "-d", `disable_functions=${DISABLED_PHP_FUNCTIONS}`,
    "-S", `${REQUEST_URL_ROOT.replace("http://", "")}:${port}`,
    join(session.workspacePath, "router.php"),
  ];
}

/**
 * Redact session-scoped MySQL secrets (password, table prefix, credentials)
 * from any text surfaced back to the learner. Only values long enough to be
 * meaningful are scrubbed so single-character tokens cannot mangle ordinary
 * output; each scrubbed value becomes the shared <hidden> marker.
 */
export function sanitizeMysqlText(text: string, session: StatefulPracticeSession): string {
  if (!session.mysql) return text;
  const secrets = [
    session.mysql.password,
    session.mysql.tablePrefix,
    session.mysql.user,
    session.mysql.database,
  ].filter((value) => value.length >= 4);
  let sanitized = text;
  for (const secret of secrets) {
    sanitized = sanitized.split(secret).join("<hidden>");
  }
  return sanitized;
}

async function readResponseBody(response: Response): Promise<{
  body: string;
  status: "ok" | "output_limit" | "aborted";
}> {
  if (!response.body) return { body: "", status: "ok" };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      bytes += value.byteLength;
      if (bytes > MAX_OUTPUT_BYTES) {
        await reader.cancel();
        return { body: Buffer.concat(chunks).toString("utf8"), status: "output_limit" };
      }
      chunks.push(value);
    }
  } catch (error) {
    if (isAbortError(error)) return { body: "", status: "aborted" };
    throw error;
  } finally {
    reader.releaseLock();
  }
  return { body: Buffer.concat(chunks).toString("utf8"), status: "ok" };
}

/**
 * Execute exactly one stateful request. Resolves for every path and never
 * rejects. A brand-new php -S server is started per request and always killed.
 */
export async function runStatefulRequest(
  request: ExecuteStatefulRequest,
): Promise<StatefulPhpResponse> {
  if (process.env.NODE_ENV !== "development") {
    return statusResponse(
      "execution_disabled",
      "PHP execution is only available on the local development server.",
    );
  }

  if (request.code.length > MAX_SOURCE_BYTES) {
    return statusResponse(
      "invalid_request",
      `The submitted code exceeds the ${MAX_SOURCE_BYTES / 1024} KB limit.`,
    );
  }

  const inputBytes = Object.entries(request.inputs).reduce(
    (sum, [key, value]) => sum + Buffer.byteLength(key, "utf8") + Buffer.byteLength(value, "utf8"),
    0,
  );
  if (inputBytes > MAX_INPUT_BYTES) {
    return statusResponse(
      "invalid_request",
      `The combined input exceeds the ${MAX_INPUT_BYTES / 1024} KB limit.`,
    );
  }

  if (!(await isPhpAvailable())) {
    return statusResponse(
      "runtime_unavailable",
      "PHP CLI is not installed or is not available on the PATH.",
    );
  }

  const { session } = request;
  await writeFile(join(session.workspacePath, "program.php"), request.code, "utf8");

  const token = (await readFile(join(session.workspacePath, "__token.txt"), "utf8")).trim();

  let child: ReturnType<typeof spawn> | null = null;
  let timer: NodeJS.Timeout | null = null;
  try {
    const port = await freePort();
    const mysqlExt = session.mysql ? await mysqlExtensionArgs() : [];
    child = spawn(PHP_BIN, phpServerArgs(session, port, mysqlExt), {
      cwd: session.workspacePath,
      env: sandboxEnv(),
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true,
      detached: process.platform !== "win32",
    });

    const startedAt = Date.now();
    const serverUp = await new Promise<boolean>((resolve) => {
      child!.once("error", () => resolve(false));
      child!.once("close", () => resolve(false));
      waitForServer(port, STATEFUL_SERVER_STARTUP_MS).then((up) => {
        if (up) resolve(true);
        else setTimeout(() => resolve(false), 50);
      });
    });

    if (!serverUp) {
      return {
        ...statusResponse("runtime_unavailable", "The PHP web server could not be started."),
        executionTimeMs: Date.now() - startedAt,
      };
    }

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(request.inputs)) body.append(key, value);

    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${REQUEST_URL_ROOT}:${port}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Practice-Token": token,
          ...(request.cookieHeader ? { Cookie: request.cookieHeader } : {}),
        },
        body: body.toString(),
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        return {
          ...statusResponse(
            "timeout",
            "Execution timed out after 2 seconds.",
          ),
          executionTimeMs: Date.now() - startedAt,
        };
      }
      return {
        ...statusResponse(
          "runtime_error",
          "The PHP request could not be completed.",
        ),
        executionTimeMs: Date.now() - startedAt,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }

    const read = await readResponseBody(response);
    const executionTimeMs = Date.now() - startedAt;
    const setCookieHeaders = response.headers.getSetCookie();

    if (read.status === "aborted") {
      return { ...statusResponse("timeout", "Execution timed out after 2 seconds."), executionTimeMs };
    }

    const safeBody = sanitizeMysqlText(
      sanitizeWorkspaceText(read.body, session.workspacePath),
      session,
    );

    if (read.status === "output_limit") {
      return {
        status: "output_limit",
        stdout: safeBody,
        stderr: "",
        executionTimeMs,
        setCookieHeaders,
        message: "Execution produced too much output and was stopped.",
      };
    }
    if (response.status === 200) {
      return { status: "success", stdout: safeBody, stderr: "", executionTimeMs, setCookieHeaders };
    }
    if (response.status === 500) {
      const status: PracticeResultStatus = /parse error|syntax error/i.test(safeBody)
        ? "syntax_error"
        : "runtime_error";
      return {
        status,
        stdout: safeBody,
        stderr: "",
        executionTimeMs,
        setCookieHeaders,
        message:
          status === "syntax_error"
            ? "PHP reported a syntax error in your code."
            : "PHP terminated with a runtime error.",
      };
    }
    return {
      status: "runtime_error",
      stdout: safeBody,
      stderr: "",
      executionTimeMs,
      setCookieHeaders,
      message: `PHP returned a non-success response (HTTP ${response.status}).`,
    };
  } finally {
    if (timer) clearTimeout(timer);
    if (child) await stopServer(child);
  }
}