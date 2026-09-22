/**
 * Client-side HTTP wrapper for the practice execution and evaluation
 * endpoints. The browser never runs PHP — it delegates to the local dev
 * server, which owns the execution sandbox. This file is browser-safe.
 */
import type { PracticeInput, PracticeResult } from "./types";
import type { EvaluationResult } from "./evaluation";

/** Safe metadata of a stateful practice session. */
export interface StatefulSessionInfo {
  sessionId: string;
  programSlug: string;
  expiresAt: number;
}

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

/**
 * Run the program's hidden test cases against the given code. The server
 * resolves the program slug against the content registry and evaluates on
 * its side; the client only supplies the code.
 */
export async function checkPracticeSolution(
  programSlug: string,
  code: string,
): Promise<EvaluationResult> {
  let response: Response;
  try {
    response = await fetch("/api/practice/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programSlug, code }),
    });
  } catch {
    return evaluationFailure(
      "Could not reach the evaluation endpoint on the local server.",
    );
  }

  if (!response.ok) {
    let message = `The evaluation endpoint returned HTTP ${response.status}.`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      // Keep the generic message.
    }
    return evaluationFailure(message);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return evaluationFailure(
      `The evaluation endpoint returned an unreadable response (HTTP ${response.status}).`,
    );
  }

  if (
    data &&
    typeof data === "object" &&
    "status" in data &&
    "testResults" in data
  ) {
    return data as EvaluationResult;
  }

  return evaluationFailure(
    `The evaluation endpoint returned an unexpected response (HTTP ${response.status}).`,
  );
}

function evaluationFailure(message: string): EvaluationResult {
  return {
    status: "runtime_unavailable",
    passed: 0,
    total: 0,
    testResults: [],
    message,
  };
}

/**
 * Create a fresh isolated stateful practice session for a program. Returns
 * null on any failure — the caller surfaces a notice and lets the user retry.
 */
export async function createStatefulSession(
  programSlug: string,
): Promise<StatefulSessionInfo | null> {
  let response: Response;
  try {
    response = await fetch("/api/practice/stateful/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programSlug }),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  try {
    const data = (await response.json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "sessionId" in data &&
      "programSlug" in data &&
      "expiresAt" in data
    ) {
      return data as StatefulSessionInfo;
    }
  } catch {
    // Fall through to null.
  }
  return null;
}

/** Destroy a stateful practice session (best effort). */
export async function destroyStatefulSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/practice/stateful/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Run exactly one stateful request inside a practice session. The cookie jar
 * stays server-side; the response only carries learner-visible state plus the
 * number of cookies the request changed.
 */
export async function executeStatefulPractice(
  sessionId: string,
  programSlug: string,
  code: string,
  inputs: Record<string, string>,
): Promise<PracticeResult> {
  let response: Response;
  try {
    response = await fetch("/api/practice/stateful/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, programSlug, code, inputs }),
    });
  } catch {
    return {
      status: "runtime_unavailable",
      exitCode: null,
      message: "Could not reach the execution endpoint on the local server.",
    };
  }

  if (response.status === 400 || response.status === 404) {
    let message = `The execution endpoint returned HTTP ${response.status}.`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      // Keep the generic message.
    }
    return { status: "invalid_request", exitCode: null, message };
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