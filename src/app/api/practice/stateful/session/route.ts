import { NextResponse } from "next/server";
import { getProgramBySlug } from "@/content";
import {
  createStatefulSession,
  destroyStatefulSession,
  toStatefulSessionMetadata,
} from "@/lib/practice/stateful/sessionManager";
import {
  validateStatefulCreateBody,
  validateStatefulDestroyBody,
} from "@/lib/practice/stateful/payload";

// PHP spawning requires the Node.js runtime — never Edge.
export const runtime = "nodejs";

/**
 * POST  /api/practice/stateful/session  -> create a fresh isolated session
 * DELETE /api/practice/stateful/session  -> destroy a session + workspace
 *
 * Only the opaque session id and safe metadata ever reach the client.
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

  const validated = validateStatefulCreateBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  const program = getProgramBySlug(validated.value.programSlug);
  if (!program) {
    return NextResponse.json(
      { error: `Unknown program "${validated.value.programSlug}".` },
      { status: 404 },
    );
  }
  if (program.practice?.execution !== "stateful") {
    return NextResponse.json(
      { error: `Program "${validated.value.programSlug}" does not support stateful practice.` },
      { status: 400 },
    );
  }

  const session = await createStatefulSession(program.slug);
  return NextResponse.json(toStatefulSessionMetadata(session), { status: 201 });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validated = validateStatefulDestroyBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  await destroyStatefulSession(validated.value.sessionId);
  return NextResponse.json({ ok: true });
}