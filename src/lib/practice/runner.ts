/**
 * SECURITY BOUNDARY — read before implementing real execution.
 *
 * The future runner MUST NOT execute arbitrary PHP inside this Next.js
 * server process. That means no exec(), shell_exec(), system(), proc_open,
 * pcntl_*, or child_process usage in the web application.
 *
 * Real execution must live in isolated infrastructure outside the app:
 *  - a container / sandbox per submission, OR
 *  - a separate execution worker/queue, OR
 *  - a remote execution service
 * with strict resource limits (CPU, memory, time, filesystem, network),
 * a read-only code volume, and no access to the main application.
 *
 * This phase only establishes the abstraction. It never runs code.
 */
import type { PracticeRunner } from "./types";

export const NOT_IMPLEMENTED_MESSAGE =
  "PHP execution is not connected yet.\n\nYour code has not been executed.";

export const practiceRunner: PracticeRunner = {
  run() {
    // The execution engine arrives in a later phase. Deliberately report
    // not_implemented — never fabricate output as though it came from the
    // user's code.
    return {
      status: "not_implemented",
      exitCode: null,
      message: NOT_IMPLEMENTED_MESSAGE,
    };
  },
};