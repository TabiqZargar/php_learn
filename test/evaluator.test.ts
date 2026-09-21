import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { ProgramTestCase } from "../src/lib/learning/types.ts";
import type { EvaluationStatus } from "../src/lib/practice/evaluation.ts";
import type { PracticeInput, PracticeResult } from "../src/lib/practice/types.ts";
import {
  evaluateSolution,
  type PracticeRunFn,
} from "../src/lib/practice/evaluator.ts";

function makeInput(name: string, value: string): PracticeInput {
  return { name, label: name, type: "text", value };
}

function makeTest(id: string, input = makeInput("a", "1")): ProgramTestCase {
  return {
    id,
    name: `Test ${id}`,
    inputs: [input],
    expectedOutput: "x",
  };
}

function makeRun(...results: PracticeResult[]): {
  runner: PracticeRunFn;
  calls: () => number;
} {
  const state = { calls: 0 };
  const fallback: PracticeResult = { status: "runtime_error", exitCode: 255 };
  const runner: PracticeRunFn = async () => {
    state.calls += 1;
    return results[state.calls - 1] ?? fallback;
  };
  return { runner, calls: () => state.calls };
}

describe("evaluateSolution", () => {
  test("all passing cases are classified passed with full counts", async () => {
    const { runner, calls } = makeRun(
      { status: "success", stdout: "x", exitCode: 0 },
      { status: "success", stdout: "x", exitCode: 0 },
      { status: "success", stdout: "x", exitCode: 0 },
    );
    const result = await evaluateSolution("<?php", [makeTest("1"), makeTest("2"), makeTest("3")], runner);
    assert.equal(result.status, "passed");
    assert.equal(result.passed, 3);
    assert.equal(result.total, 3);
    assert.equal(result.testResults.length, 3);
    assert.ok(result.testResults.every((t) => t.status === "passed"));
    assert.equal(calls(), 3);
  });

  test("a wrong answer stops the run and reports passed/total from the suite", async () => {
    const { runner, calls } = makeRun(
      { status: "success", stdout: "x", exitCode: 0 },
      { status: "success", stdout: "y", exitCode: 0 },
      { status: "success", stdout: "z", exitCode: 0 },
    );
    const result = await evaluateSolution("<?php", [makeTest("1"), makeTest("2"), makeTest("3")], runner);
    assert.equal(result.status, "wrong_answer");
    assert.equal(result.passed, 1);
    assert.equal(result.total, 3);
    assert.equal(result.testResults.length, 2);
    assert.equal(calls(), 2);
    const failed = result.testResults[1];
    assert.equal(failed.status, "wrong_answer");
    assert.equal(failed.expectedOutput, "x");
    assert.equal(failed.actualOutput, "y");
    assert.equal(failed.testCaseId, "2");
  });

  test("the first failing status wins and no later case runs", async () => {
    const { runner, calls } = makeRun(
      { status: "success", stdout: "x", exitCode: 0 },
      { status: "syntax_error", exitCode: 255, message: "Parse error" },
    );
    const result = await evaluateSolution("<?php", [makeTest("1"), makeTest("2"), makeTest("3")], runner);
    assert.equal(result.status, "syntax_error");
    assert.equal(result.passed, 1);
    assert.equal(calls(), 2);
    assert.equal(result.testResults.length, 2);
  });

  const failureMappings: Array<[PracticeResult["status"], EvaluationStatus]> = [
    ["syntax_error", "syntax_error"],
    ["runtime_error", "runtime_error"],
    ["timeout", "timeout"],
    ["output_limit", "output_limit"],
    ["runtime_unavailable", "runtime_unavailable"],
    ["execution_disabled", "execution_disabled"],
    ["invalid_request", "runtime_error"],
    ["not_implemented", "runtime_error"],
  ];

  for (const [runnerStatus, expected] of failureMappings) {
    test(`maps runner status "${runnerStatus}" to evaluation status "${expected}"`, async () => {
      const { runner, calls } = makeRun({ status: runnerStatus, exitCode: 255 });
      const result = await evaluateSolution("<?php", [makeTest("1"), makeTest("2")], runner);
      assert.equal(result.status, expected);
      assert.equal(result.passed, 0);
      assert.equal(result.total, 2);
      assert.equal(result.testResults.length, 1);
      assert.equal(calls(), 1);
    });
  }

  test("execution error diagnostics hide the throwaway script path", async () => {
    const { runner } = makeRun({
      status: "syntax_error",
      exitCode: 255,
      stdout:
        "Parse error: syntax error, unexpected end of file in " +
        "C:\\Users\\Tabiq\\AppData\\Local\\Temp\\php-academy-AbC123\\program.php on line 3",
    });
    const result = await evaluateSolution("<?php", [makeTest("1"), makeTest("2")], runner);
    const diagnostic = result.testResults[0].diagnostic ?? "";
    assert.match(diagnostic, /program\.php/);
    assert.doesNotMatch(diagnostic, /php-academy-/);
    assert.doesNotMatch(diagnostic, /Temp/);
  });

  test("POSIX script paths are sanitized too", async () => {
    const { runner } = makeRun({
      status: "runtime_error",
      exitCode: 255,
      stderr:
        "Fatal error: Call to undefined function foo() in " +
        "/tmp/php-academy-xYz987/program.php on line 2",
    });
    const result = await evaluateSolution("<?php", [makeTest("1")], runner);
    const diagnostic = result.testResults[0].diagnostic ?? "";
    assert.match(diagnostic, /undefined function/);
    assert.doesNotMatch(diagnostic, /php-academy-/);
  });

  test("a program with no test cases cannot be evaluated", async () => {
    const { runner, calls } = makeRun();
    const result = await evaluateSolution("<?php", [], runner);
    assert.equal(result.status, "runtime_unavailable");
    assert.equal(result.passed, 0);
    assert.equal(result.total, 0);
    assert.equal(result.testResults.length, 0);
    assert.match(result.message ?? "", /test cases/);
    assert.equal(calls(), 0);
  });

  test("stdout of a passing case is preserved as actual output", async () => {
    const { runner } = makeRun({ status: "success", stdout: "x", exitCode: 0 });
    const result = await evaluateSolution("<?php", [makeTest("1")], runner);
    assert.equal(result.testResults[0].actualOutput, "x");
  });
});
