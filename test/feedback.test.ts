import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { EvaluationStatus } from "../src/lib/practice/evaluation.ts";
import { FEEDBACK_GUIDANCE } from "../src/lib/practice/feedback.ts";

const ALL_STATUSES: EvaluationStatus[] = [
  "passed",
  "wrong_answer",
  "runtime_error",
  "syntax_error",
  "timeout",
  "output_limit",
  "runtime_unavailable",
  "execution_disabled",
];

const HINT_OFFERING_STATUSES: EvaluationStatus[] = [
  "wrong_answer",
  "syntax_error",
  "runtime_error",
  "timeout",
  "output_limit",
];

describe("feedback guidance coverage", () => {
  test("every evaluation status has full guidance", () => {
    for (const status of ALL_STATUSES) {
      const guidance = FEEDBACK_GUIDANCE[status];
      assert.ok(guidance, `no guidance for ${status}`);
      assert.ok(guidance.heading.trim().length > 0, `${status} missing heading`);
      assert.ok(guidance.body.trim().length > 0, `${status} missing body`);
    }
  });

  test("actionable failure statuses offer hints", () => {
    for (const status of HINT_OFFERING_STATUSES) {
      assert.equal(FEEDBACK_GUIDANCE[status].offerHints, true, `${status} should offer hints`);
    }
  });

  test("a passing result never promotes hints", () => {
    assert.equal(FEEDBACK_GUIDANCE.passed.offerHints, false);
  });

  test("unavailable execution never promotes hints", () => {
    assert.equal(FEEDBACK_GUIDANCE.runtime_unavailable.offerHints, false);
    assert.equal(FEEDBACK_GUIDANCE.execution_disabled.offerHints, false);
  });
});