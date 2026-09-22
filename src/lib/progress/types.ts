/**
 * Anonymous, browser-local learning progress for lessons and practice
 * programs. This is metadata only — never source code, program output,
 * inputs, or expected outputs.
 *
 * Storage is deliberately versioned: the repository validates `version`
 * on load and falls back to an empty state for anything newer so a future
 * migration can upgrade explicitly instead of guessing.
 */
import type { EvaluationStatus } from "@/lib/practice/evaluation";

/** Version of the persisted ProgressState shape. Bump on breaking changes. */
export const PROGRESS_VERSION = 1 as const;

/** localStorage key under which the versioned state is stored. */
export const PROGRESS_STORAGE_KEY = "php-academy-progress:v1";

/**
 * Where the learner left off. A single optional last-opened location, kept
 * separate from the completion records so "finished X" and "opened Y" never
 * collide. Only type, slug and a timestamp are persisted — no code, output
 * or inputs.
 */
export type ResumeTargetType = "lesson" | "program";

export interface ResumeInfo {
  type: ResumeTargetType;
  /** Must resolve to an existing lesson/program slug when the app renders it. */
  slug: string;
  /** ISO timestamp of the last meaningful open/navigation. */
  updatedAt: string;
}

export interface LessonProgress {
  completed: boolean;
  /** ISO timestamp of the first transition into the completed state. */
  completedAt?: string;
}

export interface ProgramProgress {
  completed: boolean;
  /** ISO timestamp of the first transition into the completed state. */
  completedAt?: string;

  /** Best number of test cases passed across all Check Solution runs. */
  bestPassed: number;
  /** Total test cases tied to the best result. */
  bestTotal: number;

  /** Latest Check Solution outcome. */
  lastStatus?: EvaluationStatus;
  lastPassed?: number;
  lastTotal?: number;
  lastCheckedAt?: string;

  /** Highest hint level the user has revealed (0 = none). */
  maxHintsRevealed: number;
}

/** Versioned snapshot of all learning progress, keyed by content slugs. */
export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  lessons: Record<string, LessonProgress>;
  programs: Record<string, ProgramProgress>;
  /**
   * Last opened learning location. Optional — old v1 payloads (and Phase 7
   * data) simply lack it, which keeps the stored shape backward compatible
   * without a version bump.
   */
  resume?: ResumeInfo;
}