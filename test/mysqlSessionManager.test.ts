import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAcademyDbConfigSource,
  createStatefulSession,
  toStatefulSessionMetadata,
} from "../src/lib/practice/stateful/sessionManager.ts";
import { MysqlRuntimeUnavailableError } from "../src/lib/practice/mysql/runtime.ts";
import type { StatefulPracticeSession } from "../src/lib/practice/stateful/types.ts";
import { waitForNoStatefulWorkspaces } from "./helpers.ts";

const MYSQL_ENV_KEYS = [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
];

function withNoMysqlEnv<T>(fn: () => Promise<T>): Promise<T> {
  const saved = new Map<string, string | undefined>();
  for (const key of MYSQL_ENV_KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
  return fn().finally(() => {
    for (const key of MYSQL_ENV_KEYS) {
      if (saved.get(key) === undefined) delete process.env[key];
      else process.env[key] = saved.get(key);
    }
  });
}

describe("mysql session manager", () => {
  test("a mysql session refuses to create when no MySQL runtime is configured", async () => {
    const error = await withNoMysqlEnv(() =>
      createStatefulSession("mysql-connect", {
        capability: "mysql",
      }).then(
        () => new Error("expected MysqlRuntimeUnavailableError, got a session"),
        (e: unknown) => e,
      ),
    );
    assert.ok(error instanceof MysqlRuntimeUnavailableError, String(error));
    assert.match(String((error as Error).message), /mysql/i);
  });

  test("an uncreatable mysql session never leaks a workspace", async () => {
    await withNoMysqlEnv(async () => {
      await assert.rejects(
        createStatefulSession("mysql-connect", { capability: "mysql" }),
        MysqlRuntimeUnavailableError,
      );
      await waitForNoStatefulWorkspaces();
    });
  });

  test("session metadata never serializes the mysql config", () => {
    const session = {
      id: "s-123",
      programSlug: "mysql-connect",
      workspacePath: "C:\\tmp\\ws",
      createdAt: 10,
      expiresAt: 20,
      mysql: {
        host: "127.0.0.1",
        port: 3306,
        database: "php_academy_practice",
        user: "root",
        password: "supersecret",
        tablePrefix: "s1234abcdef_",
      },
    } satisfies StatefulPracticeSession;
    const meta = toStatefulSessionMetadata(session);
    assert.deepEqual(Object.keys(meta).sort(), ["expiresAt", "programSlug", "sessionId"]);
    assert.equal(meta.sessionId, "s-123");
    assert.equal(meta.programSlug, "mysql-connect");
    assert.equal(meta.expiresAt, 20);
  });

  test("the injected config source carries every required key and escaped values", () => {
    const source = buildAcademyDbConfigSource({
      host: "127.0.0.1",
      port: 3306,
      database: "php_academy_practice",
      user: "practice_user",
      password: "s3cret'P@ss",
      tablePrefix: "s1a2b3c4d5e",
    });
    assert.ok(source.startsWith("<?php"));
    for (const key of [
      '"host"',
      '"port"',
      '"database"',
      '"user"',
      '"password"',
      '"table_prefix"',
    ]) {
      assert.ok(source.includes(key), `missing config key ${key}`);
    }
    assert.ok(source.includes("3306"), "port must be a literal integer");
    assert.match(source, /"table_prefix"\s*=>\s*'s1a2b3c4d5e'/);
    assert.ok(
      source.includes("'s3cret\\'P@ss'"),
      "single quotes in the password must be escaped",
    );
  });

  test("the config source never contains raw keys for host-only connectivity details", () => {
    const source = buildAcademyDbConfigSource({
      host: "127.0.0.1",
      port: 3306,
      database: "db",
      user: "u",
      password: "------",
      tablePrefix: "s1",
    });
    assert.ok(!source.includes("<?php\n\n\n"), "no blank header block");
    assert.ok(!/[\uFEFF]/.test(source), "no BOM");
  });
});