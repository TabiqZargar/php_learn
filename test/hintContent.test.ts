import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PROGRAMS, getLessonBySlug } from "../src/content/index.ts";

const PRACTICE_PROGRAMS = PROGRAMS.filter((p) => p.practice && p.testCases);

describe("practice hint content", () => {
  test("every practice program has exactly three hints", () => {
    assert.equal(PRACTICE_PROGRAMS.length, 6);
    for (const program of PRACTICE_PROGRAMS) {
      assert.ok(Array.isArray(program.hints), `${program.slug} has no hints`);
      assert.equal(program.hints!.length, 3, `${program.slug} must have 3 hints`);
    }
  });

  test("hint ids are unique within each program", () => {
    for (const program of PRACTICE_PROGRAMS) {
      const ids = program.hints!.map((hint) => hint.id);
      assert.equal(new Set(ids).size, ids.length, `${program.slug} has duplicate hint ids`);
    }
  });

  test("every hint has a non-empty title and content", () => {
    for (const program of PRACTICE_PROGRAMS) {
      for (const hint of program.hints!) {
        assert.ok(hint.title.trim().length > 0, `${program.slug}/${hint.id} missing title`);
        assert.ok(hint.content.trim().length > 0, `${program.slug}/${hint.id} missing content`);
      }
    }
  });

  test("hints do not contain complete solution code", () => {
    // Code-only tokens: "$variables", PHP tags and braces never appear in
    // teaching prose, so any hit means the hint is handing out code.
    const FORBIDDEN = ["<?php", "$", "{", "}"];
    for (const program of PRACTICE_PROGRAMS) {
      for (const hint of program.hints!) {
        for (const token of FORBIDDEN) {
          assert.ok(
            !hint.content.includes(token),
            `${program.slug}/${hint.id} looks like code (contains "${token}")`,
          );
        }
        assert.ok(
          !program.code.includes(hint.content) && !hint.content.includes(program.code),
          `${program.slug}/${hint.id} overlaps the reference solution`,
        );
      }
    }
  });
});

describe("lesson references", () => {
  test("every practice program declares at least one related lesson", () => {
    for (const program of PRACTICE_PROGRAMS) {
      assert.ok(
        Array.isArray(program.lessonReferences) && program.lessonReferences.length > 0,
        `${program.slug} has no lesson references`,
      );
    }
  });

  test("every lesson reference resolves to an existing lesson with a matching label", () => {
    for (const program of PRACTICE_PROGRAMS) {
      for (const reference of program.lessonReferences!) {
        const lesson = getLessonBySlug(reference.lessonSlug);
        assert.ok(lesson, `${program.slug} -> unknown lesson "${reference.lessonSlug}"`);
        assert.equal(lesson.title, reference.label);
      }
    }
  });
});