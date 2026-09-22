import { test } from "node:test";
import assert from "node:assert/strict";
import type { ProgressState, ResumeInfo } from "../src/lib/progress/types.ts";
import { PROGRESS_STORAGE_KEY, PROGRESS_VERSION } from "../src/lib/progress/types.ts";
import { createEmptyProgressState } from "../src/lib/progress/repository.ts";
import {
  localStorageProgressRepository,
  normalizeProgressState,
} from "../src/lib/progress/localStorageRepository.ts";
import {
  getResume,
  isResumeTargetKnown,
  markLessonComplete,
  recordEvaluation,
  recordHintReveal,
  setResume,
} from "../src/lib/progress/service.ts";
import type { EvaluationResult } from "../src/lib/practice/evaluation";

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function fakeStorage(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    dump: () => store,
  };
}

const stateWithResume: ProgressState = {
  version: PROGRESS_VERSION,
  lessons: {},
  programs: {},
  resume: { type: "lesson", slug: "php-introduction", updatedAt: "2026-09-01T10:00:00.000Z" },
};

test("getResume returns undefined when nothing has been recorded", () => {
  assert.equal(getResume(createEmptyProgressState()), undefined);
});

test("setResume records the target with an ISO timestamp", () => {
  const state = setResume(createEmptyProgressState(), "lesson", "php-variables");
  const resume = getResume(state);
  assert.ok(resume);
  assert.equal(resume.type, "lesson");
  assert.equal(resume.slug, "php-variables");
  assert.match(resume.updatedAt, ISO_RE);
});

test("setResume replaces the previous resume target entirely", () => {
  const first = setResume(
    createEmptyProgressState(),
    "lesson",
    "php-variables",
    "2026-09-01T10:00:00.000Z",
  );
  const second = setResume(
    first,
    "program",
    "largest-number",
    "2026-09-01T11:00:00.000Z",
  );
  const resume = getResume(second);
  assert.ok(resume);
  assert.equal(resume.type, "program");
  assert.equal(resume.slug, "largest-number");
  assert.equal(resume.updatedAt, "2026-09-01T11:00:00.000Z");
});

test("recording a resume never disturbs completion records", () => {
  let state = markLessonComplete(createEmptyProgressState(), "php-introduction", true);
  const completedAt = state.lessons["php-introduction"]?.completedAt;
  state = setResume(state, "lesson", "php-introduction");

  assert.equal(state.lessons["php-introduction"]?.completed, true);
  assert.equal(state.lessons["php-introduction"]?.completedAt, completedAt);
});

test("unrelated actions never introduce a resume", () => {
  const result: EvaluationResult = { status: "passed", passed: 5, total: 5, testResults: [] };
  let state = recordEvaluation(createEmptyProgressState(), "largest-number", result);
  state = recordHintReveal(state, "largest-number", 2);
  assert.equal(state.resume, undefined);
});

test("isResumeTargetKnown accepts only existing registry slugs of the matching kind", () => {
  const lessonSlugs = ["a", "b"];
  const programSlugs = ["x", "y"];
  const resume: ResumeInfo = { type: "lesson", slug: "a", updatedAt: "2026-01-01T00:00:00.000Z" };

  assert.equal(isResumeTargetKnown(resume, lessonSlugs, programSlugs), true);
  assert.equal(
    isResumeTargetKnown({ ...resume, slug: "nope" }, lessonSlugs, programSlugs),
    false,
  );
  assert.equal(
    isResumeTargetKnown({ ...resume, type: "program", slug: "x" }, lessonSlugs, programSlugs),
    true,
  );
  assert.equal(
    isResumeTargetKnown({ ...resume, type: "program", slug: "a" }, lessonSlugs, programSlugs),
    false,
  );
});

test("normalizeProgressState preserves a valid resume", () => {
  const normalized = normalizeProgressState({ ...stateWithResume });
  assert.ok(normalized);
  assert.deepEqual(normalized.resume, stateWithResume.resume);
});

test("normalizeProgressState drops a resume with a bad type", () => {
  const normalized = normalizeProgressState({
    ...stateWithResume,
    resume: { ...stateWithResume.resume, type: "quiz" },
  });
  assert.ok(normalized);
  assert.equal(normalized.resume, undefined);
});

test("normalizeProgressState drops a resume with an empty or missing slug", () => {
  const empty = normalizeProgressState({
    ...stateWithResume,
    resume: { ...stateWithResume.resume, slug: "" },
  });
  assert.ok(empty);
  assert.equal(empty.resume, undefined);

  const missing = normalizeProgressState({
    ...stateWithResume,
    resume: { type: "lesson", updatedAt: "2026-09-01T10:00:00.000Z" },
  });
  assert.ok(missing);
  assert.equal(missing.resume, undefined);
});

test("normalizeProgressState drops a resume with an unparseable timestamp", () => {
  const normalized = normalizeProgressState({
    ...stateWithResume,
    resume: { ...stateWithResume.resume, updatedAt: "yesterday-ish" },
  });
  assert.ok(normalized);
  assert.equal(normalized.resume, undefined);
});

test("a Phase 7 payload (no resume key) loads cleanly without a version bump", () => {
  const phase7Payload = {
    version: 1,
    lessons: { "php-introduction": { completed: true, completedAt: "2026-08-01T00:00:00.000Z" } },
    programs: {
      "largest-number": {
        completed: true,
        bestPassed: 5,
        bestTotal: 5,
        maxHintsRevealed: 1,
      },
    },
  };
  const normalized = normalizeProgressState(phase7Payload);
  assert.ok(normalized);
  assert.equal(normalized.version, PROGRESS_VERSION);
  assert.equal(normalized.resume, undefined);
  assert.deepEqual(normalized.lessons, phase7Payload.lessons);
  assert.deepEqual(normalized.programs, phase7Payload.programs);
});

test("resume survives a save/load round-trip", () => {
  const storage = fakeStorage();
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, storage);
  repo.save(stateWithResume);
  assert.deepEqual(repo.load(), stateWithResume);
});