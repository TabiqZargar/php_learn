import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  validateStatefulCreateBody,
  validateStatefulDestroyBody,
  validateStatefulExecuteBody,
} from "../src/lib/practice/stateful/payload.ts";
import { MAX_INPUT_BYTES, MAX_SOURCE_BYTES } from "../src/lib/practice/limits.ts";

describe("stateful payload validation", () => {
  test("create requires a non-empty programSlug", () => {
    assert.ok(validateStatefulCreateBody({ programSlug: "sessions" }).ok);
    assert.ok(!validateStatefulCreateBody({}).ok);
    assert.ok(!validateStatefulCreateBody({ programSlug: " " }).ok);
    assert.ok(!validateStatefulCreateBody("nope").ok);
    assert.ok(!validateStatefulCreateBody(null).ok);
  });

  test("destroy requires a non-empty sessionId", () => {
    assert.ok(validateStatefulDestroyBody({ sessionId: "abc" }).ok);
    assert.ok(!validateStatefulDestroyBody({}).ok);
    assert.ok(!validateStatefulDestroyBody({ sessionId: 42 }).ok);
  });

  test("execute requires session, program, code and optional inputs", () => {
    const valid = {
      sessionId: "abc",
      programSlug: "cookies",
      code: "<?php",
      inputs: { action: "set" },
    };
    assert.ok(validateStatefulExecuteBody(valid).ok);
    assert.ok(!validateStatefulExecuteBody({ ...valid, sessionId: "" }).ok);
    assert.ok(!validateStatefulExecuteBody({ ...valid, code: 12 }).ok);
    assert.ok(!validateStatefulExecuteBody({ ...valid, inputs: [1, 2] }).ok);
    assert.ok(!validateStatefulExecuteBody({ ...valid, inputs: { bad: 3 } }).ok);
  });

  test("execute caps source and input bytes", () => {
    assert.ok(
      !validateStatefulExecuteBody({
        sessionId: "abc",
        programSlug: "cookies",
        code: "<?php " + "x".repeat(MAX_SOURCE_BYTES),
      }).ok,
    );
    assert.ok(
      !validateStatefulExecuteBody({
        sessionId: "abc",
        programSlug: "cookies",
        code: "<?php",
        inputs: { big: "y".repeat(MAX_INPUT_BYTES) },
      }).ok,
    );
  });
});