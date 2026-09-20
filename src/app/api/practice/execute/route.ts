import { NextResponse } from "next/server";
import type { PracticeInput, PracticeResult } from "@/lib/practice/types";
import {
  MAX_INPUT_BYTES,
  MAX_SOURCE_BYTES,
  runLocalPhp,
} from "@/lib/practice/localPhpRunner";

// PHP spawning requires the Node.js runtime — never Edge.
export const runtime = "nodejs";

interface ExecuteRequest {
  code?: unknown;
  inputs?: unknown;
}

function invalidRequest(message: string): NextResponse {
  return NextResponse.json(
    { status: "invalid_request", exitCode: null, message } satisfies PracticeResult,
    { status: 400 },
  );
}

function isPracticeInput(value: unknown): value is PracticeInput {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.label === "string" &&
    (candidate.type === "text" || candidate.type === "number") &&
    typeof candidate.value === "string"
  );
}

export async function POST(request: Request) {
  let body: ExecuteRequest;
  try {
    body = (await request.json()) as ExecuteRequest;
  } catch {
    return invalidRequest("The request body must be valid JSON.");
  }

  if (typeof body.code !== "string" || body.code.length === 0) {
    return invalidRequest("A non-empty code string is required.");
  }

  if (Buffer.byteLength(body.code, "utf8") > MAX_SOURCE_BYTES) {
    return invalidRequest(
      `The submitted code exceeds the ${MAX_SOURCE_BYTES / 1024} KB limit.`,
    );
  }

  if (body.inputs !== undefined) {
    if (!Array.isArray(body.inputs) || !body.inputs.every(isPracticeInput)) {
      return invalidRequest(
        "inputs must be an array of { name, label, type, value } objects.",
      );
    }
    const totalInputBytes = (body.inputs as PracticeInput[]).reduce(
      (sum, input) => sum + Buffer.byteLength(input.value, "utf8"),
      0,
    );
    if (totalInputBytes > MAX_INPUT_BYTES) {
      return invalidRequest(
        `The combined input exceeds the ${MAX_INPUT_BYTES / 1024} KB limit.`,
      );
    }
  }

  const result = await runLocalPhp(body.code, body.inputs ?? []);
  return NextResponse.json(result);
}