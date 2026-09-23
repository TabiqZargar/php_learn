/**
 * SERVER-ONLY seed identity for the php-mysql-login practice (Phase 9D).
 * Read docs/PHP_MYSQL_LOGIN.md before changing anything here.
 *
 * This module owns the ONLY two plaintext passwords the practice knows
 * (alice / bob) plus their deterministic password_hash() digests and the
 * token resolver that lets the Check route substitute a secret WITHOUT ever
 * shipping it to the client. It MUST never be imported by content, by a
 * client component, or by anything that serializes learner-visible metadata.
 */
export interface LoginSeedUser {
  /** Username column value, e.g. "alice". */
  username: string;
  /** PLAINTEXT password. Server-side only — never ship, never serialize. */
  password: string;
  /** Deterministic password_hash() digest of `password` (bcrypt, cost 12). */
  passwordHash: string;
}

/**
 * The practice's seeded accounts. The hashes are FIXED so every session seeds
 * byte-identical rows: grading can assert the users table exactly and the
 * learner's password_verify() still succeeds (a bcrypt hash embeds its own
 * salt, so a pre-computed digest verifies for any future plaintext match).
 */
export const LOGIN_SEED_USERS: readonly LoginSeedUser[] = [
  {
    username: "alice",
    password: "alice2564",
    passwordHash: "$2y$12$mv5xig3JrzdpsJ68HfyHsub/TrpE.anpoILsKE5oH71gC08HpSN.W",
  },
  {
    username: "bob",
    password: "bob8753",
    passwordHash: "$2y$12$Qb1SDkQ0NwwpjZwXeXL8OOQfzkqI/fwEvzgxNhHPdy6YDC7N2tQV2",
  },
];

/**
 * Plaintexts that must be redacted from any surfaced program output. A learner
 * script could print $_POST["password"]; when the Check route submits a real
 * seed password, that output must never reach the browser or the learner.
 */
export const LOGIN_SEED_PASSWORDS: readonly string[] = LOGIN_SEED_USERS.map(
  (user) => user.password,
);

/** JSON payload the seed helper reads to populate the session users table. */
export function loginUsersSeedJson(): string {
  return JSON.stringify(
    LOGIN_SEED_USERS.map((user) => ({
      username: user.username,
      hash: user.passwordHash,
    })),
  );
}

const LOGIN_TOKEN_RE = /^\{\{PASSWORD:([A-Za-z0-9_]+)\}\}$/;

/**
 * Replace a content author's token placeholder with the matching seed
 * plaintext. Non-token values pass through untouched, so applying this to any
 * program's inputs is a no-op unless a token is present. NEVER call this in a
 * path whose result would be recorded or shipped — only at the execution
 * boundary (the Check route's runStep).
 */
export function resolveLoginSeedToken(value: string): string {
  const match = LOGIN_TOKEN_RE.exec(value);
  if (!match) return value;
  const user = LOGIN_SEED_USERS.find((entry) => entry.username === match[1]);
  return user ? user.password : value;
}

export function resolveLoginSeedTokens(
  inputs: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(inputs)) {
    resolved[key] = resolveLoginSeedToken(value);
  }
  return resolved;
}