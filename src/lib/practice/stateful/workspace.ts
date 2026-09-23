/**
 * SERVER-ONLY. Read-only snapshot of learner-created files inside a practice
 * session workspace (Phase 9B filesystem capability).
 *
 * This is the ONLY module allowed to touch the host filesystem for the
 * expectedFiles assertions. It never follows symbols, never joins a name
 * without validating it as a bare basename first, and never surfaces a
 * workspace path in text. Names that are not plain filenames are rejected so
 * traversal can never reach outside the session workspace.
 *
 * Files larger than a per-file cap resolve to null (treated as "not
 * readable") so a learner cannot force the grader to buffer unbounded data.
 */
import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { MAX_OUTPUT_BYTES } from "../limits.ts";
import { isSafeWorkspaceFileName } from "../statefulEvaluator.ts";

/** Hard cap read per file: a teaching workspace should hold tiny files. */
const MAX_FILE_BYTES = MAX_OUTPUT_BYTES;

/**
 * Read the exact contents of the given workspace files. Every requested name
 * is present in the result: exact contents for readable files, null when the
 * file is missing, unreadable, unsafe or oversized. Never rejects.
 */
export async function readWorkspaceFiles(
  workspacePath: string,
  names: readonly string[],
): Promise<Record<string, string | null>> {
  const snapshot: Record<string, string | null> = {};
  for (const name of names) {
    if (!isSafeWorkspaceFileName(name)) {
      snapshot[name] = null;
      continue;
    }
    const filePath = join(workspacePath, name);
    if (filePath === workspacePath || !filePath.startsWith(workspacePath + sep)) {
      snapshot[name] = null;
      continue;
    }
    snapshot[name] = await readFileChecked(filePath);
  }
  return snapshot;
}

async function readFileChecked(filePath: string): Promise<string | null> {
  try {
    const handle = await readFile(filePath);
    if (handle.byteLength > MAX_FILE_BYTES) return null;
    return handle.toString("utf8");
  } catch {
    return null;
  }
}