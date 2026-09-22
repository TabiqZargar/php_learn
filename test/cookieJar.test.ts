import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  applySetCookies,
  changedClientCookieCount,
  changedCookieNames,
  cookieHeaderForPath,
  jarToRecord,
  parseSetCookieHeader,
  type CookieJar,
} from "../src/lib/practice/stateful/cookieJar.ts";

const NOW = Date.UTC(2026, 8, 21, 12, 0, 0); // fixed reference

describe("cookieJar", () => {
  test("parseSetCookieHeader parses name, value and attributes", () => {
    const parsed = parseSetCookieHeader(
      "color=blue; expires=Mon, 22 Sep 2026 12:00:00 GMT; path=/",
      NOW,
    );
    assert.ok(parsed);
    assert.equal(parsed.name, "color");
    assert.equal(parsed.value, "blue");
    assert.equal(parsed.path, "/");
    assert.equal(parsed.expiresAt, Date.UTC(2026, 8, 22, 12, 0, 0));
  });

  test("max-age overrides the wall-clock expiry", () => {
    const parsed = parseSetCookieHeader("x=1; Max-Age=60; path=/", NOW);
    assert.ok(parsed);
    assert.equal(parsed.expiresAt, NOW + 60_000);

    const both = parseSetCookieHeader(
      "y=2; expires=Mon, 22 Sep 2026 12:00:00 GMT; Max-Age=60; path=/",
      NOW,
    );
    assert.ok(both);
    assert.equal(both.expiresAt, NOW + 60_000);
  });

  test("quoted values are unquoted", () => {
    const parsed = parseSetCookieHeader('msg="hello world"; path=/', NOW);
    assert.ok(parsed);
    assert.equal(parsed.value, "hello world");
  });

  test("malformed headers yield null", () => {
    assert.equal(parseSetCookieHeader("", NOW), null);
    assert.equal(parseSetCookieHeader("=novalue", NOW), null);
  });

  test("applySetCookies stores future cookies and drops past ones", () => {
    let jar: CookieJar = new Map();
    jar = applySetCookies(
      jar,
      ["color=blue; expires=Mon, 22 Sep 2026 12:00:00 GMT; path=/"],
      NOW,
    );
    assert.equal(jarToRecord(jar).color, "blue");

    jar = applySetCookies(
      jar,
      ["color=deleted; expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; path=/"],
      NOW,
    );
    assert.ok(!("color" in jarToRecord(jar)));
  });

  test("empty-valued cookies are removed", () => {
    let jar: CookieJar = new Map();
    jar = applySetCookies(jar, ["a=1; path=/"], NOW);
    jar = applySetCookies(jar, ["a=; path=/"], NOW);
    assert.equal(jar.size, 0);
  });

  test("cookies are keyed by name and path", () => {
    let jar: CookieJar = new Map();
    jar = applySetCookies(jar, ["a=1; path=/", "a=2; path=/app"], NOW);
    assert.equal(jar.size, 2);
    assert.equal(jarToRecord(jar).a, "2");
  });

  test("cookieHeaderForPath only includes scoped cookies", () => {
    let jar: CookieJar = new Map();
    jar = applySetCookies(jar, ["a=1; path=/", "b=2; path=/admin", "c=3"], NOW);
    const header = cookieHeaderForPath(jar, "/");
    assert.match(header, /a=1/);
    assert.doesNotMatch(header, /b=2/);
    assert.match(header, /c=3/);
  });

  test("changedCookieNames reports added, removed and changed names", () => {
    let before: CookieJar = new Map();
    let after: CookieJar = new Map();
    before = applySetCookies(before, ["a=1; path=/", "gone=1; path=/"], NOW);
    after = new Map(before);
    after = applySetCookies(after, ["b=2; path=/", "a=9; path=/"], NOW);
    after = applySetCookies(after, ["gone=; path=/"], NOW);
    assert.deepEqual(changedCookieNames(before, after).sort(), ["a", "b", "gone"]);
  });

  test("changedClientCookieCount excludes the session cookie", () => {
    let before: CookieJar = new Map();
    let after: CookieJar = new Map();
    before = applySetCookies(before, ["PHPSESSID=xyz; path=/"], NOW);
    after = new Map(before);
    after = applySetCookies(after, ["PHPSESSID=xyzz; path=/", "color=blue; path=/"], NOW);
    assert.equal(changedClientCookieCount(before, after, "PHPSESSID"), 1);
  });
});