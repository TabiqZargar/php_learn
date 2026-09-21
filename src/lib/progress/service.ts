/**
 * Pure rules for learning-progress mutations. No React, no localStorage —
 * every function maps a ProgressState to a new ProgressState so the rules
 * are unit-testable in isolation. The ProgressProvider applies these and
 * persists through the repository.
 *
 * Timestamps are ISO strings generated at the point of the update.
 */
import type { EvaluationResult } from "@/lib/practice/evaluation";
import type { LessonProgress, ProgramProgress, ProgressState } from "./types";
import { createEmptyProgressState } from "./repository.ts";

function nowIso(): string {
  return new Date().toISOString();
}

export interface ProgressSummary {
  lessonsCompleted: number;
  programsCompleted: number;
}

export function getLessonProgress(
  state: ProgressState,
  slug: string,
): LessonProgress | undefined {
  return state.lessons[slug];
}

export function getProgramProgress(
  state: ProgressState,
  slug: string,
): ProgramProgress | undefined {
  return state.programs[slug];
}

/**
 * A lesson is completed only when the user explicitly toggles it. Opening a
 * lesson never marks it complete. The completion timestamp is written on the
 * first transition into the completed state and kept afterwards.
 */
export function markLessonComplete(
  state: ProgressState,
  slug: string,
  completed: boolean,
): ProgressState {
  const current = state.lessons[slug];

  if (completed) {
    if (current?.completed) return state;
    return {
      ...state,
      lessons: {
        ...state.lessons,
        [slug]: { completed: true, completedAt: nowIso() },
      },
    };
  }

  if (!current?.completed) return state;
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [slug]: { completed: false },
    },
  };
}

function baseProgramProgress(previous?: ProgramProgress): ProgramProgress {
  return (
    previous ?? {
      completed: false,
      bestPassed: 0,
      bestTotal: 0,
      maxHintsRevealed: 0,
    }
  );
}

/**
 * Record a Check Solution outcome.
 *
 * Completion requires the whole suite to pass (status "passed"); a program
 * stays completed forever after that, and completedAt is only ever written
 * on the first transition. The best result is a running maximum that never
 * regresses, while the latest result always reflects the newest run.
 */
export function recordEvaluation(
  state: ProgressState,
  slug: string,
  result: EvaluationResult,
): ProgressState {
  const previous = state.programs[slug];
  const passed = result.passed;
  const total = result.total;
  const passedAll = total > 0 && result.status === "passed" && passed === total;

  const previousBestPassed = previous?.bestPassed ?? 0;
  const bestPassed = Math.max(previousBestPassed, passed);
  const bestTotal = !previous
    ? total
    : passed > previousBestPassed
      ? total
      : previous.bestTotal;

  const becomesCompleted = !previous?.completed && passedAll;
  const completedAt = previous?.completed
    ? previous.completedAt
    : becomesCompleted
      ? nowIso()
      : undefined;

  const next: ProgramProgress = {
    completed: previous?.completed === true || passedAll,
    ...(completedAt ? { completedAt } : {}),
    bestPassed,
    bestTotal,
    lastStatus: result.status,
    lastPassed: passed,
    lastTotal: total,
    lastCheckedAt: nowIso(),
    maxHintsRevealed: previous?.maxHintsRevealed ?? 0,
  };

  return {
    ...state,
    programs: { ...state.programs, [slug]: next },
  };
}

/**
 * Persist the highest hint level reached. Lower values are ignored, and
 * evaluation results never touch hint progress (or vice versa).
 */
export function recordHintReveal(
  state: ProgressState,
  slug: string,
  revealedCount: number,
): ProgressState {
  const previous = state.programs[slug];
  if (revealedCount <= (previous?.maxHintsRevealed ?? 0)) return state;

  const next: ProgramProgress = {
    ...baseProgramProgress(previous),
    maxHintsRevealed: revealedCount,
  };

  return {
    ...state,
    programs: { ...state.programs, [slug]: next },
  };
}

export function getSummary(state: ProgressState): ProgressSummary {
  let lessonsCompleted = 0;
  let programsCompleted = 0;
  for (const entry of Object.values(state.lessons)) {
    if (entry.completed) lessonsCompleted += 1;
  }
  for (const entry of Object.values(state.programs)) {
    if (entry.completed) programsCompleted += 1;
  }
  return { lessonsCompleted, programsCompleted };
}

/** Discard all persisted progress (used behind an explicit user action). */
export function resetProgress(): ProgressState {
  return createEmptyProgressState();
}