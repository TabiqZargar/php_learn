import type { Lesson } from "@/lib/learning/types";

export const LESSON_PHP_MYSQL_LOGIN: Lesson = {
  id: "lesson-php-mysql-login",
  slug: "php-mysql-login",
  title: "Login with sessions and MySQL",
  category: "basics",
  description: "Authenticate users with a users table, then hold the identity in a PHP session.",
  order: 13,
  estimatedMinutes: 14,
  sections: [
    {
      heading: "Hashed credentials",
      explanation:
        "A users table stores password_hash, never the plaintext. Each seeded row carries a bcrypt digest produced by password_hash(), and authentication compares the submitted password with that digest using password_verify() — the function hides the hashing details and reports true only when the password matches the stored hash. Because the hash algorithm is one-way, a copied database leaks nothing usable. When the practice seeds the users table, the rows are deterministic: the hashes are fixed so every session and every check sees byte-identical data.",
      code: {
        code: `<?php
$ok = password_verify($submittedPassword, $storedHash);
var_dump($ok); // true when the password matches the stored hash`,
        output: "bool(true)",
      },
      notes: [
        "Never store or compare plaintext — always work with password_verify and a stored hash.",
        "A bcrypt hash embeds its own salt, so matching a fixed digest never depends on a per-session salt.",
      ],
    },
    {
      heading: "Authenticating with a prepared statement",
      explanation:
        "Login looks up the submitted username with a prepared SELECT, binding the value as data so it can never reshape the SQL. When a row is found, the script verifies the submitted password against the hash column and only then treats the user as authenticated. Unknown users and wrong passwords both fail the lookup-and-verify chain, and a username built from quotes and conditions matches no row because the bound value is not part of the SQL grammar.",
      code: {
        code: `<?php
$stmt = mysqli_prepare($conn, "SELECT id, username, password_hash FROM users WHERE username = ?");
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $id, $foundUser, $storedHash);
$matched = mysqli_stmt_fetch($stmt);
$loggedIn = $matched && password_verify($password, $storedHash);`,
        output: "true when password matches",
      },
      notes: [
        "The placeholders are the only spaces user input ever touches.",
        "Verify the password AFTER finding a row; a missing row must always fail.",
      ],
    },
    {
      heading: "Holding the identity in a session",
      explanation:
        "A successful login stores the authenticated username in $_SESSION so later requests know who is logged in without re-running the query. session_regenerate_id(true) replaces the session id after login, protecting against session fixation — an attacker who fixed the id loses it. Status reports the stored username when it exists, otherwise UNAUTHORIZED. Logout clears $_SESSION, expires the session cookie, and destroys the server-side session, so the next status call reports nobody is logged in.",
      code: {
        code: `<?php
session_start();
if ($loggedIn) {
    session_regenerate_id(true);
    $_SESSION["username"] = $foundUser;
}`, 
        output: "session now holds the identity",
      },
      notes: [
        "session_start() must run before any output, even whitespace.",
        "Regenerate the id on login; destroy the session on logout.",
      ],
    },
  ],
};