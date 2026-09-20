/**
 * Practice input/output model — designed so a future execution engine
 * can consume it directly. Nothing here executes PHP.
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

export type PracticeResultStatus = "success" | "error" | "timeout" | "not_implemented";

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
  run(code: string, inputs: PracticeInput[]): PracticeResult;
}