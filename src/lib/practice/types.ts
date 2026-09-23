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

/**
 * Capability model for a practice program. "pure" runs each request against
 * a throwaway CLI process (Phase 1–8). "stateful" runs raw HTTP requests
 * through an isolated php -S session so PHP sessions and cookies behave
 * exactly like a web request (Phase 9A). "filesystem" reuses the same
 * isolated per-session workspace so learner file writes, reads, appends and
 * deletes persist across the session's requests exactly like on disk
 * (Phase 9B). "mysql" is the same isolated session + workspace plus a
 * restricted connection to a dedicated practice database whose schema and
 * tables are scoped to the session (Phase 9C). The capability is explicit
 * per program and validated server-side — it is never inferred from the slug.
 */
export type ExecutionCapability = "pure" | "stateful" | "filesystem" | "mysql";

/** Editorial config the Practice UI uses to boot a session. */
export interface PracticeConfig {
  /** Runtime model for this program's exercises. */
  execution: ExecutionCapability;
  /** Visitor-actionable form fields shown below the editor. */
  inputs: PracticeInput[];
  /**
   * Starter template; do NOT ship the full solution. Stateful programs must
   * start from $_POST / session / request abstractions only.
   */
  starterCode: string;
  /**
   * MySQL practice metadata (execution === "mysql" only). Logical table names
   * the server seeds into this session's database namespace at session
   * creation (e.g. the update/delete programs seed a deterministic
   * "students" table so learners mutate known rows). The list is not secret —
   * it travels with the content bundle — but the actual physical table names
   * are prefixed per session server-side.
   */
  mysql?: {
    seedTables?: string[];
  };
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
  | "not_implemented"
  /** The practice session hit its TTL or was destroyed server-side. */
  | "session_expired"
  /** No session with the supplied id exists on the server. */
  | "session_not_found";

export interface PracticeResult {
  status: PracticeResultStatus;
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
  exitCode?: number | null;
  /** Human-facing explanation rendered in the Output panel. */
  message?: string;
  /**
   * Present on successful stateful runs. Count of learner-visible cookie jar
   * changes caused by this request (the PHP session cookie is excluded).
   */
  cookiesUpdated?: number;
}

export interface PracticeRunner {
  run(code: string, inputs: PracticeInput[]): Promise<PracticeResult>;
}