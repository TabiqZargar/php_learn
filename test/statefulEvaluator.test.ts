import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  cookiesMatch,
  evaluateStatefulSolution,
  type StatefulEvaluatorDeps,
  type StatefulStepRunResult,
} from "../src/lib/practice/statefulEvaluator.ts";
import type { StatefulTestCase } from "../src/lib/learning/types.ts";

function step(
  inputs: Record<string, string>,
  expectedOutput: string,
  expectedCookies?: Record<string, string | null>,
): StatefulTestCase["steps"][number] {
  return { inputs, expectedOutput, ...(expectedCookies ? { expectedCookies } : {}) };
}

function makeCase(id: string, name: string, steps: ReturnType<typeof step>[]): StatefulTestCase {
  return { id, name, steps };
}

function makeDeps(
  behavior: (
    caseIndex: number,
    stepIndex: number,
    sessionId: string,
    inputs: Record<string, string>,
  ) => StatefulStepRunResult,
): {
  deps: StatefulEvaluatorDeps;
  created: string[];
  destroyed: string[];
} {
  const created: string[] = [];
  const destroyed: string[] = [];
  const stepCounts = new Map<string, number>();
  let counter = 0;
  return {
    created,
    destroyed,
    deps: {
      createSession: async () => {
        const id = `s${++counter}`;
        created.push(id);
        return { id };
      },
      destroySession: async (id) => {
        destroyed.push(id);
      },
      runStep: async (sessionId, _code, inputs) => {
        const caseIndex = created.indexOf(sessionId);
        const stepIndex = stepCounts.get(sessionId) ?? 0;
        stepCounts.set(sessionId, stepIndex + 1);
        return behavior(caseIndex, stepIndex, sessionId, inputs);
      },
    },
  };
}

const FAKE_CODE = "<?php // signed";

describe("statefulEvaluator", () => {
  test("reports no test cases", async () => {
    const { deps } = makeDeps(() => ({ status: "success", stdout: "x" }));
    const result = await evaluateStatefulSolution(FAKE_CODE, [], deps);
    assert.equal(result.status, "runtime_unavailable");
    assert.equal(result.passed, 0);
    assert.equal(result.total, 0);
  });

  test("passes when every step of every case matches", async () => {
    const cases = [
      makeCase("c1", "Case one", [
        step({ action: "login" }, "ok"),
        step({ action: "status" }, "ok"),
      ]),
      makeCase("c2", "Case two", [step({ action: "status" }, "ok")]),
    ];
    const { deps, created, destroyed } = makeDeps(() => ({
      status: "success",
      stdout: "ok",
    }));
    const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
    assert.equal(result.status, "passed");
    assert.equal(result.passed, 2);
    assert.equal(result.total, 2);
    assert.equal(result.testResults.length, 2);
    // One fresh isolated session per case, always cleaned up.
    assert.deepEqual(created, ["s1", "s2"]);
    assert.deepEqual(destroyed.sort(), ["s1", "s2"]);
  });

  test("fails on a step with wrong output and stops", async () => {
    const cases = [
      makeCase("c1", "Persistence", [
        step({ action: "login" }, "Logged in: bob"),
        step({ action: "status" }, "Logged in: bob"),
      ]),
      makeCase("c2", "Never reached", [step({ action: "status" }, "ok")]),
    ];
    const { deps, destroyed } = makeDeps((caseIndex, stepIndex) => {
      if (caseIndex === 0 && stepIndex === 0) {
        return { status: "success", stdout: "Logged in: bob" };
      }
      return { status: "success", stdout: "Logged in: WRONG" };
    });
    const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
    assert.equal(result.status, "wrong_answer");
    assert.equal(result.passed, 0);
    assert.equal(result.testResults.length, 1);
    assert.equal(result.testResults[0].status, "wrong_answer");
    assert.equal(result.testResults[0].message, "Step 2 of 2: Output does not match the expected result.");
    // The failed case still had its session cleaned up.
    assert.equal(destroyed.length, 1);
  });

  test("expectedCookies must hold after a step", async () => {
    const cases = [
      makeCase("c1", "Set", [
        step({ action: "set" }, "set", { color: "blue" }),
      ]),
    ];
    const missing = await evaluateStatefulSolution(
      FAKE_CODE,
      cases,
      makeDeps(() => ({ status: "success", stdout: "set", cookies: {} })).deps,
    );
    assert.equal(missing.status, "wrong_answer");
    assert.match(
      missing.testResults[0].message ?? "",
      /cookie state does not match/,
    );

    const matching = await evaluateStatefulSolution(
      FAKE_CODE,
      cases,
      makeDeps(() => ({ status: "success", stdout: "set", cookies: { color: "blue" } })).deps,
    );
    assert.equal(matching.status, "passed");
  });

  test("a null expected cookie must be absent", async () => {
    const cases = [
      makeCase("c1", "Delete", [
        step({ action: "delete" }, "deleted", { color: null }),
      ]),
    ];
    const absent = await evaluateStatefulSolution(
      FAKE_CODE,
      cases,
      makeDeps(() => ({ status: "success", stdout: "deleted", cookies: {} })).deps,
    );
    assert.equal(absent.status, "passed");

    const present = await evaluateStatefulSolution(
      FAKE_CODE,
      cases,
      makeDeps(() => ({ status: "success", stdout: "deleted", cookies: { color: "blue" } })).deps,
    );
    assert.equal(present.status, "wrong_answer");
  });

  test("step failures map to preserved evaluation statuses", async () => {
    const preserved: StatefulStepRunResult["status"][] = [
      "syntax_error",
      "timeout",
      "output_limit",
      "runtime_unavailable",
      "execution_disabled",
      "runtime_error",
    ];
    for (const status of preserved) {
      const cases = [makeCase("c1", "C", [step({}, "ok")])];
      const { deps } = makeDeps(() => ({ status, message: "boom" }));
      const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
      assert.equal(result.status, status, `unexpected ${status}`);
      assert.equal(result.testResults[0].message, "boom");
    }
  });

  test("statuses outside EvaluationStatus collapse to runtime_error", async () => {
    for (const status of ["session_expired", "session_not_found", "invalid_request"] as const) {
      const cases = [makeCase("c1", "C", [step({}, "ok")])];
      const { deps } = makeDeps(() => ({ status, message: "broken" }));
      const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
      assert.equal(result.status, "runtime_error");
      assert.equal(result.testResults[0].message, "broken");
    }
  });

  test("destroySession runs even when a step errors", async () => {
    const cases = [makeCase("c1", "C", [step({}, "ok")])];
    const { deps, destroyed, created } = makeDeps(() => ({ status: "runtime_error" }));
    await evaluateStatefulSolution(FAKE_CODE, cases, deps);
    assert.ok(destroyed.includes(created[0]));
  });

  test("cookiesMatch verifies presence, exact value and absence", () => {
    assert.ok(cookiesMatch({}, {}));
    assert.ok(cookiesMatch({ a: "1" }, { a: "1", b: "2" }));
    assert.ok(!cookiesMatch({ a: "1" }, { a: "2" }));
    assert.ok(!cookiesMatch({ a: "1" }, {}));
    assert.ok(cookiesMatch({ a: null }, {}));
    assert.ok(!cookiesMatch({ a: null }, { a: "x" }));
  });
});