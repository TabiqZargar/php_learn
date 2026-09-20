/**
 * Client-side runner. Keeps the PracticeRunner abstraction used by the UI
 * while shifting execution to the API route on the local dev server. The
 * server owns all process spawning; this module never touches PHP.
 */
import type { PracticeRunner } from "./types";
import { executePractice } from "./clientApi";

export const practiceRunner: PracticeRunner = {
  run(code, inputs) {
    return executePractice(code, inputs);
  },
};