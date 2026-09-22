/**
 * In-memory registry of stateful practice sessions (Phase 9A).
 *
 * Each session owns a dedicated throwaway workspace under the OS temp dir:
 *
 *   <tmp>/php-academy-stateful-<random>/
 *     router.php    gate + session bootstrap (runs untrusted code)
 *     __token.txt   random bearer token the web runner must present
 *     sess/         PHP session.save_path, isolated per session
 *     program.php   the learner's code, written per request
 *
 * The registry is explicitly NON-PERSISTENT and single-process: it lives in
 * the Next server's memory, so a server restart clears every session. That is
 * acceptable for a teaching tool and documented in
 * docs/STATEFUL_PHP_EXECUTION.md.
 *
 * All identifiers come from crypto.randomUUID(). Sessions expire after
 * STATEFUL_SESSION_TTL_MS and their workspace is deleted.
 */
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SESSION_COOKIE_NAME, STATEFUL_SESSION_TTL_MS } from "../limits.ts";
import type { CookieJar } from "./cookieJar.ts";
import type {
  StatefulPracticeSession,
  StatefulSessionMetadata,
} from "./types.ts";

/**
 * Written WITHOUT a BOM — any leading byte breaks header-emitting PHP.
 *
 * The router deliberately does NOT call session_start(): learning programs
 * must call it themselves, exactly like on a real web host. It only pins the
 * session storage directory (defense in depth — the -d flag is not reliable
 * for session.save_path) and turns every uncaught Throwable into HTTP 500 so
 * the web runner can distinguish success, syntax and runtime failures.
 */
const ROUTER_SOURCE = `<?php
$token = trim((string) @file_get_contents(__DIR__ . "/__token.txt"));
if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "POST"
    || ($_SERVER["HTTP_X_PRACTICE_TOKEN"] ?? "") !== $token) {
    http_response_code(403);
    exit;
}
ini_set("session.save_path", __DIR__ . "/sess");
ob_start();
try {
    require __DIR__ . "/program.php";
} catch (Throwable $error) {
    http_response_code(500);
    ob_end_clean();
    echo get_class($error) . ": " . $error->getMessage()
        . " in program.php:" . $error->getLine();
    exit;
}
ob_end_flush();
`;

interface SessionRecord {
  session: StatefulPracticeSession;
  /** Per-session cookie jar shared by every request of the session. */
  jar: CookieJar;
  /** Serializes requests issued to this session (one PHP server at a time). */
  chain: Promise<unknown>;
}

const registry = new Map<string, SessionRecord>();

let sweepTimer: NodeJS.Timeout | null = null;

/** Create an isolated session and its throwaway workspace. */
export async function createStatefulSession(
  programSlug: string,
): Promise<StatefulPracticeSession> {
  const workspacePath = await mkdtemp(join(tmpdir(), "php-academy-stateful-"));
  try {
    await mkdir(join(workspacePath, "sess"), { recursive: true });
    await writeFile(join(workspacePath, "router.php"), ROUTER_SOURCE, "utf8");
    await writeFile(join(workspacePath, "__token.txt"), randomUUID(), "utf8");
  } catch (error) {
    await rm(workspacePath, { recursive: true, force: true });
    throw error;
  }

  const now = Date.now();
  const session: StatefulPracticeSession = {
    id: randomUUID(),
    programSlug,
    workspacePath,
    createdAt: now,
    expiresAt: now + STATEFUL_SESSION_TTL_MS,
  };
  registry.set(session.id, { session, jar: new Map(), chain: Promise.resolve() });
  sweepExpiredSessions();
  scheduleSweep();
  return session;
}

function scheduleSweep(): void {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    void sweepExpiredSessions();
  }, STATEFUL_SESSION_TTL_MS / 2);
  sweepTimer.unref?.();
}

/** Destroy every session past its expiry; returns the destroyed ids. */
export async function sweepExpiredSessions(): Promise<string[]> {
  const now = Date.now();
  const expired: string[] = [];
  for (const id of registry.keys()) {
    const record = registry.get(id);
    if (record && record.session.expiresAt <= now) {
      expired.push(id);
      await destroyStatefulSession(id);
    }
  }
  return expired;
}

export type SessionResolve =
  | { ok: true; record: SessionRecord }
  | { ok: false; reason: "not_found" | "expired" };

/** Map a resolution failure onto the learner-visible result status. */
export function sessionResolveStatus(resolve: SessionResolve): "session_expired" | "session_not_found" | null {
  if (resolve.ok) return null;
  return resolve.reason === "expired" ? "session_expired" : "session_not_found";
}

/** Resolve a session id, refusing to hand out expired or unknown sessions. */
export function resolveStatefulSession(id: string): SessionResolve {
  const record = registry.get(id);
  if (!record) return { ok: false, reason: "not_found" };
  if (record.session.expiresAt <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, record };
}

/** Destroy a session: drop it from the registry and delete the workspace. */
export async function destroyStatefulSession(id: string): Promise<boolean> {
  const record = registry.get(id);
  if (!record) return false;
  registry.delete(id);

  // Windows can hold workspace files open briefly after php -S is killed, so
  // a single rm() can hit EBUSY halfway through and leak a partial directory.
  // Retry the whole removal a few times so cleanup converges in practice.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await rm(record.session.workspacePath, {
        recursive: true,
        force: true,
        maxRetries: 8,
        retryDelay: 150,
      });
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  // Best-effort cleanup; the OS temp dir reclaims leftovers.
  void lastError;
  return true;
}

/** Access the cookie jar of a live session (returns a fresh empty jar otherwise). */
export function getSessionJar(id: string): CookieJar {
  return registry.get(id)?.jar ?? new Map();
}

/** Replace the cookie jar of a live session after a request applied Set-Cookie. */
export function replaceSessionJar(id: string, jar: CookieJar): void {
  const record = registry.get(id);
  if (record) record.jar = jar;
}

/**
 * Serialize work on a session: later requests wait for earlier ones so two
 * php -S boots can never overlap on the same session/workspace.
 */
export function serializedStatefulRequest<T>(
  id: string,
  task: () => Promise<T>,
): Promise<T> {
  const record = registry.get(id);
  if (!record) return Promise.reject(new Error("session_not_found"));
  const run = record.chain.then(task, task);
  record.chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Safe, client-visible metadata — never includes workspace paths. */
export function toStatefulSessionMetadata(
  session: StatefulPracticeSession,
): StatefulSessionMetadata {
  return {
    sessionId: session.id,
    programSlug: session.programSlug,
    expiresAt: session.expiresAt,
  };
}

/** Session cookie name excluded from the learner-facing cookie counter. */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/** Test/observability helpers. */
export function statefulSessionCount(): number {
  return registry.size;
}

export function listStatefulSessionWorkspaces(): string[] {
  return [...registry.values()].map((record) => record.session.workspacePath);
}

/**
 * Force-expire a session (test hook). The next resolve/sweep treats it as
 * expired and removes the workspace.
 */
export function forceExpireStatefulSession(id: string): boolean {
  const record = registry.get(id);
  if (!record) return false;
  record.session.expiresAt = 0;
  return true;
}