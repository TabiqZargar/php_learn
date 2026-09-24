/**
 * SERVER-ONLY evaluator for Check Solution. It never spawns PHP itself —
 * the invoking route injects the existing runner, so every execution still
 * goes through the sandbox in localPhpRunner. Cases run in order and the
 * evaluation stops at the first failing or erroring test.
 */
import type { PracticeResultStatus } from "./types";
import type { PracticeInput, PracticeResult } from "./types";
import type { ProgramTestCase } from "../learning/types";
import type { EvaluationResult, EvaluationStatus, TestCaseResult } from "./evaluation.ts";
import { matchesOutput } from "./outputMatcher.ts";
import { sanitizePhpOutput } from "./localPhpRunner.ts";

export type PracticeRunFn = (
  code: string,
  inputs: PracticeInput[],
) => Promise<PracticeResult>;

/**
 * Run every test case for a program against the injected runner. The
 * runner is expected to return a PracticeResult for every input — it never
 * rejects.
 */
export async function evaluateSolution(
  code: string,
  testCases: readonly ProgramTestCase[],
  run: PracticeRunFn,
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
    const runResult = await run(code, testCase.inputs);
    const base = {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      inputs: testCase.inputs,
      expectedOutput: testCase.expectedOutput,
      executionTimeMs: runResult.executionTimeMs,
      exitCode: runResult.exitCode,
    };

    if (runResult.status === "success") {
      const actualOutput = runResult.stdout ?? "";
      if (matchesOutput(testCase.expectedOutput, actualOutput)) {
        testResults.push({ ...base, status: "passed", actualOutput });
        continue;
      }
      testResults.push({
        ...base,
        status: "wrong_answer",
        actualOutput,
        message: "Output does not match the expected result.",
      });
      overallStatus = "wrong_answer";
      break;
    }

    const status = mapFailure(runResult.status);
    testResults.push({
      ...base,
      status,
      message: runResult.message,
      diagnostic: diagnosticFromResult(runResult),
    });
    overallStatus = status;
    break;
  }

  const passed = testResults.filter((test) => test.status === "passed").length;
  return { status: overallStatus, passed, total: testCases.length, testResults };
}

/** Translate a runner status into an evaluation status. */
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
      // runtime_error, invalid_request, not_implemented — all "the program
      // did not finish normally".
      return "runtime_error";
  }
}

/**
 * Combined stdout+stderr with the throwaway script path hidden.
 */
function diagnosticFromResult(result: PracticeResult): string | undefined {
  const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (!combined) return undefined;
  return sanitizePhpOutput(combined);
}