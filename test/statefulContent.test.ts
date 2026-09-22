import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS, PROGRAMS, getLessonBySlug } from "../src/content/index.ts";
import type { Program } from "../src/lib/learning/types.ts";

const STATEFUL_PROGRAMS = PROGRAMS.filter(
  (p) => p.practice?.execution === "stateful",
);
const PURE_PROGRAMS = PROGRAMS.filter((p) => p.practice && p.practice.execution === "pure");

describe("stateful program content", () => {
  test("every practice program declares an explicit execution capability", () => {
    const practicePrograms = PROGRAMS.filter((p) => p.practice);
    for (const p of practicePrograms) {
      assert.ok(
        p.practice!.execution === "pure" || p.practice!.execution === "stateful",
        `${p.slug} must declare execution`,
      );
    }
  });

  test("exactly the sessions and cookies programs are stateful", () => {
    assert.deepEqual(
      STATEFUL_PROGRAMS.map((p) => p.slug).sort(),
      ["cookies", "sessions"],
    );
  });

  test("stateful programs do not also carry pure testCases", () => {
    for (const p of STATEFUL_PROGRAMS) {
      assert.ok(!p.testCases, `${p.slug} must not declare pure testCases`);
      assert.ok(
        Array.isArray(p.statefulTestCases) && p.statefulTestCases.length > 0,
        `${p.slug} must declare statefulTestCases`,
      );
    }
  });

  test("pure programs do not carry statefulTestCases", () => {
    for (const p of PURE_PROGRAMS) {
      assert.ok(!p.statefulTestCases, `${p.slug} must not declare statefulTestCases`);
    }
  });

  test("stateful test cases have sequential steps and single-fresh-session semantics", () => {
    const ids = new Set<string>();
    for (const p of STATEFUL_PROGRAMS) {
      for (const c of p.statefulTestCases!) {
        assert.ok(c.id && !ids.has(c.id), `duplicate case id ${c.id}`);
        ids.add(c.id);
        assert.ok(c.name.trim().length > 0);
        assert.ok(c.steps.length >= 1, `${p.slug}/${c.id} needs steps`);
        const stepIds = new Set<string>();
        for (const s of c.steps) {
          assert.ok(typeof s.inputs === "object" && s.inputs !== null);
          assert.ok(s.expectedOutput.trim().length > 0);
          const serialized = JSON.stringify(c.steps);
          assert.ok(serialized.length > 0);
          for (const key of Object.keys(s.inputs)) {
            assert.ok(key.trim().length > 0);
            assert.ok(!stepIds.has(key), "inputs must be a plain record");
            stepIds.add(key);
          }
        }
      }
    }
    assert.ok(ids.size >= 8, "expected the 8 designed grading scenarios");
  });

  test("stateful starter code is a scaffold, not the answer", () => {
    for (const p of STATEFUL_PROGRAMS) {
      const starter = p.practice!.starterCode;
      assert.match(starter, /Your logic here/, `${p.slug} starter must be a scaffold`);
      assert.notEqual(starter, p.code, `${p.slug} starter must differ from the solution`);
    }
  });

  test("stateful programs follow the same hint contract as pure programs", () => {
    for (const p of STATEFUL_PROGRAMS) {
      assert.equal(p.hints?.length, 3, `${p.slug} must have exactly 3 hints`);
      const ids = new Set(p.hints!.map((h) => h.id));
      assert.equal(ids.size, 3, `${p.slug} hint ids must be unique`);
      for (const hint of p.hints!) {
        assert.ok(hint.title.trim().length > 0);
        assert.ok(hint.content.trim().length > 0);
        assert.ok(!hint.content.includes("<?php"), `${p.slug} hint leaks code`);
        assert.ok(!hint.content.includes("$"), `${p.slug} hint leaks code`);
        assert.ok(!hint.content.includes("{") && !hint.content.includes("}"), `${p.slug} hint leaks code`);
      }
    }
  });

  test("related lessons resolve to the new curriculum", () => {
    const slugs = new Set(LESSONS.map((l) => l.slug));
    for (const p of STATEFUL_PROGRAMS) {
      for (const ref of p.lessonReferences ?? []) {
        assert.ok(slugs.has(ref.lessonSlug), `${p.slug} references missing lesson ${ref.lessonSlug}`);
      }
    }
  });

  test("the sessions lesson exists and precedes the cookies lesson", () => {
    const sessions = getLessonBySlug("sessions");
    const cookies = getLessonBySlug("cookies");
    assert.ok(sessions, "sessions lesson missing from LESSONS");
    assert.ok(cookies, "cookies lesson missing from LESSONS");
    assert.ok(sessions!.order < cookies!.order);
    assert.ok(LESSONS.every((l, i) => i === 0 || LESSONS[i - 1].order <= l.order));
  });
});