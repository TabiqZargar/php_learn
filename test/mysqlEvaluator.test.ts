import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { DbTableExpectation, StatefulTestCase } from "../src/lib/learning/types.ts";
import {
  dbStateMatch,
  evaluateStatefulSolution,
  isSafeSqlIdentifier,
  type StatefulDbTableState,
} from "../src/lib/practice/statefulEvaluator.ts";

function dbState(table: string, exists: boolean, rows: Record<string, string>[] = []): StatefulDbTableState {
  return { table, exists, rows };
}

describe("dbStateMatch semantics", () => {
  const emptyTable: DbTableExpectation = { table: "students", rows: [] };
  const seededRows: DbTableExpectation = {
    table: "students",
    rows: [
      { id: "1", name: "Alice", grade: "85" },
      { id: "2", name: "Bob", grade: "92" },
    ],
  };

  test("rows null requires a missing table", () => {
    assert.equal(dbStateMatch([{ table: "students", rows: null }], [dbState("students", false)]), true);
    assert.equal(dbStateMatch([{ table: "students", rows: null }], [dbState("students", true)]), false);
  });

  test("rows [] requires an existing empty table", () => {
    assert.equal(dbStateMatch([emptyTable], [dbState("students", true)]), true);
    assert.equal(dbStateMatch([emptyTable], [dbState("students", false)]), false);
    assert.equal(dbStateMatch([emptyTable], [dbState("students", true, [{ id: "1" }])]), false);
  });

  test("rows compare as an order-insensitive multiset", () => {
    const scrambled = [
      { table: "students", exists: true, rows: [{ grade: "92", name: "Bob", id: "2" }, { id: "1", grade: "85", name: "Alice" }] },
    ];
    assert.equal(dbStateMatch([seededRows], scrambled), true);
  });

  test("numeric vs string cells match after normalization", () => {
    assert.equal(
      dbStateMatch(
        [{ table: "students", rows: [{ id: "1", name: "Alice", grade: "85" }] }],
        [dbState("students", true, [{ id: "1", name: "Alice", grade: "85" }])],
      ),
      true,
    );
    assert.equal(
      dbStateMatch(
        [{ table: "students", rows: [{ id: "1", grade: "85" }] }],
        [dbState("students", true, [{ id: "1", grade: "85.0000" }])],
      ),
      false,
      "different cell values must mismatch",
    );
  });

  test("wrong row set mismatches", () => {
    const missingBob: DbTableExpectation = {
      table: "students",
      rows: [{ id: "1", name: "Alice", grade: "85" }],
    };
    assert.equal(dbStateMatch([missingBob], [dbState("students", true, seededRows.rows!)]), false);
    assert.equal(
      dbStateMatch([seededRows], [dbState("students", true, [{ id: "1", name: "Alice", grade: "85" }])]),
      false,
    );
  });

  test("non-existent asserted tables fail, and absent entries are ignored", () => {
    assert.equal(dbStateMatch([seededRows], [dbState("students", true, [{ id: "1" }])]), false);
    assert.equal(dbStateMatch([{ table: "missing", rows: null }], [dbState("students", true)]), true);
  });

  test("only safe bare identifiers pass", () => {
    assert.ok(isSafeSqlIdentifier("students"));
    assert.ok(isSafeSqlIdentifier("products"));
    assert.equal(isSafeSqlIdentifier("`students`"), false);
    assert.equal(isSafeSqlIdentifier("droppable;"), false);
    assert.equal(isSafeSqlIdentifier("x".repeat(65)), false);
  });
});

describe("mysql evaluator flow", () => {
  function caseWithSteps(
    id: string,
    steps: StatefulTestCase["steps"],
  ): StatefulTestCase {
    return { id, name: id, steps };
  }

  function echoRunStep() {
    return async (_session: string, _code: string, inputs: Record<string, string>) => ({
      status: "success" as const,
      stdout: inputs.out ?? "",
    });
  }

  test("a program without test cases reports runtime_unavailable", async () => {
    const result = await evaluateStatefulSolution("<?php", [], {
      createSession: async () => ({ id: "s1" }),
      destroySession: async () => {},
      runStep: echoRunStep(),
    });
    assert.equal(result.status, "runtime_unavailable");
    assert.match(result.message!, /test cases/);
  });

  test("a missing MySQL runtime surfaces as runtime_unavailable, never a wrong answer", async () => {
    const created: string[] = [];
    let destroys = 0;
    const result = await evaluateStatefulSolution(
      "<?php",
      [caseWithSteps("c1", [{ inputs: { out: "ok" }, expectedOutput: "ok" }])],
      {
        createSession: async () => {
          created.push("x");
          return { unavailable: true, message: "MySQL practice is not configured for this instance." };
        },
        destroySession: async () => {
          destroys += 1;
        },
        runStep: echoRunStep(),
      },
    );
    assert.equal(result.status, "runtime_unavailable");
    assert.match(result.message!, /not configured/);
    assert.equal(result.total, 1);
    assert.equal(result.passed, 0);
    assert.equal(created.length, 1, "the unavailable marker must be consulted per case");
    assert.equal(destroys, 0, "no session was created, so none must be destroyed");
  });

  test("an expectedDb mismatch yields a wrong answer and stops the run", async () => {
    let sessions = 0;
    let destroys = 0;
    const result = await evaluateStatefulSolution(
      "<?php",
      [
        caseWithSteps("bad-db", [
          {
            inputs: { out: "ok" },
            expectedOutput: "ok",
            expectedDb: [{ table: "students", rows: null }],
          },
        ]),
        caseWithSteps("never-run", [{ inputs: { out: "ok" }, expectedOutput: "ok" }]),
      ],
      {
        createSession: async () => {
          sessions += 1;
          return { id: `s${sessions}` };
        },
        destroySession: async () => {
          destroys += 1;
        },
        runStep: echoRunStep(),
        snapshotDb: async () => ({ ok: true, tables: [dbState("students", true)] }),
      },
    );
    assert.equal(result.status, "wrong_answer");
    assert.equal(result.passed, 0);
    assert.equal(result.total, 2);
    assert.equal(sessions, 1, "evaluation must stop at the first failing case");
    assert.equal(destroys, 1, "the opened session must always be destroyed");
  });

  test("matching database state passes and every session is destroyed", async () => {
    const destroys: string[] = [];
    const result = await evaluateStatefulSolution(
      "<?php",
      [
        caseWithSteps("ok-1", [{ inputs: { out: "a" }, expectedOutput: "a" }]),
        caseWithSteps("ok-2", [
          {
            inputs: { out: "b" },
            expectedOutput: "b",
            expectedDb: [{ table: "students", rows: null }],
          },
        ]),
      ],
      {
        createSession: async () => ({ id: "s1" }),
        destroySession: async (id) => {
          destroys.push(id);
        },
        runStep: echoRunStep(),
        snapshotDb: async () => ({ ok: true, tables: [dbState("students", false)] }),
      },
    );
    assert.equal(result.status, "passed");
    assert.equal(result.passed, 2);
    assert.equal(result.total, 2);
    assert.deepEqual(destroys, ["s1", "s1"]);
  });

  test("an unsafe logical table name in expectations is a runtime_error", async () => {
    const result = await evaluateStatefulSolution(
      "<?php",
      [
        caseWithSteps("unsafe", [
          {
            inputs: { out: "ok" },
            expectedOutput: "ok",
            expectedDb: [{ table: "`students`", rows: [] }],
          },
        ]),
      ],
      {
        createSession: async () => ({ id: "s1" }),
        destroySession: async () => {},
        runStep: echoRunStep(),
        snapshotDb: async () => ({ ok: true, tables: [] }),
      },
    );
    assert.equal(result.status, "runtime_error");
    assert.match(result.testResults[0].message!, /unsafe table name/i);
  });

  test("a snapshot failure is reported as runtime_unavailable, not a wrong answer", async () => {
    const result = await evaluateStatefulSolution(
      "<?php",
      [
        caseWithSteps("gone", [
          {
            inputs: { out: "ok" },
            expectedOutput: "ok",
            expectedDb: [{ table: "students", rows: [] }],
          },
        ]),
      ],
      {
        createSession: async () => ({ id: "s1" }),
        destroySession: async () => {},
        runStep: echoRunStep(),
        snapshotDb: async () => ({ ok: false, reason: "runtime_unavailable", message: "MySQL went away." }),
      },
    );
    assert.equal(result.status, "runtime_unavailable");
    assert.equal(result.testResults[0].status, "runtime_unavailable");
    assert.match(result.testResults[0].message ?? "", /went away|unavailable/i);
  });

  test("a step that asserts db state without a snapshot dependency is a wrong answer", async () => {
    const result = await evaluateStatefulSolution(
      "<?php",
      [
        caseWithSteps("no-dep", [
          {
            inputs: { out: "ok" },
            expectedOutput: "ok",
            expectedDb: [{ table: "students", rows: [] }],
          },
        ]),
      ],
      {
        createSession: async () => ({ id: "s1" }),
        destroySession: async () => {},
        runStep: echoRunStep(),
      },
    );
    assert.equal(result.status, "wrong_answer");
    assert.match(result.testResults[0].message!, /not available/i);
  });
});