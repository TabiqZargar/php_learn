import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS, PROGRAMS, getLessonBySlug } from "../src/content/index.ts";

const SESSION_PROGRAMS = PROGRAMS.filter(
  (p) => p.practice?.execution === "stateful",
);
const FILESYSTEM_PROGRAMS = PROGRAMS.filter(
  (p) => p.practice?.execution === "filesystem",
);
const MYSQL_PROGRAMS = PROGRAMS.filter(
  (p) => p.practice?.execution === "mysql",
);
const STATEFUL_PROGRAMS = [
  ...SESSION_PROGRAMS,
  ...FILESYSTEM_PROGRAMS,
  ...MYSQL_PROGRAMS,
];
const PURE_PROGRAMS = PROGRAMS.filter((p) => p.practice && p.practice.execution === "pure");

describe("stateful program content", () => {
  test("every practice program declares an explicit execution capability", () => {
    const practicePrograms = PROGRAMS.filter((p) => p.practice);
    for (const p of practicePrograms) {
      assert.ok(
        p.practice!.execution === "pure" ||
          p.practice!.execution === "stateful" ||
          p.practice!.execution === "filesystem" ||
          p.practice!.execution === "mysql",
        `${p.slug} must declare execution`,
      );
    }
  });

  test("exactly the sessions and cookies programs are stateful", () => {
    assert.deepEqual(
      SESSION_PROGRAMS.map((p) => p.slug).sort(),
      ["cookies", "sessions"],
    );
  });

  test("exactly the three filesystem programs are declared", () => {
    assert.deepEqual(
      FILESYSTEM_PROGRAMS.map((p) => p.slug).sort(),
      ["file-append", "file-create", "file-delete"],
    );
  });

  test("exactly the six mysql programs are declared", () => {
    assert.deepEqual(
      MYSQL_PROGRAMS.map((p) => p.slug).sort(),
      [
        "mysql-connect",
        "mysql-create-table",
        "mysql-delete",
        "mysql-insert-read",
        "mysql-update",
        "php-mysql-login",
      ],
    );
  });

  test("stateful, filesystem and mysql programs do not also carry pure testCases", () => {
    for (const p of STATEFUL_PROGRAMS) {
      assert.ok(!p.testCases, `${p.slug} must not declare pure testCases`);
      assert.ok(
        Array.isArray(p.statefulTestCases) && p.statefulTestCases.length > 0,
        `${p.slug} must declare statefulTestCases`,
      );
    }
  });

  test("pure programs do not carry statefulTestCases", () => {
    for (const p of PURE_PROGRAMS) {
      assert.ok(!p.statefulTestCases, `${p.slug} must not declare statefulTestCases`);
    }
  });

  test("stateful test cases have sequential steps and single-fresh-session semantics", () => {
    const ids = new Set<string>();
    for (const p of STATEFUL_PROGRAMS) {
      for (const c of p.statefulTestCases!) {
        assert.ok(c.id && !ids.has(c.id), `duplicate case id ${c.id}`);
        ids.add(c.id);
        assert.ok(c.name.trim().length > 0);
        assert.ok(c.steps.length >= 1, `${p.slug}/${c.id} needs steps`);
        for (const s of c.steps) {
          assert.ok(
            typeof s.inputs === "object" && s.inputs !== null && !Array.isArray(s.inputs),
            "step inputs must be a plain string record",
          );
          assert.ok(s.expectedOutput.trim().length > 0);
          for (const v of Object.values(s.inputs)) {
            assert.equal(typeof v, "string");
          }
        }
      }
    }
    assert.ok(ids.size >= 48, "expected the 48 designed grading scenarios");
  });

  test("filesystem test cases assert file state with safe bare filenames", () => {
    for (const p of FILESYSTEM_PROGRAMS) {
      assert.ok(
        p.statefulTestCases!.some((c) => c.steps.some((s) => s.expectedFiles)),
        `${p.slug} must assert file contents somewhere`,
      );
      for (const c of p.statefulTestCases!) {
        for (const s of c.steps) {
          for (const name of Object.keys(s.expectedFiles ?? {})) {
            assert.match(
              name,
              /^[A-Za-z0-9._-]{1,80}$/,
              `${p.slug}/${c.id} references an unsafe file name "${name}"`,
            );
            assert.ok(!name.startsWith("."), `reserved/leading-dot name "${name}"`);
            assert.ok(
              !["program.php", "router.php", "__token.txt", "sess"].includes(name),
              `${p.slug}/${c.id} references a reserved workspace name "${name}"`,
            );
          }
        }
      }
    }
    assert.ok(
      FILESYSTEM_PROGRAMS.reduce((n, p) => n + p.statefulTestCases!.length, 0) >= 12,
      "expected the 12 designed filesystem grading scenarios",
    );
  });

  test("stateful starter code is a scaffold, not the answer", () => {
    for (const p of STATEFUL_PROGRAMS) {
      const starter = p.practice!.starterCode;
      assert.match(starter, /Your logic here/, `${p.slug} starter must be a scaffold`);
      assert.notEqual(starter, p.code, `${p.slug} starter must differ from the solution`);
    }
  });

  test("stateful programs follow the same hint contract as pure programs", () => {
    for (const p of STATEFUL_PROGRAMS) {
      assert.equal(p.hints?.length, 3, `${p.slug} must have exactly 3 hints`);
      const ids = new Set(p.hints!.map((h) => h.id));
      assert.equal(ids.size, 3, `${p.slug} hint ids must be unique`);
      for (const hint of p.hints!) {
        assert.ok(hint.title.trim().length > 0);
        assert.ok(hint.content.trim().length > 0);
        assert.ok(!hint.content.includes("<?php"), `${p.slug} hint leaks code`);
        assert.ok(!hint.content.includes("$"), `${p.slug} hint leaks code`);
        assert.ok(!hint.content.includes("{") && !hint.content.includes("}"), `${p.slug} hint leaks code`);
      }
    }
  });

  test("filesystem programs follow the machine-independent path contract", () => {
    for (const p of FILESYSTEM_PROGRAMS) {
      assert.match(p.code, /__DIR__/, `${p.slug} solution must anchor to __DIR__`);
      assert.ok(
        !/file_put_contents|file_get_contents/.test(p.code),
        `${p.slug} should teach the fopen/fwrite/fread/fclose trio`,
      );
    }
  });

  test("related lessons resolve to the new curriculum", () => {
    const slugs = new Set(LESSONS.map((l) => l.slug));
    for (const p of STATEFUL_PROGRAMS) {
      for (const ref of p.lessonReferences ?? []) {
        assert.ok(slugs.has(ref.lessonSlug), `${p.slug} references missing lesson ${ref.lessonSlug}`);
      }
    }
  });

  test("the sessions lesson exists and precedes the cookies lesson", () => {
    const sessions = getLessonBySlug("sessions");
    const cookies = getLessonBySlug("cookies");
    assert.ok(sessions, "sessions lesson missing from LESSONS");
    assert.ok(cookies, "cookies lesson missing from LESSONS");
    assert.ok(sessions!.order < cookies!.order);
    assert.ok(LESSONS.every((l, i) => i === 0 || LESSONS[i - 1].order <= l.order));
  });

  test("the filesystem lesson follows the cookies lesson", () => {
    const cookies = getLessonBySlug("cookies");
    const filesystem = getLessonBySlug("filesystem");
    assert.ok(filesystem, "filesystem lesson missing from LESSONS");
    assert.ok(cookies, "cookies lesson missing from LESSONS");
    assert.ok(cookies!.order < filesystem!.order);
  });

  test("filesystem programs appear after cookies and before mysql material", () => {
    const slugs = PROGRAMS.map((p) => p.slug);
    const cookies = slugs.indexOf("cookies");
    const firstMysql = slugs.findIndex((s) => s.startsWith("mysql-"));
    for (const slug of ["file-create", "file-append", "file-delete"]) {
      const at = slugs.indexOf(slug);
      assert.ok(at > cookies, `${slug} must come after cookies`);
      assert.ok(at < firstMysql, `${slug} must come before mysql material`);
    }
  });

  test("the mysql lesson follows the filesystem lesson", () => {
    const filesystem = getLessonBySlug("filesystem");
    const mysql = getLessonBySlug("mysql");
    assert.ok(mysql, "mysql lesson missing from LESSONS");
    assert.ok(filesystem, "filesystem lesson missing from LESSONS");
    assert.ok(filesystem!.order < mysql!.order);
  });

  test("mysql programs seed only the expected table sets", () => {
    for (const p of MYSQL_PROGRAMS) {
      assert.ok(
        p.practice!.mysql === undefined || Array.isArray(p.practice!.mysql?.seedTables),
        `${p.slug} mysql.seedTables must be declared structurally`,
      );
    }
    for (const slug of ["mysql-update", "mysql-delete"]) {
      const p = PROGRAMS.find((program) => program.slug === slug)!;
      assert.deepEqual(p.practice!.mysql!.seedTables, ["students"]);
    }
    for (const slug of ["php-mysql-login"]) {
      const p = PROGRAMS.find((program) => program.slug === slug)!;
      assert.deepEqual(p.practice!.mysql!.seedTables, ["users"]);
    }
    for (const slug of ["mysql-connect", "mysql-create-table", "mysql-insert-read"]) {
      const p = PROGRAMS.find((program) => program.slug === slug)!;
      assert.equal(p.practice!.mysql?.seedTables, undefined);
    }
  });

  test("every mysql program declares its grading scenarios", () => {
    for (const p of MYSQL_PROGRAMS) {
      assert.equal(p.statefulTestCases!.length, p.slug === "php-mysql-login" ? 8 : 4, `${p.slug} must define its designed scenarios`);
    }
    assert.ok(
      MYSQL_PROGRAMS.reduce((n, p) => n + p.statefulTestCases!.length, 0) >= 28,
      "expected the 28 designed mysql grading scenarios",
    );
  });

  test("mysql test cases assert database state with safe logical table names", () => {
    const KNOWN_TABLES = new Set(["students", "products", "users"]);
    for (const p of MYSQL_PROGRAMS) {
      assert.ok(
        p.statefulTestCases!.some((c) => c.steps.some((s) => s.expectedDb)),
        `${p.slug} must assert database state somewhere`,
      );
      for (const c of p.statefulTestCases!) {
        for (const s of c.steps) {
          for (const entry of s.expectedDb ?? []) {
            assert.ok(
              /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(entry.table),
              `${p.slug}/${c.id} references unsafe logical table "${entry.table}"`,
            );
            assert.ok(
              KNOWN_TABLES.has(entry.table),
              `${p.slug}/${c.id} references unknown logical table "${entry.table}"`,
            );
            if (entry.rows !== null) {
              for (const row of entry.rows) {
                for (const value of Object.values(row)) {
                  assert.equal(typeof value, "string");
                }
              }
            }
          }
        }
      }
    }
  });

  test("mysql programs load the config file and never hard-code credentials", () => {
    for (const p of MYSQL_PROGRAMS) {
      const sources = p.code + "\n" + p.practice!.starterCode;
      assert.match(
        p.practice!.starterCode,
        /academy_db_config\.php/,
        `${p.slug} starter must reference the injected config file`,
      );
      assert.match(
        p.code,
        /academy_db_config\.php/,
        `${p.slug} solution must load the injected config file`,
      );
      assert.match(
        p.code,
        /mysqli_connect/,
        `${p.slug} solution must use mysqli_connect`,
      );
      assert.ok(
        !/\$user\s*=\s*["']|db_password\s*=|\$dbName\s*=\s*["']/.test(sources),
        `${p.slug} must not hard-code credentials or placeholders`,
      );
    }
  });

  test("mysql program hints never leak solution details", () => {
    for (const p of MYSQL_PROGRAMS) {
      assert.equal(p.hints?.length, 3, `${p.slug} must have exactly 3 hints`);
      const ids = new Set(p.hints!.map((h) => h.id));
      assert.equal(ids.size, 3, `${p.slug} hint ids must be unique`);
      for (const hint of p.hints!) {
        assert.ok(!hint.content.includes("<?php"), `${p.slug} hint leaks code`);
        assert.ok(!hint.content.includes("$"), `${p.slug} hint leaks code`);
        assert.ok(
          !hint.content.includes("{") && !hint.content.includes("}"),
          `${p.slug} hint leaks code`,
        );
      }
    }
  });
});