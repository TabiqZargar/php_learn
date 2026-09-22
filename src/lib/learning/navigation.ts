/**
 * Registry-order navigation rules for lessons and programs, kept pure so
 * the "previous disabled on the first, next disabled on the last" behavior
 * is unit-testable without a DOM. Callers pass their ordered content array.
 */

/**
 * Index of the previous item, or undefined when the current index is the
 * first/out of range (callers disable the previous control then).
 */
export function previousIndex(index: number, total: number): number | undefined {
  if (index <= 0 || index >= total) return undefined;
  return index - 1;
}

/**
 * Index of the next item, or undefined when the current index is the last /
 * out of range (callers disable the next control then).
 */
export function nextIndex(index: number, total: number): number | undefined {
  if (index < 0 || index >= total - 1) return undefined;
  return index + 1;
}