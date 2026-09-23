import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { waitForNoStatefulWorkspaces } from "./helpers.ts";
import {
  createStatefulSession,
  destroyStatefulSession,
  forceExpireStatefulSession,
  resolveStatefulSession,
  statefulSessionCount,
  sweepExpiredSessions,
  toStatefulSessionMetadata,
} from "../src/lib/practice/stateful/sessionManager.ts";
import { STATEFUL_SESSION_TTL_MS } from "../src/lib/practice/limits.ts";

describe("statefulSessionManager", () => {
  test("metadata never leaks the workspace path", async () => {
    const session = await createStatefulSession("sessions");
    try {
      assert.ok(session.id.length > 0);
      assert.equal(session.programSlug, "sessions");
      assert.equal(session.expiresAt - session.createdAt, STATEFUL_SESSION_TTL_MS);

      const metadata = toStatefulSessionMetadata(session);
      assert.deepEqual(Object.keys(metadata).sort(), [
        "expiresAt",
        "programSlug",
        "sessionId",
      ]);
      assert.equal(metadata.sessionId, session.id);
    } finally {
      await destroyStatefulSession(session.id);
    }
  });

  test("sessions resolve only while alive", async () => {
    const session = await createStatefulSession("cookies");
    const live = resolveStatefulSession(session.id);
    assert.ok(live.ok);
    assert.equal(live.record.session.id, session.id);

    await destroyStatefulSession(session.id);
    assert.deepEqual(resolveStatefulSession(session.id), {
      ok: false,
      reason: "not_found",
    });
  });

  test("expired sessions resolve as expired and are cleaned up", async () => {
    const session = await createStatefulSession("sessions");
    assert.ok(forceExpireStatefulSession(session.id));
    assert.deepEqual(resolveStatefulSession(session.id), {
      ok: false,
      reason: "expired",
    });
    await destroyStatefulSession(session.id);
    assert.ok(!existsSync(session.workspacePath));
  });

  test("destroying a session removes its workspace", async () => {
    const session = await createStatefulSession("cookies");
    assert.ok(existsSync(session.workspacePath));
    await destroyStatefulSession(session.id);
    assert.ok(!existsSync(session.workspacePath));
  });

  test("sweepExpiredSessions removes only expired sessions", async () => {
    const keeper = await createStatefulSession("sessions");
    const doomed = await createStatefulSession("cookies");
    assert.ok(forceExpireStatefulSession(doomed.id));
    const swept = await sweepExpiredSessions();
    assert.ok(swept.includes(doomed.id));
    assert.ok(!swept.includes(keeper.id));
    assert.ok(!existsSync(doomed.workspacePath));
    await destroyStatefulSession(keeper.id);
  });

  test("session count reflects live sessions only", async () => {
    const a = await createStatefulSession("sessions");
    const b = await createStatefulSession("cookies");
    assert.ok(statefulSessionCount() >= 2);
    await destroyStatefulSession(a.id);
    await destroyStatefulSession(b.id);
  });

  test("no workspace directories are left behind", async () => {
    await waitForNoStatefulWorkspaces();
  });
});