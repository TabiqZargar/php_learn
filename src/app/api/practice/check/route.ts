import { NextResponse } from "next/server";
import { getProgramBySlug } from "@/content";
import { runLocalPhp } from "@/lib/practice/localPhpRunner";
import { evaluateSolution } from "@/lib/practice/evaluator";
import { validateCheckPayload } from "@/lib/practice/checkPayload";

// PHP spawning requires the Node.js runtime — never Edge.
export const runtime = "nodejs";

/**
 * POST /api/practice/check
 * Body: { programSlug: string, code: string }
 * The client sends only code + slug; the server owns the test cases and
 * every execution. Returns a typed EvaluationResult, or a typed error for
 * malformed/unknown requests.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validated = validateCheckPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const program = getProgramBySlug(validated.payload.programSlug);
  if (!program) {
    return NextResponse.json(
      { error: `Unknown program "${validated.payload.programSlug}".` },
      { status: 404 },
    );
  }

  const testCases = program.testCases;
  if (!testCases || testCases.length === 0) {
    return NextResponse.json(
      {
        error: `Program "${validated.payload.programSlug}" does not support solution evaluation yet.`,
      },
      { status: 400 },
    );
  }

  const evaluation = await evaluateSolution(validated.payload.code, testCases, runLocalPhp);
  return NextResponse.json(evaluation);
}