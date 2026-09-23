/**
 * SERVER-ONLY evaluator for the Check Solution path of stateful and
 * filesystem programs (Phase 9A / 9B). It never touches PHP itself — the
 * invoking route injects every function so each execution still goes through
 * the sandboxed web runner and the session manager.
 *
 * Each test case runs inside a FRESH practice session (new workspace, new
 * PHP session + new cookie jar). Steps inside a case are executed
 * sequentially so file/request state is genuinely exercised. Evaluation stops
 * at the first failing step.
 */
import type { StatefulTestCase } from "../learning/types";
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

/** Creates a fresh isolated session for one test case. */
export type StatefulCreateSession = () => Promise<{ id: string }>;
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

export interface StatefulEvaluatorDeps {
  createSession: StatefulCreateSession;
  destroySession: StatefulDestroySession;
  runStep: StatefulRunStep;
  /** Required when any step declares expectedFiles. */
  snapshotFiles?: StatefulSnapshotFiles;
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
    const session = await deps.createSession();
    const outcome = await runCase(code, testCase, deps.runStep, deps.snapshotFiles, session.id).finally(
      () => deps.destroySession(session.id),
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