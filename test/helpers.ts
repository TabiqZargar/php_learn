import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";

/**
 * Polls tmpdir until no php-academy-stateful-* workspace directories remain.
 * Test files run in parallel child processes, so a live session created by
 * another suite can be present momentarily; a genuinely leaked workspace
 * never converges and fails the test at the deadline.
 */
export async function waitForNoStatefulWorkspaces(
  deadlineMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    const leftovers = (await readdir(tmpdir())).filter((name) =>
      name.startsWith("php-academy-stateful-"),
    );
    if (leftovers.length === 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const leftovers = (await readdir(tmpdir())).filter((name) =>
    name.startsWith("php-academy-stateful-"),
  );
  throw new Error(
    `workspace directories remain after ${deadlineMs}ms: ${leftovers.join(", ")}`,
  );
}