import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localStorageProgressRepository,
  normalizeProgressState,
} from "../src/lib/progress/localStorageRepository.ts";
import { createEmptyProgressState } from "../src/lib/progress/repository.ts";
import { PROGRESS_STORAGE_KEY, PROGRESS_VERSION } from "../src/lib/progress/types.ts";
import type { ProgressState } from "../src/lib/progress/types.ts";

function fakeStorage(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    dump: () => store,
  };
}

const sampleState: ProgressState = {
  version: PROGRESS_VERSION,
  lessons: {
    "first-php": { completed: true, completedAt: "2026-01-01T00:00:00.000Z" },
  },
  programs: {
    "hello-basics": {
      completed: true,
      completedAt: "2026-01-02T00:00:00.000Z",
      bestPassed: 3,
      bestTotal: 3,
      lastStatus: "passed",
      lastPassed: 3,
      lastTotal: 3,
      lastCheckedAt: "2026-01-02T00:00:00.000Z",
      maxHintsRevealed: 2,
    },
  },
};

test("load returns a clean empty state when nothing is stored", () => {
  const storage = fakeStorage();
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, storage);
  assert.deepEqual(repo.load(), createEmptyProgressState());
});

test("save then load round-trips the full state", () => {
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, fakeStorage());
  repo.save(sampleState);
  assert.deepEqual(repo.load(), sampleState);
});

test("malformed JSON falls back to the empty state", () => {
  const repo = localStorageProgressRepository(
    PROGRESS_STORAGE_KEY,
    fakeStorage({ [PROGRESS_STORAGE_KEY]: "{not json!" }),
  );
  assert.deepEqual(repo.load(), createEmptyProgressState());
});

test("unsupported version falls back to the empty state", () => {
  const repo = localStorageProgressRepository(
    PROGRESS_STORAGE_KEY,
    fakeStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify({ ...sampleState, version: 2 }) }),
  );
  assert.deepEqual(repo.load(), createEmptyProgressState());
});

test("storage read errors fall back to the empty state", () => {
  const storage = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => undefined,
    removeItem: () => undefined,
  };
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, storage);
  assert.deepEqual(repo.load(), createEmptyProgressState());
});

test("storage write errors are swallowed (best-effort persistence)", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: () => undefined,
  };
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, storage);
  assert.doesNotThrow(() => repo.save(sampleState));
  assert.deepEqual(repo.load(), createEmptyProgressState());
});

test("clear removes the persisted value", () => {
  const storage = fakeStorage();
  const repo = localStorageProgressRepository(PROGRESS_STORAGE_KEY, storage);
  repo.save(sampleState);
  repo.clear();
  assert.equal(storage.getItem(PROGRESS_STORAGE_KEY), null);
});

test("load works without a storage argument (SSR safe)", () => {
  const repo = localStorageProgressRepository();
  assert.deepEqual(repo.load(), createEmptyProgressState());
  assert.doesNotThrow(() => repo.save(sampleState));
  assert.doesNotThrow(() => repo.clear());
});

test("normalizeProgressState rejects non-object payloads", () => {
  assert.equal(normalizeProgressState('{"version":1}'), null);
  for (const bad of [null, undefined, 42, [], "text"]) {
    assert.equal(normalizeProgressState(bad), null);
  }
});

test("normalizeProgressState rejects missing or wrong version", () => {
  assert.equal(normalizeProgressState({ lessons: {}, programs: {} }), null);
  assert.equal(
    normalizeProgressState({ version: 2, lessons: {}, programs: {} }),
    null,
  );
});

test("normalizeProgressState sanitizes unknown fields and bad values", () => {
  const payload = {
    version: PROGRESS_VERSION,
    lessons: {
      a: {
        completed: true,
        completedAt: 12345,
        junk: "stripped",
      },
    },
    programs: {
      b: {
        completed: false,
        bestPassed: "nope",
        bestTotal: -5,
        lastStatus: "mystery_status",
        lastCheckedAt: "2026-03-01T00:00:00.000Z",
        maxHintsRevealed: 3,
      },
    },
  };
  const normalized = normalizeProgressState(payload);
  assert.ok(normalized);
  assert.deepEqual(normalized.lessons.a, { completed: true });
  assert.deepEqual(normalized.programs.b, {
    completed: false,
    bestPassed: 0,
    bestTotal: 0,
    lastCheckedAt: "2026-03-01T00:00:00.000Z",
    maxHintsRevealed: 3,
  });
});

test("normalizeProgressState preserves valid evaluation metadata", () => {
  const payload = {
    version: PROGRESS_VERSION,
    lessons: {},
    programs: {
      b: {
        completed: true,
        completedAt: "2026-03-01T00:00:00.000Z",
        bestPassed: 4,
        bestTotal: 5,
        lastStatus: "wrong_answer",
        lastPassed: 4.9,
        lastTotal: 5,
        lastCheckedAt: "2026-03-01T00:00:00.000Z",
        maxHintsRevealed: 1,
      },
    },
  };
  const normalized = normalizeProgressState(payload);
  assert.ok(normalized);
  assert.equal(normalized.programs.b.lastStatus, "wrong_answer");
  assert.equal(normalized.programs.b.lastPassed, 4);
});