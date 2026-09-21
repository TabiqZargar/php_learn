/**
 * Typed result model for Check Solution. Round-trips through the API
 * endpoint untouched, so every field must stay JSON-serializable.
 */
import type { PracticeInput } from "./types";
import type { ProgramTestCase } from "../learning/types";

/** End state of one test case. */
export type EvaluationStatus =
  | "passed"
  | "wrong_answer"
  | "runtime_error"
  | "syntax_error"
  | "timeout"
  | "output_limit"
  | "runtime_unavailable"
  | "execution_disabled";

export interface TestCaseResult {
  testCaseId: string;
  testCaseName: string;
  status: EvaluationStatus;
  inputs: PracticeInput[];
  expectedOutput: string;
  /** What the program actually printed (only for statuses that reached a comparison). */
  actualOutput?: string;
  /** Sanitized PHP diagnostic (Parse error, etc.) for non-success statuses. */
  diagnostic?: string;
  executionTimeMs?: number;
  exitCode?: number | null;
  /** Human-facing explanation rendered in the result panel. */
  message?: string;
}

export interface EvaluationResult {
  status: EvaluationStatus;
  /** Number of test cases that passed before the run stopped. */
  passed: number;
  /** Total number of test cases defined for the program. */
  total: number;
  testResults: TestCaseResult[];
  /** Optional top-level explanation (endpoint failures, no test cases, ...). */
  message?: string;
}

export type { ProgramTestCase };