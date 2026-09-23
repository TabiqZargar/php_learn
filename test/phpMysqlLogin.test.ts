import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PROGRAMS, LESSONS, getLessonBySlug, getProgramBySlug } from "../src/content/index.ts";
import type { Program } from "../src/lib/learning/types.ts";
import {
  LOGIN_SEED_PASSWORDS,
  LOGIN_SEED_USERS,
  loginUsersSeedJson,
  resolveLoginSeedToken,
  resolveLoginSeedTokens,
} from "../src/lib/practice/mysql/loginSeed.ts";
import { sanitizeMysqlText } from "../src/lib/practice/stateful/runner.ts";
import type { StatefulPracticeSession } from "../src/lib/practice/stateful/types.ts";

describe("php-mysql-login seed identity (server-only)", () => {
  test("the seed registry has exactly the documented accounts", () => {
    assert.deepEqual(
      LOGIN_SEED_USERS.map((u) => u.username),
      ["alice", "bob"],
    );
    assert.deepEqual(LOGIN_SEED_PASSWORDS, ["alice2564", "bob8753"]);
  });

  test("plaintext passwords never get serialized into the seed JSON", () => {
    const json = loginUsersSeedJson();
    assert.ok(!json.includes("alice2564"), "seed JSON must not carry plaintext");
    assert.ok(!json.includes("bob8753"), "seed JSON must not carry plaintext");
    const parsed = JSON.parse(json) as { username: string; hash: string }[];
    assert.equal(parsed.length, 2);
    for (const entry of parsed) {
      assert.ok(entry.hash.startsWith("$2y$12$"), "seed JSON must carry bcrypt hashes");
    }
  });

  test("the token resolver substitutes known markers and passes everything else through", () => {
    assert.equal(resolveLoginSeedToken("{{PASSWORD:alice}}"), "alice2564");
    assert.equal(resolveLoginSeedToken("{{PASSWORD:bob}}"), "bob8753");
    assert.equal(resolveLoginSeedToken("{{PASSWORD:nobody}}"), "{{PASSWORD:nobody}}");
    assert.equal(resolveLoginSeedToken("not-a-token"), "not-a-token");
    assert.equal(resolveLoginSeedToken(""), "");
    assert.deepEqual(
      resolveLoginSeedTokens({
        action: "login",
        username: "alice",
        password: "{{PASSWORD:alice}}",
      }),
      { action: "login", username: "alice", password: "alice2564" },
    );
  });
});

describe("php-mysql-login content contract", () => {
  test("the program is a mysql practice seeding the users table", () => {
    const program = getProgramBySlug("php-mysql-login");
    assert.ok(program, "php-mysql-login program missing");
    assert.equal(program!.practice?.execution, "mysql");
    assert.deepEqual(program!.practice?.mysql?.seedTables, ["users"]);
  });

  test("the login lesson exists after the mysql lesson", () => {
    const mysql = getLessonBySlug("mysql");
    const login = getLessonBySlug("php-mysql-login");
    assert.ok(mysql, "mysql lesson missing");
    assert.ok(login, "php-mysql-login lesson missing");
    assert.ok(mysql!.order < login!.order);
    assert.ok(LESSONS.every((l, i) => i === 0 || LESSONS[i - 1].order <= l.order));
  });

  test("the program defines the eight designed grading scenarios", () => {
    const program = getProgramBySlug("php-mysql-login")!;
    assert.equal(program.statefulTestCases!.length, 8);
    const ids = new Set(program.statefulTestCases!.map((c) => c.id));
    assert.equal(ids.size, 8);
    const names = program.statefulTestCases!.map((c) => c.name).sort();
    assert.deepEqual(names, [
      "Bob authenticates as himself, not Alice",
      "Correct credentials authenticate Alice",
      "Login survives the next request",
      "Logout after login reports LOGGED_OUT",
      "SQL injection in the username stays a failed login",
      "Status is UNAUTHORIZED after logout",
      "Unknown user is rejected",
      "Wrong password is rejected",
    ]);
  });

  test("expectedDb users rows exactly match the server-side seed hashes", () => {
    const program = getProgramBySlug("php-mysql-login")!;
    const byUser = new Map(LOGIN_SEED_USERS.map((u) => [u.username, u.passwordHash]));
    for (const c of program.statefulTestCases!) {
      for (const s of c.steps) {
        for (const entry of s.expectedDb ?? []) {
          if (entry.table !== "users" || entry.rows === null) continue;
          for (const row of entry.rows) {
            const hash = byUser.get(row.username);
            assert.ok(hash, `unexpected row for user "${row.username}"`);
            assert.equal(row.password_hash, hash, "content hash drifted from the seed");
            assert.ok(
              !LOGIN_SEED_PASSWORDS.includes(row.password!),
              "content must never hold plaintext passwords",
            );
          }
        }
      }
    }
  });

  test("no plaintext password appears anywhere in content", () => {
    const sources = (PROGRAMS as Program[])
      .map((p) =>
        [
          p.problemStatement,
          p.code,
          p.explanation,
          JSON.stringify(p.notes),
          JSON.stringify(p.practice?.inputs),
          p.practice?.starterCode,
          JSON.stringify(p.statefulTestCases),
          JSON.stringify(p.hints),
        ].join("\n"),
      )
      .join("\n");
    for (const plaintext of LOGIN_SEED_PASSWORDS) {
      assert.ok(
        !sources.includes(plaintext),
        `content leaked the seed password "${plaintext}"`,
      );
    }
  });

  test("the reference solution verifies passwords and uses a session", () => {
    const program = getProgramBySlug("php-mysql-login")!;
    assert.match(program.code, /password_verify/, "solution must verify hashes");
    assert.match(program.code, /session_start/, "solution must start a session");
    assert.match(program.code, /session_regenerate_id/, "solution must regenerate the id");
    assert.match(program.code, /session_destroy/, "solution must destroy on logout");
    assert.doesNotMatch(program.code, /SELECT\s+password\b/, "solution must not select the hash as a result column");
    assert.ok(
      !/SELECT\s+password_hash\s+FROM/.test(program.code) || /SELECT\s+id, username, password_hash/.test(program.code),
      "solution must select username, id and hash only",
    );
  });
});

describe("login seed redaction in surfaced output", () => {
  test("sanitizeMysqlText redacts every seed plaintext", () => {
    const session: StatefulPracticeSession = {
      id: "s-test",
      programSlug: "php-mysql-login",
      workspacePath: "C:\\unused",
      createdAt: 0,
      expiresAt: Date.now() + 60_000,
      mysql: {
        host: "localhost",
        port: 3306,
        database: "academy",
        user: "learner",
        password: "secret",
        tablePrefix: "s12345678_",
      },
    };
    const output = "Your password is alice2564 and bob8753 is important.";
    const sanitized = sanitizeMysqlText(output, session);
    assert.ok(!sanitized.includes("alice2564"));
    assert.ok(!sanitized.includes("bob8753"));
    assert.ok(sanitized.includes("<hidden>"));
  });
});