import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runLocalPhp } from "../src/lib/practice/localPhpRunner.ts";
import { runStatefulRequest } from "../src/lib/practice/stateful/runner.ts";
import {
  createStatefulSession,
  destroyStatefulSession,
  getSessionJar,
  replaceSessionJar,
} from "../src/lib/practice/stateful/sessionManager.ts";
import {
  applySetCookies,
  cookieHeaderForPath,
  jarToRecord,
  type CookieJar,
} from "../src/lib/practice/stateful/cookieJar.ts";
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
  jar: CookieJar;
}

/**
 * The send helper mimics the server-side runStep exactly: it reads the
 * session cookie jar, issues one raw request and applies any Set-Cookie
 * headers back into the jar.
 */
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
  return { status: response.status, stdout: response.stdout, jar: nextJar };
}

function sessionWorkspace(session: StatefulPracticeSession): void {
  void session.workspacePath;
}

describe("statefulPhpRunner", () => {
  test("execution is disabled outside development mode", async () => {
    const previous = appEnv.NODE_ENV;
    appEnv.NODE_ENV = "production";
    try {
      const session = await createStatefulSession("sessions");
      try {
        const outcome = await runStatefulRequest({
          session,
          code: "<?php echo 'x';",
          inputs: {},
          cookieHeader: "",
        });
        assert.equal(outcome.status, "execution_disabled");
      } finally {
        await destroyStatefulSession(session.id);
      }
    } finally {
      appEnv.NODE_ENV = previous;
    }
  });

  test("oversized code is rejected before spawning", async () => {
    const session = await createStatefulSession("cookies");
    try {
      const outcome = await runStatefulRequest({
        session,
        code: "<?php " + "x".repeat(70 * 1024),
        inputs: {},
        cookieHeader: "",
      });
      assert.equal(outcome.status, "invalid_request");
    } finally {
      await destroyStatefulSession(session.id);
    }
  });

  if (phpAvailable) {
    test("POST fields reach the script through the request superglobal", async () => {
      const session = await createStatefulSession("cookies");
      try {
        const outcome = await send(
          session,
          "<?php echo $_POST['username'] ?? 'none';",
          { username: "alice" },
        );
        assert.equal(outcome.status, "success");
        assert.equal(outcome.stdout, "alice");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("sessions persist across fresh servers via the session cookie", async () => {
      const session = await createStatefulSession("sessions");
      try {
        const login = await send(
          session,
          "<?php session_start(); $_SESSION['user'] = $_POST['user']; echo 'stored';",
          { user: "bob" },
        );
        assert.equal(login.status, "success");
        assert.ok("PHPSESSID" in jarToRecord(login.jar));

        const stored = await send(
          session,
          "<?php session_start(); echo $_SESSION['user'] ?? 'none';",
          {},
        );
        assert.equal(stored.status, "success");
        assert.equal(stored.stdout, "bob");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("logout destroys the session state", async () => {
      const session = await createStatefulSession("sessions");
      try {
        await send(
          session,
          "<?php session_start(); $_SESSION['user'] = 'bob'; echo 'stored';",
          { user: "bob" },
        );
        const logout = await send(
          session,
          "<?php session_start(); $_SESSION = []; session_destroy(); echo 'bye';",
          {},
        );
        assert.equal(logout.status, "success");
        const after = await send(
          session,
          "<?php session_start(); echo $_SESSION['user'] ?? 'none';",
          {},
        );
        assert.equal(after.stdout, "none");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("cookie set / read / delete lifecycle updates the jar", async () => {
      const session = await createStatefulSession("cookies");
      try {
        const setResult = await send(
          session,
          '<?php setcookie("color", "blue", time() + 3600, "/"); echo "set";',
          {},
        );
        assert.equal(setResult.status, "success");
        assert.equal(jarToRecord(setResult.jar).color, "blue");

        const read = await send(
          session,
          '<?php echo $_COOKIE["color"] ?? "none";',
          {},
        );
        assert.equal(read.stdout, "blue");

        const deleteResult = await send(
          session,
          '<?php setcookie("color", "", time() - 3600, "/"); echo "del";',
          {},
        );
        assert.equal(deleteResult.status, "success");
        assert.ok(!("color" in jarToRecord(deleteResult.jar)));

        const gone = await send(
          session,
          '<?php echo $_COOKIE["color"] ?? "none";',
          {},
        );
        assert.equal(gone.stdout, "none");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("session workspaces are isolated from each other", async () => {
      const alice = await createStatefulSession("sessions");
      const bob = await createStatefulSession("sessions");
      try {
        await send(
          alice,
          "<?php session_start(); $_SESSION['user'] = 'alice'; echo 'ok';",
          {},
        );
        const bobView = await send(
          bob,
          "<?php session_start(); echo $_SESSION['user'] ?? 'none';",
          {},
        );
        assert.equal(bobView.stdout, "none");
        assert.equal(jarToRecord(getSessionJar(bob.id)).PHPSESSID, undefined);
      } finally {
        await destroyStatefulSession(alice.id);
        await destroyStatefulSession(bob.id);
      }
    });

    test("host workspace paths never leak into surfaced output", async () => {
      const session = await createStatefulSession("cookies");
      try {
        const outcome = await send(
          session,
          "<?php require '/does/not/exist.php';",
          {},
        );
        assert.equal(outcome.status, "runtime_error");
        assert.ok(!outcome.stdout.includes(session.workspacePath));
        assert.ok(outcome.stdout.length > 0);
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("process execution functions are disabled", async () => {
      const session = await createStatefulSession("sessions");
      try {
        const outcome = await send(session, '<?php echo @shell_exec("echo HACKED");', {});
        assert.equal(outcome.status, "runtime_error");
        assert.ok(!outcome.stdout.includes("HACKED"));
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test("open_basedir blocks reads outside the workspace", async () => {
      const fixture = await mkdtemp(join(tmpdir(), "php-academy-sec-"));
      const secretPath = join(fixture, "secret.txt");
      await writeFile(secretPath, "TOP-SECRET-CONTENT", "utf8");
      const secretForward = secretPath.replaceAll("\\", "/");
      const session = await createStatefulSession("sessions");
      try {
        const outcome = await send(
          session,
          `<?php $data = @file_get_contents("${secretForward}"); echo $data === false ? "blocked" : $data;`,
          {},
        );
        assert.equal(outcome.status, "success");
        assert.equal(outcome.stdout, "blocked");
        assert.ok(!outcome.stdout.includes("TOP-SECRET-CONTENT"));
      } finally {
        await destroyStatefulSession(session.id);
        await rm(fixture, { recursive: true, force: true });
      }
      sessionWorkspace(session);
    });

    test("remote URL reads are disabled", async () => {
      const session = await createStatefulSession("cookies");
      try {
        const outcome = await send(
          session,
          '<?php $data = @file_get_contents("http://127.0.0.1:1/x"); echo $data === false ? "no-network" : "network";',
          {},
        );
        assert.equal(outcome.status, "success");
        assert.equal(outcome.stdout, "no-network");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });

    test(
      "a hanging script is stopped and reported",
      { timeout: 10_000 },
      async () => {
        const session = await createStatefulSession("sessions");
        try {
          const outcome = await send(session, "<?php for (;;) {}", {});
          assert.ok(outcome.status === "timeout" || outcome.status === "runtime_error");
        } finally {
          await destroyStatefulSession(session.id);
        }
      },
    );

    test("no stateful workspace directories are left behind", async () => {
      const leftovers = (await readdir(tmpdir())).filter((name) =>
        name.startsWith("php-academy-stateful-"),
      );
      assert.equal(leftovers.length, 0);
    });
  } else {
    test("runtime is reported unavailable when PHP is missing", async () => {
      const session = await createStatefulSession("sessions");
      try {
        const outcome = await runStatefulRequest({
          session,
          code: "<?php echo 'x';",
          inputs: {},
          cookieHeader: "",
        });
        assert.equal(outcome.status, "runtime_unavailable");
      } finally {
        await destroyStatefulSession(session.id);
      }
    });
  }
});