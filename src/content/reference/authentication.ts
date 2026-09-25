import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_AUTHENTICATION: readonly ReferenceEntry[] = [
  {
    id: "password-hash",
    name: "password_hash()",
    categoryId: "authentication",
    summary: "Turn a plain password into a one-way hash so it is never stored in the clear.",
    signature: "password_hash(string $password, string|int|null $algo, array $options = []): string",
    description:
      "Always hash passwords before storing them. password_hash() produces a random, salted hash, so two calls for the same password give different strings. Use PASSWORD_DEFAULT (bcrypt) — the algorithm can improve in future PHP releases without your code changing.",
    examples: [
      {
        code: `<?php
$hash = password_hash("correct horse battery", PASSWORD_DEFAULT);
echo strlen($hash) >= 60 ? "60+ char hash" : "unexpected";`,
        output: "60+ char hash",
      },
    ],
    notes: [
      "Never store plain passwords. Store only the hash.",
      "password_hash() output is safe to store in a VARCHAR(255) column.",
      "Every call returns a different string for the same password, because the salt is random.",
    ],
    keywords: ["bcrypt", "hash", "salt", "secure", "crypt", "hashing"],
  },
  {
    id: "password-verify",
    name: "password_verify()",
    categoryId: "authentication",
    summary: "Check a submitted password against a stored hash.",
    signature: "password_verify(string $password, string $hash): bool",
    description:
      "When a user logs in, look up the stored hash by username, then call password_verify() with what they typed. It returns true when the password matches — never compare passwords directly.",
    examples: [
      {
        code: `<?php
$stored = password_hash("correct horse battery", PASSWORD_DEFAULT);
echo password_verify("correct horse battery", $stored) ? "match" : "no match";
echo " " . (password_verify("wrong", $stored) ? "match" : "no match");`,
        output: "match no match",
      },
    ],
    keywords: ["verify", "match", "check password", "login check"],
  },
  {
    id: "login-flow",
    name: "Login flow",
    categoryId: "authentication",
    summary: "The standard pattern: session_start, read form, verify hash, mark $_SESSION.",
    signature: "session_start();  +  password_verify()  +  $_SESSION['user_id']",
    description:
      "The pattern to reuse for any login form: store a users table of hashes, then compare a submitted password with the stored hash. On success save the user id in the session and redirect; on failure show a generic error. Never reveal which part was wrong.",
    examples: [
      {
        code: `<?php
session_start();
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// Prepared statement: SELECT id, hash FROM users WHERE username = ?
// fetch_assoc() returns null when no such user exists.
$row = null;

if ($row && password_verify($password, $row['hash'])) {
    $_SESSION['user_id'] = $row['id'];
    header('Location: dashboard.php');
    exit;
}
echo 'Invalid credentials';`,
        output: "Invalid credentials",
      },
    ],
    keywords: ["login", "signin", "session", "user_id", "redirect"],
  },
  {
    id: "logout-flow",
    name: "Logout flow",
    categoryId: "authentication",
    summary: "Clear the session so the user is signed out everywhere.",
    signature: "session_unset();  session_destroy();  header('Location: login.php');",
    description:
      "To log out: unset the session variables, destroy the session, and send the browser back to the login page. Redirect after logout so refreshing cannot resubmit the log-out request.",
    examples: [
      {
        code: `<?php
session_start();
session_unset();
session_destroy();
header('Location: login.php');
exit;`,
        output: "(redirects to login.php)",
      },
    ],
    keywords: ["signout", "logout", "destroy", "clear session"],
  },
  {
    id: "session-role-guard",
    name: "Protecting pages (role guard)",
    categoryId: "authentication",
    summary: "Redirect visitors who are not logged in away from private pages.",
    signature: "if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }",
    description:
      "Put a guard at the top of every page that should only be reachable by a signed-in user. If the session has no user id, send them to the login page and stop.",
    examples: [
      {
        code: `<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
echo 'Welcome back';`,
        output: "Welcome back",
      },
    ],
    keywords: ["guard", "protect", "restrict", "private page", "auth check"],
  },
];
