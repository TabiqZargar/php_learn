/**
 * SECURITY BOUNDARY — server-only. Read docs/PHP_EXECUTION_SECURITY.md
 * before changing anything in this file.
 *
 * This module runs untrusted student PHP on the LOCAL DEVELOPMENT machine
 * only. It is a teaching convenience, NOT a production sandbox:
 *
 *  - CLI arguments are passed through a direct child_process.spawn() call —
 *    never exec/execSync/shell/system and never through a shell, so no
 *    string-based injection is possible.
 *  - Code is written to a fresh temporary directory that is deleted after
 *    every run, never to project files.
 *  - The child env is rebuilt from a small allow-list (no secrets leak out).
 *  - Unknown functions/disables are largely governed by a minimal PHP
 *    config (display_errors, error_reporting, memory_limit, max_execution_time,
 *    allow_url_fopen=0, allow_url_include=0, open_basedir) plus hard limits
 *    on wall-clock time, source size, input size and output size enforced by
 *    the Node process itself.
 *
 * Still, code can read the local filesystem and issue roughly what a normal
 * local process can. Treat runtime_unavailable / execution_disabled results
 * as the default on machines without PHP. Never weaken the dev-only gate
 * (process.env.NODE_ENV) without a production-grade sandbox in place.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PracticeInput, PracticeResult } from "./types";
import {
  DISABLED_PHP_FUNCTIONS,
  EXECUTION_TIMEOUT_MS,
  MAX_INPUT_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_BYTES,
  PHP_BIN,
} from "./limits.ts";

/** Shell env keys forwarded to the child; everything else is dropped. */
const ENV_ALLOWLIST = [
  "PATH",
  "PATHEXT",
  "COMSPEC",
  "SYSTEMROOT",
  "WINDIR",
  "TEMP",
  "TMP",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TZ",
] as const;

let phpDetection: Promise<boolean> | null = null;

function detectPhp(): Promise<boolean> {
  if (phpDetection) return phpDetection;
  phpDetection = new Promise((resolve) => {
    const child = spawn(PHP_BIN, ["-n", "--version"], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true,
    });
    const timer = setTimeout(() => child.kill(), EXECUTION_TIMEOUT_MS);
    child.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
  return phpDetection;
}

function statusResult(
  status: PracticeResult["status"],
  exitCode: number | null,
  message?: string,
): PracticeResult {
  const result: PracticeResult = { status, exitCode };
  if (message) result.message = message;
  return result;
}

function sandboxEnv(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {};
  for (const key of ENV_ALLOWLIST) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  // Next's types augment ProcessEnv with a required readonly NODE_ENV; the
  // child process receives our allow-listed env without that augmentation.
  return env as unknown as NodeJS.ProcessEnv;
}

/** Shared by the pure runner and the stateful web runner (exported). */
export { sandboxEnv };

/** True when the PHP binary answers a minimal -n probe. */
export async function isPhpAvailable(): Promise<boolean> {
  return detectPhp();
}

/**
 * The PHP CLI prints the absolute path of the throwaway script (e.g.
 * C:\Users\...\Temp\php-academy-AbC123\program.php). The temp path is an
 * implementation detail, so only a plain filename is exposed. Applied to
 * every runner result so no endpoint leaks the host temp path.
 */
export function sanitizePhpOutput(text: string): string {
  const windowsPath = /[A-Za-z]:\\(?:[^\\\n]+\\)*php-academy-[^\\\n]*\\program\.php/g;
  const posixPath = /\/(?:[^/\n]+\/)*php-academy-[^/\n]+\/program\.php/g;
  return text.replace(windowsPath, "program.php").replace(posixPath, "program.php");
}

/**
 * Run untrusted PHP locally inside a throwaway directory.
 * Resolves with a PracticeResult in every path — it never rejects.
 */
export async function runLocalPhp(
  code: string,
  inputs: PracticeInput[],
): Promise<PracticeResult> {
  if (process.env.NODE_ENV !== "development") {
    return statusResult(
      "execution_disabled",
      null,
      "PHP execution is only available on the local development server.",
    );
  }

  if (code.length > MAX_SOURCE_BYTES) {
    return statusResult(
      "invalid_request",
      null,
      `The submitted code exceeds the ${MAX_SOURCE_BYTES / 1024} KB limit.`,
    );
  }

  const totalInputBytes = inputs.reduce(
    (sum, input) => sum + Buffer.byteLength(input.value, "utf8"),
    0,
  );
  if (totalInputBytes > MAX_INPUT_BYTES) {
    return statusResult(
      "invalid_request",
      null,
      `The combined input exceeds the ${MAX_INPUT_BYTES / 1024} KB limit.`,
    );
  }

  if (!(await detectPhp())) {
    return statusResult(
      "runtime_unavailable",
      null,
      "PHP CLI is not installed or is not available on the PATH.",
    );
  }

  let tmpDir: string | null = null;
  try {
    tmpDir = await mkdtemp(join(tmpdir(), "php-academy-"));
    const scriptPath = join(tmpDir, "program.php");
    await writeFile(scriptPath, code, "utf8");
    return await runScript(scriptPath, tmpDir, inputs.map((input) => input.value));
  } finally {
    if (tmpDir) {
      try {
        await rm(tmpDir, {
          recursive: true,
          force: true,
          // Windows may release file handles a moment after close; retry so
          // cleanup converges instead of leaving stray temp directories.
          maxRetries: 10,
          retryDelay: 100,
        });
      } catch {
        // Best-effort cleanup; the OS temp directory will reclaim leftovers.
      }
    }
  }
}

function runScript(
  scriptPath: string,
  workingDir: string,
  argumentValues: string[],
): Promise<PracticeResult> {
  const phpArgs = [
    "-n",
    "-d",
    "display_errors=1",
    "-d",
    "display_startup_errors=1",
    "-d",
    "error_reporting=32767",
    "-d",
    "memory_limit=64M",
    "-d",
    "max_execution_time=2",
    "-d",
    "allow_url_fopen=0",
    "-d",
    "allow_url_include=0",
    "-d",
    `open_basedir=${workingDir}`,
    "-d",
    `disable_functions=${DISABLED_PHP_FUNCTIONS}`,
    scriptPath,
    ...argumentValues,
  ];

  return new Promise((resolve) => {
    let settled = false;
    let killedFor: "timeout" | "output" | null = null;
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    let outputBytes = 0;
    const startedAt = Date.now();

    const child = spawn(PHP_BIN, phpArgs, {
      cwd: workingDir,
      env: sandboxEnv(),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform !== "win32",
    });

    const finish = (result: PracticeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const killChild = () => {
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
    };

    const timer = setTimeout(() => {
      killedFor = "timeout";
      killChild();
    }, EXECUTION_TIMEOUT_MS);

    const accountFor = (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES && killedFor === null) {
        killedFor = "output";
        killChild();
      }
    };

    child.stdout.on("data", (chunk: Buffer) => {
      accountFor(chunk);
      stdoutChunks.push(chunk.toString("utf8"));
    });
    child.stderr.on("data", (chunk: Buffer) => {
      accountFor(chunk);
      stderrChunks.push(chunk.toString("utf8"));
    });

    child.stdin?.end();

    child.once("error", (err: NodeJS.ErrnoException) => {
      const message =
        err.code === "ENOENT"
          ? "PHP CLI is not installed or is not available on the PATH."
          : "The PHP process could not be started.";
      finish(statusResult("runtime_unavailable", null, message));
    });

    child.once("close", (exitCode, signal) => {
      const stdout = sanitizePhpOutput(stdoutChunks.join(""));
      const stderr = sanitizePhpOutput(stderrChunks.join(""));
      const executionTimeMs = Date.now() - startedAt;
      const base = { stdout, stderr, executionTimeMs };

      if (killedFor === "timeout") {
        finish({
          ...base,
          status: "timeout",
          exitCode: null,
          message: "Execution timed out after 2 seconds.",
        });
        return;
      }
      if (killedFor === "output") {
        finish({
          ...base,
          status: "output_limit",
          exitCode: null,
          message: "Execution produced too much output and was stopped.",
        });
        return;
      }
      if (signal) {
        finish({
          ...base,
          status: "runtime_error",
          exitCode: null,
          message: "PHP was terminated by the operating system.",
        });
        return;
      }
      if (exitCode !== 0) {
        // PHP streams diagnostics to stderr or stdout depending on version
        // and CLI config, so classify from the combined output.
        const combined = stdout + stderr;
        if (/parse error/i.test(combined)) {
          finish({
            ...base,
            status: "syntax_error",
            exitCode,
            message: "PHP reported a syntax error in your code.",
          });
        } else {
          finish({
            ...base,
            status: "runtime_error",
            exitCode,
            message: "PHP terminated with a runtime error.",
          });
        }
        return;
      }
      finish({ ...base, status: "success", exitCode: 0 });
    });
  });
}