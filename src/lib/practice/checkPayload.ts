/**
 * Payload validation for POST /api/practice/check. Kept free of any
 * Next.js / route imports so it can be unit-tested under plain Node.
 */
import { MAX_SOURCE_BYTES } from "./limits.ts";

export interface CheckPayload {
  programSlug: string;
  code: string;
}

export type CheckPayloadResult =
  | { ok: true; payload: CheckPayload }
  | { ok: false; status: 400; error: string };

/** Rejects malformed bodies with a client-safe error message. */
export function validateCheckPayload(body: unknown): CheckPayloadResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "The request body must be a JSON object." };
  }

  const { programSlug, code } = body as Record<string, unknown>;

  if (typeof programSlug !== "string" || programSlug.trim().length === 0) {
    return { ok: false, status: 400, error: "A non-empty programSlug string is required." };
  }

  if (typeof code !== "string" || code.length === 0) {
    return { ok: false, status: 400, error: "A non-empty code string is required." };
  }

  const byteLength = new TextEncoder().encode(code).length;
  if (byteLength > MAX_SOURCE_BYTES) {
    return {
      ok: false,
      status: 400,
      error: `The submitted code exceeds the ${MAX_SOURCE_BYTES / 1024} KB limit.`,
    };
  }

  return { ok: true, payload: { programSlug, code } };
}