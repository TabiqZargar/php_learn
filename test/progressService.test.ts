import { test } from "node:test";
import assert from "node:assert/strict";
import type { EvaluationResult, EvaluationStatus } from "../src/lib/practice/evaluation";
import type { ProgressState } from "../src/lib/progress/types.ts";
import { PROGRESS_VERSION } from "../src/lib/progress/types.ts";
import { createEmptyProgressState } from "../src/lib/progress/repository.ts";
import {
  getLessonProgress,
  getProgramProgress,
  getSummary,
  markLessonComplete,
  recordEvaluation,
  recordHintReveal,
  resetProgress,
} from "../src/lib/progress/service.ts";

function result(status: EvaluationStatus, passed: number, total: number): EvaluationResult {
  return { status, passed, total, testResults: [] };
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

test("getters return undefined for unknown slugs and values for known ones", () => {
  const state: ProgressState = createEmptyProgressState();
  assert.equal(getLessonProgress(state, "nope"), undefined);
  assert.equal(getProgramProgress(state, "nope"), undefined);

  const withLesson = markLessonComplete(state, "l1", true);
  const withProgram = recordEvaluation(
    withLesson,
    "p1",
    result("passed", 3, 3),
  );
  assert.equal(getLessonProgress(withProgram, "l1")?.completed, true);
  assert.equal(getProgramProgress(withProgram, "p1")?.lastStatus, "passed");
});

test("markLessonComplete records completion with an ISO timestamp", () => {
  const state = markLessonComplete(createEmptyProgressState(), "l1", true);
  const lesson = getLessonProgress(state, "l1");
  assert.ok(lesson);
  assert.equal(lesson.completed, true);
  assert.match(lesson.completedAt ?? "", ISO_RE);
});

test("markLessonComplete completion timestamp is stable across repeats", () => {
  const once = markLessonComplete(createEmptyProgressState(), "l1", true);
  const twice = markLessonComplete(once, "l1", true);
  assert.equal(twice, once);
  assert.equal(
    getLessonProgress(twice, "l1")?.completedAt,
    getLessonProgress(once, "l1")?.completedAt,
  );
});

test("markLessonComplete unmarks and strips the timestamp", () => {
  const once = markLessonComplete(createEmptyProgressState(), "l1", true);
  const off = markLessonComplete(once, "l1", false);
  const lesson = getLessonProgress(off, "l1");
  assert.ok(lesson);
  assert.equal(lesson.completed, false);
  assert.equal(lesson.completedAt, undefined);

  const againOff = markLessonComplete(off, "l1", false);
  assert.equal(againOff, off);
});

test("recordEvaluation completes a program only on a full pass", () => {
  const partial = recordEvaluation(
    createEmptyProgressState(),
    "p1",
    result("wrong_answer", 3, 5),
  );
  assert.equal(getProgramProgress(partial, "p1")?.completed, false);
  assert.equal(getProgramProgress(partial, "p1")?.completedAt, undefined);

  const passed = recordEvaluation(partial, "p1", result("passed", 5, 5));
  const program = getProgramProgress(passed, "p1");
  assert.ok(program);
  assert.equal(program.completed, true);
  assert.match(program.completedAt ?? "", ISO_RE);
});

test("recordEvaluation never completes a zero-total evaluation", () => {
  const state = recordEvaluation(
    createEmptyProgressState(),
    "p1",
    result("passed", 0, 0),
  );
  assert.equal(getProgramProgress(state, "p1")?.completed, false);
});

test("a program stays completed and keeps its timestamp after later failures", () => {
  const state = recordEvaluation(
    createEmptyProgressState(),
    "p1",
    result("passed", 2, 2),
  );
  const completedAt = getProgramProgress(state, "p1")?.completedAt;
  const later = recordEvaluation(state, "p1", result("wrong_answer", 0, 2));
  const program = getProgramProgress(later, "p1");
  assert.ok(program);
  assert.equal(program.completed, true);
  assert.equal(program.completedAt, completedAt);
  assert.equal(program.lastStatus, "wrong_answer");
});

test("best result only ever increases and never regresses", () => {
  const a = recordEvaluation(createEmptyProgressState(), "p1", result("wrong_answer", 3, 5));
  const b = recordEvaluation(a, "p1", result("wrong_answer", 4, 5));
  const c = recordEvaluation(b, "p1", result("wrong_answer", 2, 5));

  assert.equal(getProgramProgress(c, "p1")?.bestPassed, 4);
  assert.equal(getProgramProgress(c, "p1")?.bestTotal, 5);
  assert.equal(getProgramProgress(c, "p1")?.lastPassed, 2);
  assert.equal(getProgramProgress(b, "p1")?.lastPassed, 4);
});

test("latest outcome always reflects the newest run", () => {
  const a = recordEvaluation(createEmptyProgressState(), "p1", result("syntax_error", 0, 5));
  const b = recordEvaluation(a, "p1", result("passed", 5, 5));
  const c = recordEvaluation(b, "p1", result("runtime_error", 0, 5));

  const program = getProgramProgress(c, "p1");
  assert.ok(program);
  assert.equal(program.lastStatus, "runtime_error");
  assert.equal(program.lastPassed, 0);
  assert.match(program.lastCheckedAt ?? "", ISO_RE);
});

test("recordHintReveal increases and never decreases", () => {
  const a = recordHintReveal(createEmptyProgressState(), "p1", 1);
  const b = recordHintReveal(a, "p1", 3);
  const reduced = recordHintReveal(b, "p1", 2);

  assert.equal(getProgramProgress(reduced, "p1")?.maxHintsRevealed, 3);
  assert.equal(reduced.programs.p1, b.programs.p1);
});

test("evaluation and hint progress stay isolated", () => {
  const withHints = recordHintReveal(createEmptyProgressState(), "p1", 2);
  const evaluated = recordEvaluation(withHints, "p1", result("wrong_answer", 3, 5));
  const program = getProgramProgress(evaluated, "p1");
  assert.ok(program);
  assert.equal(program.maxHintsRevealed, 2);

  const withLocalZero = recordHintReveal(evaluated, "p1", 0);
  assert.equal(withLocalZero.programs.p1, evaluated.programs.p1);
});

test("recordEvaluation keeps a hint-only entry's fields", () => {
  const hinted = recordHintReveal(createEmptyProgressState(), "p1", 1);
  const evaluated = recordEvaluation(hinted, "p1", result("passed", 4, 4));
  const program = getProgramProgress(evaluated, "p1");
  assert.ok(program);
  assert.equal(program.maxHintsRevealed, 1);
  assert.equal(program.completed, true);
  assert.equal(program.bestPassed, 4);
});

test("getSummary counts completed lessons and programs", () => {
  let state = markLessonComplete(createEmptyProgressState(), "l1", true);
  state = markLessonComplete(state, "l2", false);
  state = recordEvaluation(state, "p1", result("passed", 2, 2));
  state = recordEvaluation(state, "p2", result("wrong_answer", 1, 2));

  assert.deepEqual(getSummary(state), { lessonsCompleted: 1, programsCompleted: 1 });

  const reset = resetProgress();
  assert.deepEqual(getSummary(reset), { lessonsCompleted: 0, programsCompleted: 0 });
});

test("resetProgress returns a clean empty state", () => {
  const state = recordEvaluation(
    markLessonComplete(createEmptyProgressState(), "l1", true),
    "p1",
    result("passed", 2, 2),
  );
  const reset = resetProgress();
  assert.deepEqual(reset, createEmptyProgressState());
  assert.notEqual(getProgramProgress(state, "p1"), undefined);
});

test("persisted program state contains only metadata, never code or output", () => {
  const ALLOWED_KEYS = new Set([
    "completed",
    "completedAt",
    "bestPassed",
    "bestTotal",
    "lastStatus",
    "lastPassed",
    "lastTotal",
    "lastCheckedAt",
    "maxHintsRevealed",
  ]);
  const raw = result("passed", 5, 5);
  const state = recordEvaluation(createEmptyProgressState(), "p1", {
    ...raw,
    testResults: [
      {
        testCaseId: "t1",
        testCaseName: "T1",
        status: "passed",
        inputs: [
          { name: "arg", value: "1", label: "Argument", type: "number" as const },
        ],
        expectedOutput: "1",
        actualOutput: "1",
      },
    ],
    message: "All tests passed",
  });

  const program = getProgramProgress(state, "p1");
  assert.ok(program);
  for (const key of Object.keys(program)) {
    assert.ok(ALLOWED_KEYS.has(key), `unexpected persisted key: ${key}`);
  }
  assert.equal(PROGRESS_VERSION, 1);
});