/**
 * Request-body validators for the stateful practice API (Phase 9A). Mirror
 * checkPayload.ts: fail closed on anything unexpected, cap every untrusted
 * string, and let the caller decide the HTTP status.
 */
import { MAX_INPUT_BYTES, MAX_SOURCE_BYTES } from "../limits.ts";

export type ValidateResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function codeBytes(code: string): number {
  return Buffer.byteLength(code, "utf8");
}

export interface StatefulCreateBody {
  programSlug: string;
}

export function validateStatefulCreateBody(
  body: unknown,
): ValidateResult<StatefulCreateBody> {
  if (!isRecord(body)) return { ok: false, message: "Invalid request body." };
  const { programSlug } = body;
  if (!isNonEmptyString(programSlug)) {
    return { ok: false, message: "Missing programSlug." };
  }
  return { ok: true, value: { programSlug } };
}

export interface StatefulDestroyBody {
  sessionId: string;
}

export function validateStatefulDestroyBody(
  body: unknown,
): ValidateResult<StatefulDestroyBody> {
  if (!isRecord(body)) return { ok: false, message: "Invalid request body." };
  const { sessionId } = body;
  if (!isNonEmptyString(sessionId)) {
    return { ok: false, message: "Missing sessionId." };
  }
  return { ok: true, value: { sessionId } };
}

export interface StatefulExecuteBody {
  sessionId: string;
  programSlug: string;
  code: string;
  inputs: Record<string, string>;
}

export function validateStatefulExecuteBody(
  body: unknown,
): ValidateResult<StatefulExecuteBody> {
  if (!isRecord(body)) return { ok: false, message: "Invalid request body." };
  const { sessionId, programSlug, code, inputs } = body;

  if (!isNonEmptyString(sessionId)) {
    return { ok: false, message: "Missing sessionId." };
  }
  if (!isNonEmptyString(programSlug)) {
    return { ok: false, message: "Missing programSlug." };
  }
  if (typeof code !== "string") {
    return { ok: false, message: "Missing code." };
  }
  if (codeBytes(code) > MAX_SOURCE_BYTES) {
    return {
      ok: false,
      message: `The submitted code exceeds the ${MAX_SOURCE_BYTES / 1024} KB limit.`,
    };
  }
  if (inputs !== undefined && !isRecord(inputs)) {
    return { ok: false, message: "Invalid inputs." };
  }

  const cleanInputs: Record<string, string> = {};
  for (const [key, value] of Object.entries(inputs ?? {})) {
    if (typeof value !== "string" || key.length === 0) {
      return { ok: false, message: "Invalid input values." };
    }
    cleanInputs[key] = value;
  }
  const totalInputBytes = Object.entries(cleanInputs).reduce(
    (sum, [key, value]) => sum + Buffer.byteLength(key, "utf8") + Buffer.byteLength(value, "utf8"),
    0,
  );
  if (totalInputBytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      message: `The combined input exceeds the ${MAX_INPUT_BYTES / 1024} KB limit.`,
    };
  }

  return { ok: true, value: { sessionId, programSlug, code, inputs: cleanInputs } };
}