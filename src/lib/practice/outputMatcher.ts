/**
 * Deterministic output comparison for the solution evaluator. Only
 * mechanical, harmless differences are tolerated: line endings, a final
 * newline, and trailing whitespace per line. There is deliberately NO
 * fuzzy / partial / case-insensitive matching — "hello" only equals
 * "hello". Keep this module pure (no Node imports) so the evaluator stays
 * unit-testable in any runtime.
 */

/** Normalize CRLF/LF, leading-trailing per-line whitespace and a final newline. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

/** Strict equality after normalization. */
export function matchesOutput(expected: string, actual: string): boolean {
  return normalizeOutput(expected) === normalizeOutput(actual);
}