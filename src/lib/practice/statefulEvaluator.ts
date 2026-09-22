/**
 * SERVER-ONLY evaluator for the Check Solution path of stateful programs
 * (Phase 9A). It never touches PHP itself — the invoking route injects three
 * functions so every execution still goes through the sandboxed web runner
 * and the session manager.
 *
 * Each test case runs inside a FRESH practice session (new PHP session + new
 * cookie jar). Steps inside a case are executed sequentially so request
 * state is genuinely exercised. Evaluation stops at the first failing step.
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

export interface StatefulEvaluatorDeps {
  createSession: StatefulCreateSession;
  destroySession: StatefulDestroySession;
  runStep: StatefulRunStep;
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
    const outcome = await runCase(code, testCase, deps.runStep, session.id).finally(
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