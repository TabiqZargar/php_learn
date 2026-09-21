/**
 * Single source of truth for the local execution limits shared by the
 * runner, the API routes and the request validators. Keep every knob in
 * this file — never redefine a limit inline. See
 * docs/PHP_EXECUTION_SECURITY.md before changing any value.
 */

/** The PHP CLI binary name resolved through PATH. */
export const PHP_BIN = "php";
export const MAX_SOURCE_BYTES = 64 * 1024;
export const MAX_INPUT_BYTES = 16 * 1024;
export const MAX_OUTPUT_BYTES = 64 * 1024;
export const EXECUTION_TIMEOUT_MS = 2000;