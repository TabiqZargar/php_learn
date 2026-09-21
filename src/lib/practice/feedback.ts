/**
 * Deterministic, status-based feedback guidance shown beneath the
 * evaluation output. This is pure data — components only render it. Hints
 * are promoted as the suggested next step only for actionable failure
 * statuses; a passing result never promotes (and never auto-reveals) hints.
 */
import type { EvaluationStatus } from "./evaluation";

export interface FeedbackGuidance {
  /** Short heading above the guidance line. */
  heading: string;
  /** One or two sentences of status-based guidance. */
  body: string;
  /** Whether the hint panel is promoted as the suggested next step. */
  offerHints: boolean;
}

export const FEEDBACK_GUIDANCE: Record<EvaluationStatus, FeedbackGuidance> = {
  passed: {
    heading: "All tests passed",
    body: "Nice work. Your solution satisfies every test case.",
    offerHints: false,
  },
  wrong_answer: {
    heading: "Wrong answer",
    body:
      "The program ran, but its output does not match the expected result for at least one test case. Compare the Expected output and Your output blocks.",
    offerHints: true,
  },
  syntax_error: {
    heading: "PHP syntax error",
    body:
      "PHP could not parse the code. Look at the reported line — a missing semicolon, quote or brace is the most common cause.",
    offerHints: true,
  },
  runtime_error: {
    heading: "Runtime error",
    body:
      "The program started but crashed while running. Read the diagnostic for the exact line where it happened.",
    offerHints: true,
  },
  timeout: {
    heading: "Execution timed out",
    body:
      "The program did not finish in time. Check for a loop condition that never becomes false.",
    offerHints: true,
  },
  output_limit: {
    heading: "Output limit reached",
    body:
      "The program printed more than the execution limit allows. Loops that echo on every iteration are a frequent cause.",
    offerHints: true,
  },
  runtime_unavailable: {
    heading: "Execution unavailable",
    body: "PHP could not be started from the server, so the solution was not graded.",
    offerHints: false,
  },
  execution_disabled: {
    heading: "Execution disabled",
    body:
      "Local PHP execution only runs on the development server, so this check is not available here.",
    offerHints: false,
  },
};