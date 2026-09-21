import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_HINT_STATE,
  hintReducer,
} from "../src/lib/practice/hintState.ts";

describe("hintState: reveal", () => {
  test("initial state reveals zero hints", () => {
    assert.equal(INITIAL_HINT_STATE.revealedCount, 0);
  });

  test("one reveal action reveals exactly ONE hint", () => {
    const state = hintReducer(INITIAL_HINT_STATE, { type: "reveal", totalHints: 3 });
    assert.equal(state.revealedCount, 1);
  });

  test("revealing twice reveals two hints and keeps the first visible", () => {
    const once = hintReducer(INITIAL_HINT_STATE, { type: "reveal", totalHints: 3 });
    const twice = hintReducer(once, { type: "reveal", totalHints: 3 });
    assert.equal(twice.revealedCount, 2);
  });

  test("previously revealed hints stay revealed (state only grows)", () => {
    let state = INITIAL_HINT_STATE;
    let previous = state.revealedCount;
    for (let i = 0; i < 3; i++) {
      state = hintReducer(state, { type: "reveal", totalHints: 3 });
      assert.equal(state.revealedCount, previous + 1);
      previous = state.revealedCount;
    }
  });

  test("never reveals past the total hint count", () => {
    let state = hintReducer(INITIAL_HINT_STATE, { type: "reveal", totalHints: 3 });
    state = hintReducer(state, { type: "reveal", totalHints: 3 });
    state = hintReducer(state, { type: "reveal", totalHints: 3 });
    assert.equal(state.revealedCount, 3);
    const again = hintReducer(state, { type: "reveal", totalHints: 3 });
    assert.equal(again, state);
    assert.equal(again.revealedCount, 3);
  });

  test("a program with no hints never reveals anything", () => {
    const state = hintReducer(INITIAL_HINT_STATE, { type: "reveal", totalHints: 0 });
    assert.equal(state, INITIAL_HINT_STATE);
    assert.equal(state.revealedCount, 0);
  });
});

describe("hintState: reset", () => {
  test("reset returns to zero revealed hints from any depth", () => {
    let state = INITIAL_HINT_STATE;
    state = hintReducer(state, { type: "reveal", totalHints: 3 });
    state = hintReducer(state, { type: "reveal", totalHints: 3 });
    state = hintReducer(state, { type: "reveal", totalHints: 3 });
    state = hintReducer(state, { type: "reset" });
    assert.equal(state.revealedCount, 0);
  });

  test("reset on a fresh state is a no-op", () => {
    const state = hintReducer(INITIAL_HINT_STATE, { type: "reset" });
    assert.equal(state.revealedCount, 0);
  });
});