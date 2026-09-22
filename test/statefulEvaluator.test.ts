import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  cookiesMatch,
  evaluateStatefulSolution,
  type StatefulEvaluatorDeps,
  type StatefulStepRunResult,
} from "../src/lib/practice/statefulEvaluator.ts";
import type { StatefulTestCase } from "../src/lib/learning/types.ts";

function step(inputs: Record<string, string>, expectedOutput: string) {
  return { inputs, expectedOutput };
}

function makeCase(id: string, name: string, steps: ReturnType<typeof step>[]): StatefulTestCase {
  return { id, name, steps };
}

function makeDeps(behavior: (stepIndex: number, sessionId: string, inputs: Record<string, string>) => StatefulStepRunResult): {
  deps: StatefulEvaluatorDeps;
  created: string[];
  destroyed: string[];
} {
  const created: string[] = [];
  const destroyed: string[] = [];
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
        const index = created.indexOf(sessionId);
        return behavior(index, sessionId, inputs);
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
    const { deps } = makeDeps((index) => {
      if (index === 0) return { status: "success", stdout: "Logged in: bob" };
      return { status: "success", stdout: "Logged in: WRONG" };
    });
    const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
    assert.equal(result.status, "wrong_answer");
    assert.equal(result.passed, 0);
    assert.equal(result.testResults.length, 1);
    assert.equal(result.testResults[0].status, "wrong_answer");
    assert.equal(result.testResults[0].message, "Step 2 of 2: Output does not match the expected result.");
  });

  test("expectedCookies must hold after a step", async () => {
    const cases = [
      makeCase("c1", "Set", [
        {
          inputs: { action: "set" },
          expectedOutput: "set",
          expectedCookies: { color: "blue" },
        },
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
        {
          inputs: { action: "delete" },
          expectedOutput: "deleted",
          expectedCookies: { color: null },
        },
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

  test("step failures map to evaluation statuses", async () => {
    const statuses: StatefulStepRunResult["status"][] = [
      "syntax_error",
      "timeout",
      "output_limit",
      "runtime_unavailable",
      "execution_disabled",
      "runtime_error",
      "session_expired",
      "invalid_request",
    ];
    for (const status of statuses) {
      const cases = [makeCase("c1", "C", [step({}, "ok")])];
      const { deps } = makeDeps(() => ({ status, message: "boom" }));
      const result = await evaluateStatefulSolution(FAKE_CODE, cases, deps);
      assert.equal(result.status, "runtime_error", `unexpected ${status}`);
      assert.equal(result.testResults[0].message, "boom");
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