import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  isSafeSqlIdentifier,
  phpStringLiteral,
  resolveMysqlEnvConfig,
} from "../src/lib/practice/mysql/config.ts";
import {
  isMysqlRuntimeAvailable,
  mysqlExtensionArgs,
  resolveMysqlRuntime,
} from "../src/lib/practice/mysql/runtime.ts";
import { sanitizeMysqlText } from "../src/lib/practice/stateful/runner.ts";
import type { StatefulPracticeSession } from "../src/lib/practice/stateful/types.ts";

describe("mysql env config parsing", () => {
  test("defaults host, port and database but requires credentials", () => {
    const config = resolveMysqlEnvConfig({} as NodeJS.ProcessEnv);
    assert.equal(config, null);
  });

  test("valid minimal config parses with defaults", () => {
    const config = resolveMysqlEnvConfig({
      MYSQL_USER: "php_academy_practice",
      MYSQL_PASSWORD: "secret",
    } as unknown as NodeJS.ProcessEnv);
    assert.ok(config);
    assert.equal(config!.host, "127.0.0.1");
    assert.equal(config!.port, 3306);
    assert.equal(config!.database, "php_academy_practice");
    assert.equal(config!.user, "php_academy_practice");
    assert.equal(config!.password, "secret");
  });

  test("explicit values win over defaults", () => {
    const config = resolveMysqlEnvConfig({
      MYSQL_HOST: "db.local",
      MYSQL_PORT: "3307",
      MYSQL_DATABASE: "academy",
      MYSQL_USER: "learner",
      MYSQL_PASSWORD: "pw",
    } as unknown as NodeJS.ProcessEnv);
    assert.ok(config);
    assert.deepEqual(
      { host: config!.host, port: config!.port, database: config!.database, user: config!.user },
      { host: "db.local", port: 3307, database: "academy", user: "learner" },
    );
  });

  test("rejects hostile hosts, bad ports and unsafe database names", () => {
    for (const env of [
      { MYSQL_HOST: "x;rm -rf /", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_HOST: "localhost'", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_PORT: "abc", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_PORT: "0", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_PORT: "70000", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_DATABASE: "bad-name", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_DATABASE: "`droppable`", MYSQL_USER: "u", MYSQL_PASSWORD: "p" },
      { MYSQL_USER: "", MYSQL_PASSWORD: "p" },
      { MYSQL_USER: "u", MYSQL_PASSWORD: "" },
    ] as unknown as NodeJS.ProcessEnv[]) {
      assert.equal(resolveMysqlEnvConfig(env), null, JSON.stringify(env));
    }
  });
});

describe("mysql sql identifier guard", () => {
  test("accepts bare word identifiers", () => {
    for (const name of ["students", "products", "a", "a_b", "A12345", "x".repeat(64)]) {
      assert.ok(isSafeSqlIdentifier(name), name);
    }
  });

  test("rejects injection names and accepts harmless prefix-shaped words", () => {
    for (const name of [
      "`students`",
      "students`",
      "a;DROP TABLE",
      "a.b",
      "-bad",
      "_bad",
      "1bad",
      "bad name",
      "x".repeat(65),
    ]) {
      assert.equal(isSafeSqlIdentifier(name), false, name);
    }
    assert.ok(
      isSafeSqlIdentifier("s3f9c2ab1d0e_students"),
      "a prefix-shaped word is still a safe logical identifier; the server re-prefixes it",
    );
  });
});

describe("php string literal escaping", () => {
  test("escapes quotes, backslashes and newlines", () => {
    assert.equal(phpStringLiteral("plain"), "'plain'");
    assert.equal(phpStringLiteral("a'b"), "'a\\'b'");
    assert.equal(phpStringLiteral("a\\b"), "'a\\\\b'");
    assert.equal(phpStringLiteral("line\nbreak"), "'line\\nbreak'");
    assert.equal(phpStringLiteral("cr\rlf"), "'cr\\rlf'");
    assert.equal(
      phpStringLiteral(String.raw`'); system('ls'); //`),
      String.raw`'\'); system(\'ls\'); //'`,
    );
    assert.equal(
      phpStringLiteral("s3cret'P@ss"),
      String.raw`'s3cret\'P@ss'`,
    );
  });
});

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

describe("mysql runtime availability", () => {
  test("unconfigured runtime resolves to an unavailable reason", async () => {
    const runtime = await withNoMysqlEnv(() => resolveMysqlRuntime());
    assert.equal(runtime.ok, false);
    assert.equal(typeof runtime.reason, "string");
    assert.ok((runtime as { reason: string }).reason.length > 10);
  });

  test("an unreachable server is unavailable, never a wrong answer", async () => {
    const status = await isMysqlRuntimeAvailable({
      host: "127.0.0.1",
      port: 1,
      database: "academy",
      user: "learner",
      password: "pw",
    });
    assert.equal(status.available, false);
    assert.ok(status.reason);
  });

  test("php bootstrap args always request the mysqli extension", async () => {
    const args = await mysqlExtensionArgs();
    assert.ok(args.includes("-d"), "flags are expressed as -d option pairs");
    assert.ok(args.includes("extension=mysqli"));
  });
});

describe("session secret redaction", () => {
  const longSession = {
    id: "s1",
    programSlug: "mysql-connect",
    workspacePath: "C:\\tmp\\ws" as const,
    createdAt: 0,
    expiresAt: 1,
    mysql: {
      host: "127.0.0.1",
      port: 3306,
      database: "php_academy_practice",
      user: "practice_user",
      password: "s3cretP@ss",
      tablePrefix: "s1234abcdef_",
    },
  } satisfies StatefulPracticeSession;

  test("long secrets become <hidden>", () => {
    const out = sanitizeMysqlText(
      "host=127.0.0.1 user=practice_user pass=s3cretP@ss prefix=s1234abcdef_",
      longSession,
    );
    assert.ok(out.includes("<hidden>"));
    assert.ok(!out.includes("s3cretP@ss"));
    assert.ok(!out.includes("practice_user"));
    assert.ok(!out.includes("s1234abcdef_"));
  });

  test("short secrets are left alone so ordinary text is not mangled", () => {
    const short = {
      id: "s2",
      programSlug: "mysql-connect",
      workspacePath: "C:\\tmp\\ws2" as const,
      createdAt: 0,
      expiresAt: 1,
      mysql: {
        host: "h",
        port: 1,
        database: "db",
        user: "u",
        password: "p",
        tablePrefix: "s1234abcdef_",
      },
    } satisfies StatefulPracticeSession;
    const out = sanitizeMysqlText("db", short);
    assert.equal(out, "db");
    const out2 = sanitizeMysqlText("user u pass p", short);
    assert.equal(out2, "user u pass p");
  });
});