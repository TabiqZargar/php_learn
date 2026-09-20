/**
 * Practice input/output model — consumed by the client UI, the API route
 * and the local PHP runner. All values must stay JSON-serializable so
 * results round-trip through the HTTP endpoint untouched.
 */

export type PracticeInputType = "text" | "number";

export interface PracticeInput {
  /** Stable key referenced by the future runner. */
  name: string;
  /** Human-friendly label for the input field. */
  label: string;
  type: PracticeInputType;
  /** Default value as a string (number inputs are held as text). */
  value: string;
  /** Optional helper text shown under the field. */
  description?: string;
}

/** Editorial config the Practice UI uses to boot a session. */
export interface PracticeConfig {
  /** Starter template; do NOT ship the full solution. */
  starterCode: string;
  inputs: PracticeInput[];
}

export type PracticeResultStatus =
  | "success"
  | "runtime_error"
  | "syntax_error"
  | "timeout"
  | "output_limit"
  | "runtime_unavailable"
  | "execution_disabled"
  | "invalid_request"
  | "not_implemented";

export interface PracticeResult {
  status: PracticeResultStatus;
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
  exitCode?: number | null;
  /** Human-facing explanation rendered in the Output panel. */
  message?: string;
}

export interface PracticeRunner {
  run(code: string, inputs: PracticeInput[]): Promise<PracticeResult>;
}