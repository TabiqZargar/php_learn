import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MAX_SOURCE_BYTES } from "../src/lib/practice/limits.ts";
import { validateCheckPayload } from "../src/lib/practice/checkPayload.ts";

describe("validateCheckPayload", () => {
  test("accepts a valid payload", () => {
    const result = validateCheckPayload({ programSlug: "factorial", code: "<?php" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payload.programSlug, "factorial");
      assert.equal(result.payload.code, "<?php");
    }
  });

  test("rejects non-object bodies", () => {
    for (const body of [null, undefined, "factorial", 42, ["factorial"]]) {
      const result = validateCheckPayload(body);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.status, 400);
    }
  });

  test("rejects a missing or empty programSlug", () => {
    const cases: unknown[] = [{ code: "<?php" }, { programSlug: "", code: "<?php" }, { programSlug: "   ", code: "<?php" }];
    for (const body of cases) {
      const result = validateCheckPayload(body);
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.error, /programSlug/);
    }
  });

  test("rejects a missing or empty code", () => {
    const cases: unknown[] = [
      { programSlug: "factorial" },
      { programSlug: "factorial", code: "" },
      { programSlug: "factorial", code: 42 },
    ];
    for (const body of cases) {
      const result = validateCheckPayload(body);
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.error, /code/);
    }
  });

  test("rejects code over the source size limit", () => {
    const result = validateCheckPayload({
      programSlug: "factorial",
      code: "x".repeat(MAX_SOURCE_BYTES + 1),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /KB limit/);
  });

  test("accepts code exactly at the size limit", () => {
    const result = validateCheckPayload({
      programSlug: "factorial",
      code: "x".repeat(MAX_SOURCE_BYTES),
    });
    assert.equal(result.ok, true);
  });
});