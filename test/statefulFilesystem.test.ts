import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { waitForNoStatefulWorkspaces } from "./helpers.ts";
import {
  createStatefulSession,
  destroyStatefulSession,
  getSessionJar,
  replaceSessionJar,
} from "../src/lib/practice/stateful/sessionManager.ts";
import { runStatefulRequest } from "../src/lib/practice/stateful/runner.ts";
import {
  applySetCookies,
  cookieHeaderForPath,
} from "../src/lib/practice/stateful/cookieJar.ts";
import { readWorkspaceFiles } from "../src/lib/practice/stateful/workspace.ts";
import { runLocalPhp } from "../src/lib/practice/localPhpRunner.ts";
import type {
  StatefulPhpResponse,
  StatefulPracticeSession,
} from "../src/lib/practice/stateful/types.ts";

// Execution tests assume development mode — the only mode allowed to spawn PHP.
const appEnv = process.env as Record<string, string | undefined>;
appEnv.NODE_ENV = "development";

const probe = await runLocalPhp("<?php echo 'probe';", []);
const phpAvailable = probe.status === "success";

interface SendOutcome {
  status: StatefulPhpResponse["status"];
  stdout: string;
}

/** Mimics the server-side runStep: applies Set-Cookie back into the jar. */
async function send(
  session: StatefulPracticeSession,
  code: string,
  inputs: Record<string, string>,
): Promise<SendOutcome> {
  const jar = getSessionJar(session.id);
  const response = await runStatefulRequest({
    session,
    code,
    inputs,
    cookieHeader: cookieHeaderForPath(jar, "/"),
  });
  const nextJar = applySetCookies(jar, response.setCookieHeaders, Date.now());
  replaceSessionJar(session.id, nextJar);
  return { status: response.status, stdout: response.stdout };
}

const WRITE_CODE = `<?php
$f = __DIR__ . "/academy.txt";
$h = fopen($f, "w");
fwrite($h, $_POST["content"] ?? "none");
fclose($h);
echo "written";`;

const READ_CODE = `<?php
$f = __DIR__ . "/academy.txt";
$h = fopen($f, "r");
echo fread($h, filesize($f));
fclose($h);`;

/** Read that tolerates a missing file (no PHP warning in the output). */
const SAFE_READ_CODE = `<?php
$f = __DIR__ . "/academy.txt";
echo file_exists($f) ? file_get_contents($f) : "gone";`;

describe("statefulFilesystem", () => {
  test("readWorkspaceFiles snapshots exact contents, absence and reserved names", async () => {
    const dir = await mkdtemp(join(tmpdir(), "php-academy-ws-test-"));
    try {
      await writeFile(join(dir, "academy.txt"), "hello world", "utf8");
      await writeFile(join(dir, "big.bin"), "x".repeat(70 * 1024), "utf8");

      const snapshot = await readWorkspaceFiles(dir, [
        "academy.txt",
        "missing.txt",
        "big.bin",
        "../escape.txt",
        "program.php",
        "__token.txt",
      ]);
      assert.equal(snapshot["academy.txt"], "hello world");
      assert.equal(snapshot["missing.txt"], null);
      assert.equal(snapshot["big.bin"], null);
      assert.equal(snapshot["../escape.txt"], null);
      assert.equal(snapshot["program.php"], null);
      assert.equal(snapshot["__token.txt"], null);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  if (phpAvailable) {
    test("files written by code persist across requests in a session", async () => {
      const session = await createStatefulSession("file-create");
      try {
        const write = await send(session, WRITE_CODE, { content: "persisted" });
        assert.equal(write.status, "success");
        assert.equal(write.stdout, "written");

        const read = await send(session, READ_CODE, {});
        assert.equal(read.status, "success");
        assert.equal(read.stdout, "persisted");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("append mode accumulates previous contents", async () => {
      const session = await createStatefulSession("file-append");
      try {
        const append = (content: string) =>
          send(
            session,
            `<?php
$f = __DIR__ . "/academy.txt";
$h = fopen($f, "a");
fwrite($h, $_POST["content"]);
fclose($h);
echo "appended";`,
            { content },
          );
        assert.equal((await append("a")).stdout, "appended");
        assert.equal((await append("b")).stdout, "appended");
        const read = await send(session, READ_CODE, {});
        assert.equal(read.stdout, "ab");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("unlink removes the file for later requests", async () => {
      const session = await createStatefulSession("file-delete");
      try {
        assert.equal((await send(session, WRITE_CODE, { content: "temp" })).stdout, "written");
        const del = await send(
          session,
          `<?php
$f = __DIR__ . "/academy.txt";
if (file_exists($f)) unlink($f);
echo file_exists($f) ? "still-there" : "gone";`,
          {},
        );
        assert.equal(del.stdout, "gone");
        const again = await send(session, SAFE_READ_CODE, {});
        assert.equal(again.stdout, "gone");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("two sessions get separate filesystem workspaces", async () => {
      const alice = await createStatefulSession("file-create");
      const bob = await createStatefulSession("file-create");
      try {
        assert.equal((await send(alice, WRITE_CODE, { content: "alice-data" })).stdout, "written");
        const bobRead = await send(bob, SAFE_READ_CODE, {});
        assert.equal(bobRead.stdout, "gone");
      } finally {
        await destroyStatefulSession(alice.id);
        await destroyStatefulSession(bob.id);
      }
    });

    test("open_basedir blocks absolute and traversal reads outside the workspace", async () => {
      const fixture = await mkdtemp(join(tmpdir(), "php-academy-sec-"));
      const secretPath = join(fixture, "secret.txt");
      await writeFile(secretPath, "TOP-SECRET-CONTENT", "utf8");
      const secretForward = secretPath.replaceAll("\\", "/");
      const session = await createStatefulSession("file-create");
      try {
        const absolute = await send(
          session,
          `<?php $d = @file_get_contents("${secretForward}"); echo $d === false ? "blocked" : "LEAK";`,
          {},
        );
        assert.equal(absolute.status, "success");
        assert.equal(absolute.stdout, "blocked");

        const traversal = await send(
          session,
          '<?php $d = @file_get_contents(__DIR__ . "/../secret.txt"); echo $d === false ? "blocked" : "LEAK";',
          {},
        );
        assert.equal(traversal.status, "success");
        assert.equal(traversal.stdout, "blocked");
      } finally {
        await destroyStatefulSession(session.id);
        await rm(fixture, { recursive: true, force: true });
      }
    });

    test("symlinked reads cannot escape the workspace", async () => {
      const fixture = await mkdtemp(join(tmpdir(), "php-academy-sec-"));
      const secretPath = join(fixture, "secret.txt");
      await writeFile(secretPath, "TOP-SECRET-CONTENT", "utf8");
      const secretForward = secretPath.replaceAll("\\", "/");
      const session = await createStatefulSession("file-create");
      try {
        const outcome = await send(
          session,
          `<?php
@unlink(__DIR__ . "/link.txt");
@symlink("${secretForward}", __DIR__ . "/link.txt");
$d = @file_get_contents(__DIR__ . "/link.txt");
echo $d === false ? "blocked" : "LEAK";`,
          {},
        );
        assert.equal(outcome.status, "success");
        assert.equal(outcome.stdout, "blocked");
      } finally {
        await destroyStatefulSession(session.id);
        await rm(fixture, { recursive: true, force: true });
      }
    });

    test("no external file is modified by workspace code", async () => {
      const guardian = await mkdtemp(join(tmpdir(), "php-academy-guard-"));
      const guardianPath = join(guardian, "guardian.txt");
      await writeFile(guardianPath, "UNTOUCHED", "utf8");
      const session = await createStatefulSession("file-create");
      try {
        const outcome = await send(
          session,
          '<?php @file_put_contents(__DIR__ . "/../guardian.txt", "MODIFIED"); echo "done";',
          {},
        );
        assert.equal(outcome.status, "success");
        assert.equal(outcome.stdout, "done");
      } finally {
        await destroyStatefulSession(session.id);
      }
      assert.equal(await readFile(guardianPath, "utf8"), "UNTOUCHED");
      await rm(guardian, { recursive: true, force: true });
    });

    test("host workspace paths never leak into surfaced output", async () => {
      const session = await createStatefulSession("file-delete");
      try {
        const outcome = await send(
          session,
          '<?php $h = fopen(__DIR__ . "/no-such-dir/academy.txt", "w");',
          {},
        );
        // The unhandled fopen warning is surfaced (display_errors), so the
        // workspace path must be scrubbed from the output.
        assert.ok(!outcome.stdout.includes(session.workspacePath));
        assert.ok(outcome.stdout.length > 0);
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("destroying a session removes learner-created files with the workspace", async () => {
      const session = await createStatefulSession("file-create");
      await send(session, WRITE_CODE, { content: "to-be-cleaned" });
      const created = join(session.workspacePath, "academy.txt");
      assert.ok(existsSync(created));
      await destroyStatefulSession(session.id);
      assert.ok(!existsSync(session.workspacePath));
      assert.ok(!existsSync(created));
    });

    test("no stateful workspace directories are left behind (filesystem runs)", async () => {
      await waitForNoStatefulWorkspaces();
    });
  }
});