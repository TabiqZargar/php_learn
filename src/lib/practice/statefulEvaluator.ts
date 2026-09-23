/**
 * SERVER-ONLY evaluator for the Check Solution path of stateful, filesystem
 * and mysql programs (Phase 9A / 9B / 9C). It never touches PHP or MySQL
 * itself — the invoking route injects every function so each execution still
 * goes through the sandboxed web runner, the session manager and the server
 * side MySQL snapshot helper.
 *
 * Each test case runs inside a FRESH practice session (new workspace, new
 * PHP session + new cookie jar, new database tables). Steps inside a case are
 * executed sequentially so file/database/request state is genuinely
 * exercised. Evaluation stops at the first failing step.
 */
import type { DbTableExpectation, StatefulTestCase } from "../learning/types";
import type { PracticeInput, PracticeResultStatus } from "./types";
import type { EvaluationResult, EvaluationStatus, TestCaseResult } from "./evaluation.ts";
import { matchesOutput } from "./outputMatcher.ts";

export interface StatefulStepRunResult {
  status: PracticeResultStatus;
  stdout?: string;
  message?: string;
  /** Post-request cookie jar as name -> value (used for expectedCookies). */
  cookies?: Record<string, string>;
  /** Learner-visible count of cookie jar changes (Run display only). */
  cookiesUpdated?: number;
}

/**
 * Creates a fresh isolated session for one test case. Returns the session id,
 * or an explicit unavailable marker (MySQL runtime missing) that MUST be
 * reported as runtime_unavailable — never as a wrong answer.
 */
export type StatefulCreateSession = () => Promise<
  | { id: string }
  | { unavailable: true; message: string }
>;
/** Destroys a test session and its workspace (always called). */
export type StatefulDestroySession = (id: string) => Promise<void>;
/** Executes one step inside a live session. */
export type StatefulRunStep = (
  sessionId: string,
  code: string,
  inputs: Record<string, string>,
) => Promise<StatefulStepRunResult>;

/**
 * Reads the exact contents of named files inside the session workspace.
 * Present only for the filesystem capability (expectedFiles assertions need
 * on-disk state that stdout alone cannot express). A file that is missing or
 * unreadable resolves to null.
 */
export type StatefulSnapshotFiles = (
  sessionId: string,
  names: readonly string[],
) => Promise<Record<string, string | null>>;

/** Effective db-table state after a step, as reported by the snapshot dep. */
export interface StatefulDbTableState {
  table: string;
  /** true when the physical table exists, false when it is missing. */
  exists: boolean;
  /** Rows as column-name -> value; empty for a missing table. */
  rows: Record<string, string>[];
}

/**
 * Snapshots the effective rows of the given logical tables in the session's
 * database namespace. A failed snapshot (MySQL went away mid-evaluation) is an
 * explicit runtime_unavailable — the graders never guess a wrong answer.
 */
export type StatefulSnapshotDb = (
  sessionId: string,
  tables: readonly DbTableExpectation[],
) => Promise<
  | { ok: true; tables: StatefulDbTableState[] }
  | { ok: false; reason: "runtime_unavailable"; message?: string }
>;

export interface StatefulEvaluatorDeps {
  createSession: StatefulCreateSession;
  destroySession: StatefulDestroySession;
  runStep: StatefulRunStep;
  /** Required when any step declares expectedFiles. */
  snapshotFiles?: StatefulSnapshotFiles;
  /** Required when any step declares expectedDb. */
  snapshotDb?: StatefulSnapshotDb;
}

export async function evaluateStatefulSolution(
  code: string,
  testCases: readonly StatefulTestCase[],
  deps: StatefulEvaluatorDeps,
): Promise<EvaluationResult> {
  if (testCases.length === 0) {
    return {
      status: "runtime_unavailable",
      passed: 0,
      total: 0,
      testResults: [],
      message: "This program does not define any test cases yet.",
    };
  }

  const testResults: TestCaseResult[] = [];
  let overallStatus: EvaluationStatus = "passed";

  for (const testCase of testCases) {
    const created = await deps.createSession();
    if ("unavailable" in created) {
      overallStatus = "runtime_unavailable";
      return {
        status: "runtime_unavailable",
        passed: testResults.filter((test) => test.status === "passed").length,
        total: testCases.length,
        testResults,
        message: created.message,
      };
    }
    const sessionId = created.id;
    const outcome = await runCase(code, testCase, deps.runStep, deps.snapshotFiles, deps.snapshotDb, sessionId).finally(
      () => deps.destroySession(sessionId),
    );
    testResults.push(outcome.result);
    if (outcome.status !== "passed") {
      overallStatus = outcome.status;
      break;
    }
  }

  const passed = testResults.filter((test) => test.status === "passed").length;
  return {
    status: overallStatus,
    passed,
    total: testCases.length,
    testResults,
  };
}

async function runCase(
  code: string,
  testCase: StatefulTestCase,
  runStep: StatefulRunStep,
  snapshotFiles: StatefulSnapshotFiles | undefined,
  snapshotDb: StatefulSnapshotDb | undefined,
  sessionId: string,
): Promise<{ status: EvaluationStatus; result: TestCaseResult }> {
  const stepCount = testCase.steps.length;
  let lastInputs: Record<string, string> = {};
  let lastExpected = "";
  let lastRun: StatefulStepRunResult = { status: "runtime_error" };

  for (let index = 0; index < stepCount; index++) {
    const step = testCase.steps[index];
    lastInputs = step.inputs;
    lastExpected = step.expectedOutput;
    lastRun = await runStep(sessionId, code, step.inputs);
    const note = (message: string) =>
      stepCount > 1 ? `Step ${index + 1} of ${stepCount}: ${message}` : message;

    if (lastRun.status !== "success") {
      return {
        status: mapFailure(lastRun.status),
        result: {
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status: mapFailure(lastRun.status),
          inputs: inputsFromRecord(step.inputs),
          expectedOutput: step.expectedOutput,
          executionTimeMs: undefined,
          message: note(lastRun.message ?? "The request did not finish normally."),
        },
      };
    }

    const actualOutput = lastRun.stdout ?? "";
    if (!matchesOutput(step.expectedOutput, actualOutput)) {
      return {
        status: "wrong_answer",
        result: {
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status: "wrong_answer",
          inputs: inputsFromRecord(step.inputs),
          expectedOutput: step.expectedOutput,
          actualOutput,
          message: note("Output does not match the expected result."),
        },
      };
    }

    if (step.expectedCookies && !cookiesMatch(step.expectedCookies, lastRun.cookies)) {
      return {
        status: "wrong_answer",
        result: {
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status: "wrong_answer",
          inputs: inputsFromRecord(step.inputs),
          expectedOutput: step.expectedOutput,
          actualOutput,
          message: note("The stored browser cookie state does not match the expected result."),
        },
      };
    }

    if (step.expectedFiles) {
      const names = Object.keys(step.expectedFiles);
      const unsafe = names.filter((name) => !isSafeWorkspaceFileName(name));
      if (unsafe.length > 0) {
        return {
          status: "runtime_error",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "runtime_error",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("The test expectations reference an unsafe file name."),
          },
        };
      }
      if (!snapshotFiles) {
        return {
          status: "wrong_answer",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "wrong_answer",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("File state verification is not available for this program."),
          },
        };
      }
      const files = await snapshotFiles(sessionId, names);
      if (!filesMatch(step.expectedFiles, files)) {
        return {
          status: "wrong_answer",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "wrong_answer",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("The file state does not match the expected result."),
          },
        };
      }
    }

    if (step.expectedDb) {
      const unsafe = step.expectedDb.filter((entry) => !isSafeSqlIdentifier(entry.table));
      if (unsafe.length > 0) {
        return {
          status: "runtime_error",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "runtime_error",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("The test expectations reference an unsafe table name."),
          },
        };
      }
      if (!snapshotDb) {
        return {
          status: "wrong_answer",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "wrong_answer",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("Database state verification is not available for this program."),
          },
        };
      }
      const snapshot = await snapshotDb(sessionId, step.expectedDb);
      if (!snapshot.ok) {
        return {
          status: "runtime_unavailable",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "runtime_unavailable",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note(snapshot.message ?? "The practice database is unavailable."),
          },
        };
      }
      if (!dbStateMatch(step.expectedDb, snapshot.tables)) {
        return {
          status: "wrong_answer",
          result: {
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: "wrong_answer",
            inputs: inputsFromRecord(step.inputs),
            expectedOutput: step.expectedOutput,
            actualOutput,
            message: note("The database state does not match the expected result."),
          },
        };
      }
    }
  }

  return {
    status: "passed",
    result: {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      status: "passed",
      inputs: inputsFromRecord(lastInputs),
      expectedOutput: lastExpected,
      actualOutput: lastRun.stdout ?? "",
    },
  };
}

/**
 * A workspace file assertion key must be a bare, harmless filename: a
 * non-empty string with no path separators (Windows and POSIX), no traversal,
 * no drive letter / URI prefix, no leading dot, no reserved workspace names
 * and a bounded length. It is the last guard before any path join happens.
 */
export function isSafeWorkspaceFileName(name: string): boolean {
  if (typeof name !== "string" || name.length === 0 || name.length > 80) return false;
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return false;
  if (/^\./.test(name)) return false;
  const reserved = new Set(["program.php", "router.php", "__token.txt", "sess"]);
  return !reserved.has(name);
}

/**
 * A database table assertion must be a bare, harmless SQL identifier:
 * a word starting with a letter, no backticks/quotes, no dots or dashes,
 * bounded length. It is the last guard before any of these names reach a
 * server-side query, exactly mirroring the server-side validation.
 */
export function isSafeSqlIdentifier(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name);
}

/**
 * Compare expected database state against a snapshot.
 *
 * - rows === null  → the table must NOT exist.
 * - rows === []    → the table must exist and be empty.
 * - rows otherwise → the table must exist and contain exactly those rows,
 *   compared as a multiset: column names are normalized by canonical JSON of
 *   each row and every value is treated as a string, so numeric vs string
 *   cells from mysqlnd never cause false mismatches.
 */
export function dbStateMatch(
  expected: readonly DbTableExpectation[],
  actual: readonly { table: string; exists: boolean; rows: Record<string, string>[] }[],
): boolean {
  const byName = new Map(actual.map((state) => [state.table, state]));
  for (const entry of expected) {
    const state = byName.get(entry.table);
    if (entry.rows === null) {
      if (state && state.exists) return false;
      continue;
    }
    if (!state || !state.exists) return false;
    if (!rowMultisetEqual(entry.rows, state.rows)) return false;
  }
  return true;
}

function rowMultisetEqual(
  expected: readonly Record<string, string>[],
  actual: readonly Record<string, string>[],
): boolean {
  if (expected.length !== actual.length) return false;
  const count = new Map<string, number>();
  for (const row of expected) {
    const key = canonicalRow(row);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  for (const row of actual) {
    const key = canonicalRow(row);
    const remaining = count.get(key);
    if (remaining === undefined || remaining === 0) return false;
    count.set(key, remaining - 1);
  }
  return true;
}

function canonicalRow(row: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(row)
      .map(([column, value]) => [column, String(value)] as const)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

/** Expected: value string must be the exact contents; null must be absent. */
export function filesMatch(
  expected: Record<string, string | null>,
  actual: Record<string, string | null> | undefined,
): boolean {
  const disk = actual ?? {};
  for (const [name, wanted] of Object.entries(expected)) {
    const present = name in disk;
    if (wanted === null) {
      if (present && disk[name] !== null) return false;
    } else if (!present || disk[name] !== wanted) {
      return false;
    }
  }
  return true;
}

/** Expected: value string must exist with that value; null must be absent. */
export function cookiesMatch(
  expected: Record<string, string | null>,
  actual: Record<string, string> | undefined,
): boolean {
  const jar = actual ?? {};
  for (const [name, wanted] of Object.entries(expected)) {
    const present = name in jar;
    if (wanted === null) {
      if (present) return false;
    } else if (!present || jar[name] !== wanted) {
      return false;
    }
  }
  return true;
}

function inputsFromRecord(record: Record<string, string>): PracticeInput[] {
  return Object.entries(record).map(([name, value]) => ({
    name,
    label: name,
    type: "text" as const,
    value,
  }));
}

function mapFailure(status: PracticeResultStatus): EvaluationStatus {
  switch (status) {
    case "syntax_error":
      return "syntax_error";
    case "timeout":
      return "timeout";
    case "output_limit":
      return "output_limit";
    case "runtime_unavailable":
      return "runtime_unavailable";
    case "execution_disabled":
      return "execution_disabled";
    default:
      // runtime_error, invalid_request, session_expired, session_not_found …
      return "runtime_error";
  }
}