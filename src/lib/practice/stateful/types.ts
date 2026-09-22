/**
 * Shared types for the stateful execution layer (Phase 9A). These models
 * round-trip through the API as JSON, so every field must stay
 * JSON-serializable and free of host-specific paths.
 */
import type { PracticeResultStatus } from "../types";

/**
 * A live, isolated practice session. `id` is an opaque, cryptographically
 * strong server-generated identifier — never derived from slugs, usernames,
 * IPs, timestamps or submitted code.
 */
export interface StatefulPracticeSession {
  /** Opaque server-generated identifier (crypto.randomUUID). */
  id: string;
  /** The program this session belongs to; all requests are vetoed against it. */
  programSlug: string;
  /**
   * Dedicated throwaway workspace for this session. NEVER sent to the
   * client — visible only to server-side modules and tests.
   */
  workspacePath: string;
  createdAt: number;
  /** Epoch ms after which the session is rejected and cleaned up. */
  expiresAt: number;
}

/**
 * The safe metadata shape returned to the client on session creation.
 * Workspace paths and internal state are never exposed.
 */
export interface StatefulSessionMetadata {
  sessionId: string;
  programSlug: string;
  expiresAt: number;
}

/**
 * Result of one stateful request, as produced by the web runner before the
 * practice-session cookie jar is applied. The jar update itself lives in the
 * session manager so the runner stays a thin HTTP transport.
 */
export interface StatefulPhpResponse {
  status: PracticeResultStatus;
  /** Sanitized response body (host paths are stripped). */
  stdout: string;
  /** Reserved for transport diagnostics; PHP server logs are never returned. */
  stderr: string;
  executionTimeMs: number;
  /** Raw Set-Cookie headers observed on the response, in order. */
  setCookieHeaders: string[];
  /** Human-facing explanation for non-success statuses. */
  message?: string;
}