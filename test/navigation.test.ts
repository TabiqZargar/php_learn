import { test } from "node:test";
import assert from "node:assert/strict";
import { nextIndex, previousIndex } from "../src/lib/learning/navigation.ts";

test("previousIndex is undefined on the first item (previous control disabled)", () => {
  assert.equal(previousIndex(0, 8), undefined);
});

test("previousIndex is undefined for out-of-range index", () => {
  assert.equal(previousIndex(-1, 8), undefined);
  assert.equal(previousIndex(8, 8), undefined);
});

test("previousIndex returns the preceding index in range", () => {
  assert.equal(previousIndex(3, 8), 2);
  assert.equal(previousIndex(1, 8), 0);
});

test("nextIndex is undefined on the last item (next control disabled)", () => {
  assert.equal(nextIndex(7, 8), undefined);
});

test("nextIndex is undefined for out-of-range index", () => {
  assert.equal(nextIndex(-1, 8), undefined);
  assert.equal(nextIndex(8, 8), undefined);
});

test("nextIndex returns the following index in range", () => {
  assert.equal(nextIndex(3, 8), 4);
  assert.equal(nextIndex(0, 8), 1);
});

test("ordering follows the content array passed in (first/last boundaries)", () => {
  const items = ["a", "b", "c"];

  const first = items[0];
  const firstPrev = previousIndex(0, items.length);
  assert.equal(firstPrev, undefined);
  assert.equal(items[nextIndex(0, items.length)!], items[1]);

  const last = items[items.length - 1];
  const lastNext = nextIndex(items.length - 1, items.length);
  assert.equal(lastNext, undefined);
  assert.equal(items[previousIndex(items.length - 1, items.length)!], items[1]);

  assert.equal(first, "a");
  assert.equal(last, "c");
});