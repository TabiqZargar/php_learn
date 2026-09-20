/**
 * Client-side HTTP wrapper for the practice execution endpoint.
 * The browser never runs PHP — it delegates to the local dev server,
 * which owns the execution sandbox. This file is browser-safe.
 */
import type { PracticeInput, PracticeResult } from "./types";

export async function executePractice(
  code: string,
  inputs: PracticeInput[],
): Promise<PracticeResult> {
  let response: Response;
  try {
    response = await fetch("/api/practice/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, inputs }),
    });
  } catch {
    return {
      status: "runtime_unavailable",
      exitCode: null,
      message: "Could not reach the execution endpoint on the local server.",
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      status: "runtime_unavailable",
      exitCode: null,
      message: `The execution endpoint returned an unreadable response (HTTP ${response.status}).`,
    };
  }

  if (data && typeof data === "object" && "status" in data) {
    return data as PracticeResult;
  }

  return {
    status: "runtime_unavailable",
    exitCode: null,
    message: `The execution endpoint returned an unexpected response (HTTP ${response.status}).`,
  };
}