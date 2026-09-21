import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  matchesOutput,
  normalizeOutput,
} from "../src/lib/practice/outputMatcher.ts";

describe("outputMatcher: normalizeOutput", () => {
  test("a final newline is dropped", () => {
    assert.equal(normalizeOutput("Hello\n"), "Hello");
  });

  test("repeated trailing newlines collapse", () => {
    assert.equal(normalizeOutput("a\nb\n\n\n"), "a\nb");
  });

  test("CRLF and LF produce identical results", () => {
    assert.equal(
      normalizeOutput("a\r\nb\r\nc"),
      normalizeOutput("a\nb\nc"),
    );
  });

  test("only trailing whitespace per line is removed, leading is kept", () => {
    assert.equal(normalizeOutput("a  \n b \n"), "a\n b");
  });

  test("whitespace-only input normalizes to an empty string", () => {
    assert.equal(normalizeOutput("   \n\n"), "");
  });
});

describe("outputMatcher: matchesOutput", () => {
  test("identical output passes", () => {
    assert.equal(matchesOutput("Largest number: 3", "Largest number: 3"), true);
  });

  test("a final-newline difference passes", () => {
    assert.equal(matchesOutput("Hello\n", "Hello"), true);
  });

  test("CRLF vs LF passes", () => {
    assert.equal(matchesOutput("a\r\nb", "a\nb"), true);
  });

  test("trailing whitespace difference passes", () => {
    assert.equal(matchesOutput("a  \n", "a"), true);
  });

  test("different values fail", () => {
    assert.equal(matchesOutput("abc", "abd"), false);
  });

  test("case differences fail", () => {
    assert.equal(matchesOutput("hello", "Hello"), false);
  });

  test("missing content fails", () => {
    assert.equal(matchesOutput("a\nb", "a"), false);
  });

  test("extra content fails", () => {
    assert.equal(matchesOutput("a", "a\nb"), false);
  });

  test("leading whitespace differences fail", () => {
    assert.equal(matchesOutput(" b", "b"), false);
  });
});