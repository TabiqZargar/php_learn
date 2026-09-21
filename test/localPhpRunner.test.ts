import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  MAX_INPUT_BYTES,
  MAX_SOURCE_BYTES,
} from "../src/lib/practice/limits.ts";
import { runLocalPhp } from "../src/lib/practice/localPhpRunner.ts";
import type { PracticeInput } from "../src/lib/practice/types.ts";

// Every execution test assumes development mode — the only mode that may
// spawn PHP. The runner reads process.env at call time, and the disabled
// test below overrides and restores it around a single call.
const appEnv = process.env as Record<string, string | undefined>;
appEnv.NODE_ENV = "development";

function makeInput(partial: Partial<PracticeInput> & { name: string }): PracticeInput {
  return {
    label: partial.name,
    type: "text",
    value: "",
    ...partial,
  };
}

function withEnv<T>(key: string, value: string, fn: () => T): T {
  const previous = appEnv[key];
  appEnv[key] = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete appEnv[key];
    } else {
      appEnv[key] = previous;
    }
  }
}

// Determine once whether the PHP CLI exists on this machine so the suite
// stays green both with and without it.
const probe = await runLocalPhp("<?php echo 'probe';", []);
const phpAvailable = probe.status === "success";

describe("localPhpRunner", () => {
  test("execution is disabled outside development mode", async () => {
    const result = await withEnv("NODE_ENV", "production", () =>
      runLocalPhp("<?php echo 'x';", []),
    );
    assert.equal(result.status, "execution_disabled");
    assert.equal(result.exitCode, null);
  });

  test("oversized source is rejected before spawning", async () => {
    const result = await runLocalPhp("<?php " + "x".repeat(MAX_SOURCE_BYTES + 1), []);
    assert.equal(result.status, "invalid_request");
  });

  test("oversized input is rejected before spawning", async () => {
    const result = await runLocalPhp("<?php echo 'x';", [
      makeInput({ name: "big", value: "y".repeat(MAX_INPUT_BYTES + 1) }),
    ]);
    assert.equal(result.status, "invalid_request");
  });

  if (phpAvailable) {
    test("successful program returns its stdout and exit code 0", async () => {
      const result = await runLocalPhp("<?php echo 'Hello from PHP';", []);
      assert.equal(result.status, "success");
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, "Hello from PHP");
      assert.equal(typeof result.executionTimeMs, "number");
    });

    test("inputs arrive as CLI arguments in order", async () => {
      const inputs: PracticeInput[] = [
        makeInput({ name: "one", value: "10" }),
        makeInput({ name: "two", value: "25" }),
        makeInput({ name: "three", value: "15" }),
      ];
      const result = await runLocalPhp(
        "<?php echo $argv[1] . ',' . $argv[2] . ',' . $argv[3];",
        inputs,
      );
      assert.equal(result.status, "success");
      assert.equal(result.stdout, "10,25,15");
    });

    test("numeric inputs cast and array inputs parse", async () => {
      const numeric = await runLocalPhp("<?php echo ((int)$argv[1]) + 1;", [
        makeInput({ name: "n", type: "number", value: "7" }),
      ]);
      assert.equal(numeric.status, "success");
      assert.equal(numeric.stdout, "8");

      const arrayResult = await runLocalPhp(
        "<?php echo implode(',', json_decode($argv[1], true));",
        [makeInput({ name: "numbers", value: "[4, 2, 8]" })],
      );
      assert.equal(arrayResult.status, "success");
      assert.equal(arrayResult.stdout, "4,2,8");
    });

    test("syntax errors are reported as syntax_error with the PHP message", async () => {
      const result = await runLocalPhp("<?php echo \"unclosed", []);
      assert.equal(result.status, "syntax_error");
      // PHP 8.x CLI prints Parse error to stdout; older versions to stderr.
      const combined = (result.stdout ?? "") + (result.stderr ?? "");
      assert.match(combined, /parse error/i);
      assert.equal(result.exitCode, 255);
    });

    test("runtime errors are reported as runtime_error", async () => {
      const result = await runLocalPhp("<?php undefinedFunctionCall();", []);
      assert.equal(result.status, "runtime_error");
      const combined = (result.stdout ?? "") + (result.stderr ?? "");
      assert.ok(combined.length > 0);
      assert.equal(result.exitCode, 255);
    });

    test(
      "an infinite loop is stopped with a timeout",
      { timeout: 10_000 },
      async () => {
        const result = await runLocalPhp("<?php for (;;) {}", []);
        assert.equal(result.status, "timeout");
        assert.equal(result.exitCode, null);
      },
    );

    test("excessive output is reported as output_limit", async () => {
      const result = await runLocalPhp(
        "<?php " +
          "ob_implicit_flush(true); " +
          "for ($i = 0; $i < 100000; $i++) { " +
          "echo '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; " +
          "}",
        [],
      );
      assert.equal(result.status, "output_limit");
    });

    test("temp files are cleaned up after a run", async () => {
      await runLocalPhp("<?php echo 'clean';", []);
      const leftovers = (await readdir(tmpdir())).filter((name) =>
        name.startsWith("php-academy-"),
      );
      assert.equal(leftovers.length, 0);
    });
  } else {
    test("runtime is reported unavailable when the PHP CLI is missing", async () => {
      assert.equal(probe.status, "runtime_unavailable");
      assert.match(
        probe.message ?? "",
        /not installed or is not available on the PATH/,
      );
    });
  }
});