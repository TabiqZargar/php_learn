/**
 * localStorage-backed ProgressRepository.
 *
 * Safety rules (never crash, never break SSR):
 *  - `window`/`localStorage` are only touched inside try/catch at call time,
 *    so the repository is safe to construct and use during server rendering.
 *  - Missing storage, malformed JSON and unsupported versions all fall back
 *    to a clean empty ProgressState.
 *  - A future version is handled explicitly: any version other than the
 *    supported one loads as an empty state instead of guessing.
 */
import type { EvaluationStatus } from "@/lib/practice/evaluation";
import type { LessonProgress, ProgramProgress, ProgressState } from "./types";
import { PROGRESS_STORAGE_KEY, PROGRESS_VERSION } from "./types.ts";
import { createEmptyProgressState, type ProgressRepository } from "./repository.ts";

/** Minimal Storage-alike contract so tests can inject an in-memory store. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KNOWN_EVALUATION_STATUSES: readonly EvaluationStatus[] = [
  "passed",
  "wrong_answer",
  "runtime_error",
  "syntax_error",
  "timeout",
  "output_limit",
  "runtime_unavailable",
  "execution_disabled",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function toCount(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function normalizeLessonProgress(value: unknown): LessonProgress {
  const entry = isRecord(value) ? value : {};
  const completedAt = isString(entry.completedAt) ? entry.completedAt : undefined;
  return {
    completed: entry.completed === true,
    ...(completedAt ? { completedAt } : {}),
  };
}

function normalizeProgramProgress(value: unknown): ProgramProgress {
  const entry = isRecord(value) ? value : {};
  const lastStatus =
    entry.lastStatus !== undefined &&
    (KNOWN_EVALUATION_STATUSES as readonly unknown[]).includes(entry.lastStatus)
      ? (entry.lastStatus as EvaluationStatus)
      : undefined;
  return {
    completed: entry.completed === true,
    ...(isString(entry.completedAt) ? { completedAt: entry.completedAt } : {}),
    bestPassed: toCount(entry.bestPassed, 0),
    bestTotal: toCount(entry.bestTotal, 0),
    ...(lastStatus ? { lastStatus } : {}),
    ...(typeof entry.lastPassed === "number" ? { lastPassed: toCount(entry.lastPassed, 0) } : {}),
    ...(typeof entry.lastTotal === "number" ? { lastTotal: toCount(entry.lastTotal, 0) } : {}),
    ...(isString(entry.lastCheckedAt) ? { lastCheckedAt: entry.lastCheckedAt } : {}),
    maxHintsRevealed: toCount(entry.maxHintsRevealed, 0),
  };
}

/**
 * Validate + clean a parsed payload into a supported ProgressState.
 * Returns null when the payload is unusable (malformed, wrong version), so
 * the caller can fall back to the empty state.
 */
export function normalizeProgressState(value: unknown): ProgressState | null {
  if (!isRecord(value)) return null;
  if (value.version !== PROGRESS_VERSION) return null;
  if (!isRecord(value.lessons) || !isRecord(value.programs)) return null;

  const lessons: Record<string, LessonProgress> = {};
  for (const [slug, entry] of Object.entries(value.lessons)) {
    lessons[slug] = normalizeLessonProgress(entry);
  }
  const programs: Record<string, ProgramProgress> = {};
  for (const [slug, entry] of Object.entries(value.programs)) {
    programs[slug] = normalizeProgramProgress(entry);
  }

  return { version: PROGRESS_VERSION, lessons, programs };
}

export function localStorageProgressRepository(
  key: string = PROGRESS_STORAGE_KEY,
  storage?: StorageLike,
): ProgressRepository {
  const resolveStorage = (): StorageLike | null => {
    if (storage) return storage;
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  };

  return {
    load(): ProgressState {
      const store = resolveStorage();
      if (!store) return createEmptyProgressState();

      let raw: string | null;
      try {
        raw = store.getItem(key);
      } catch {
        return createEmptyProgressState();
      }
      if (raw === null) return createEmptyProgressState();

      try {
        return normalizeProgressState(JSON.parse(raw)) ?? createEmptyProgressState();
      } catch {
        return createEmptyProgressState();
      }
    },

    save(state: ProgressState): void {
      const store = resolveStorage();
      if (!store) return;
      try {
        store.setItem(key, JSON.stringify(state));
      } catch {
        // Best-effort persistence; the app keeps working in memory.
      }
    },

    clear(): void {
      const store = resolveStorage();
      if (!store) return;
      try {
        store.removeItem(key);
      } catch {
        // Best-effort.
      }
    },
  };
}