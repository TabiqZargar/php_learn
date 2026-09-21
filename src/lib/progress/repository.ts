/**
 * Persistence boundary for learning progress.
 *
 * The UI depends only on this interface (plus the pure service rules). A
 * future database-backed repository can replace the localStorage
 * implementation without touching components.
 */
import type { ProgressState } from "./types";
import { PROGRESS_VERSION } from "./types.ts";

export interface ProgressRepository {
  /** Loads persisted progress; never throws. Falls back to an empty state. */
  load(): ProgressState;
  /** Persists progress; never throws (best-effort). */
  save(state: ProgressState): void;
  /** Removes all persisted progress. */
  clear(): void;
}

/** Single empty-state factory so defaults are never duplicated. */
export function createEmptyProgressState(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    lessons: {},
    programs: {},
  };
}