import type { Program } from "@/lib/learning/types";

export const PROGRAM_PHP_MYSQL_LOGIN: Program = {
  id: "program-php-mysql-login",
  slug: "php-mysql-login",
  title: "Login with sessions and MySQL",
  description: "Authenticate a user against a MySQL users table and keep them logged in with a PHP session.",
  category: "Databases",
  difficulty: "beginner",
  problemStatement:
    "Check submitted credentials against the seeded users table using a prepared statement and password_verify, then keep successful logins across requests with a PHP session and provide a working logout.",
  concepts: ["prepared SELECT with bind_result", "password_verify()", "session_start()", "session_regenerate_id()", "logout with session_destroy()"],
  code: `<?php
// PHP Sessions + MySQL in one script. $_SESSION survives across requests
// inside THIS practice session; the users table is seeded for THIS session.
session_start();

$config = require __DIR__ . "/academy_db_config.php";

$conn = mysqli_connect(
    $config["host"], $config["user"], $config["password"],
    $config["database"], $config["port"]
);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$users = $config["table_prefix"] . "users";
$action = $_POST["action"] ?? "status";

if ($action === "login") {
    $username = isset($_POST["username"]) ? (string) $_POST["username"] : "";
    $password = isset($_POST["password"]) ? (string) $_POST["password"] : "";

    // Prepared statement: username and password can never break out of SQL.
    $stmt = mysqli_prepare($conn, "SELECT id, username, password_hash FROM \`$users\` WHERE username = ?");
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "s", $username);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $id, $foundUser, $passwordHash);
        $match = mysqli_stmt_fetch($stmt);
        mysqli_stmt_close($stmt);
    } else {
        $match = false;
    }

    if ($match && password_verify($password, $passwordHash)) {
        // Only on success: your user is now logged in for every later request.
        session_regenerate_id(true);
        $_SESSION["username"] = $foundUser;
        echo "LOGIN_SUCCESS";
    } else {
        echo "LOGIN_FAILED";
    }
} elseif ($action === "logout") {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), "", time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    session_destroy();
    echo "LOGGED_OUT";
} else {
    if (isset($_SESSION["username"])) {
        echo "AUTHENTICATED as " . $_SESSION["username"];
    } else {
        echo "UNAUTHORIZED";
    }
}

mysqli_close($conn);`,
  expectedOutput: "LOGIN_SUCCESS\nAUTHENTICATED as alice\nLOGGED_OUT\nUNAUTHORIZED",
  explanation:
    "A login must prove the submitted password against the STORED hash — never compare stored plaintext. The query selects the user's row by username through a prepared statement so the value is bound as data and cannot alter the SQL text; the injection scenario (a username containing a quote) then matches no row and stays LOGIN_FAILED. password_verify compares the submitted password with the bcrypt hash the seed row stores, so a correct attempt yields LOGIN_SUCCESS while a wrong password or an unknown user yields LOGIN_FAILED. Only after success does the script store the identity in the session and regenerate the session id, which stops session-fixation; the status action reports the stored user, and logout clears the data and destroys the session so later status calls report UNAUTHORIZED.",
  notes: [
    "Declare session_start() before any output — even whitespace before <?php breaks it.",
    "Never store plaintext passwords; password_verify handles the hash comparison.",
    "Prepared statements defeat SQL injection because the value is bound as data, not pasted into the SQL string.",
    "Regenerate the session id after login to protect against session fixation.",
  ],
  practice: {
    execution: "mysql",
    mysql: { seedTables: ["users"] },
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "login",
        description: "login, status or logout",
      },
      {
        name: "username",
        label: "Username",
        type: "text",
        value: "alice",
        description: "Account to authenticate",
      },
      {
        name: "password",
        label: "Password",
        type: "text",
        value: "",
        description: "Submit a password to check with password_verify",
      },
    ],
    starterCode: `<?php
// PHP Sessions + MySQL in one script. The session keeps a logged-in user
// across requests inside THIS practice session; the database has a seeded
// users table for THIS session only.

session_start(); // must run before ANY output

$conn = mysqli_connect(...);   // from academy_db_config.php
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Physical table: $config["table_prefix"] . "users".
// Seeded for this session with columns id, username, password_hash.
// The hashes are bcrypt digests: verify against them with password_verify(),
// and NEVER compare or store the password as plaintext.
//
// The Input panel sends keys: action, username, password.
//
//   action = login  -> look up the username with a PREPARED statement and
//                      bind_result the row; only when password_verify
//                      succeeds, log the user into the session and print
//                      "LOGIN_SUCCESS". Otherwise print "LOGIN_FAILED".
//   action = status -> print "AUTHENTICATED as <username>" when the session
//                      holds a logged-in user, else "UNAUTHORIZED".
//   action = logout -> clear the session data, destroy the session and print
//                      "LOGGED_OUT".
//
// After a successful login, regenerate the session id (session_regenerate_id)
// before storing the identity.

$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "login-valid-alice",
      name: "Correct credentials authenticate Alice",
      steps: [
        {
          inputs: {
            action: "login",
            username: "alice",
            password: "{{PASSWORD:alice}}",
          },
          expectedOutput: "LOGIN_SUCCESS",
          expectedDb: [
            {
              table: "users",
              rows: [
                {
                  id: "1",
                  username: "alice",
                  password_hash: "$2y$12$mv5xig3JrzdpsJ68HfyHsub/TrpE.anpoILsKE5oH71gC08HpSN.W",
                },
                {
                  id: "2",
                  username: "bob",
                  password_hash: "$2y$12$Qb1SDkQ0NwwpjZwXeXL8OOQfzkqI/fwEvzgxNhHPdy6YDC7N2tQV2",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "login-wrong-password",
      name: "Wrong password is rejected",
      steps: [
        {
          inputs: {
            action: "login",
            username: "alice",
            password: "nope-not-it",
          },
          expectedOutput: "LOGIN_FAILED",
        },
      ],
    },
    {
      id: "login-unknown-user",
      name: "Unknown user is rejected",
      steps: [
        {
          inputs: {
            action: "login",
            username: "mallory",
            password: "{{PASSWORD:alice}}",
          },
          expectedOutput: "LOGIN_FAILED",
        },
      ],
    },
    {
      id: "login-sql-injection",
      name: "SQL injection in the username stays a failed login",
      steps: [
        {
          inputs: {
            action: "login",
            username: "' OR '1'='1",
            password: "x",
          },
          expectedOutput: "LOGIN_FAILED",
          expectedDb: [
            {
              table: "users",
              rows: [
                {
                  id: "1",
                  username: "alice",
                  password_hash: "$2y$12$mv5xig3JrzdpsJ68HfyHsub/TrpE.anpoILsKE5oH71gC08HpSN.W",
                },
                {
                  id: "2",
                  username: "bob",
                  password_hash: "$2y$12$Qb1SDkQ0NwwpjZwXeXL8OOQfzkqI/fwEvzgxNhHPdy6YDC7N2tQV2",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "login-persists-session",
      name: "Login survives the next request",
      steps: [
        {
          inputs: {
            action: "login",
            username: "alice",
            password: "{{PASSWORD:alice}}",
          },
          expectedOutput: "LOGIN_SUCCESS",
        },
        { inputs: { action: "status" }, expectedOutput: "AUTHENTICATED as alice" },
      ],
    },
    {
      id: "login-then-logout",
      name: "Logout after login reports LOGGED_OUT",
      steps: [
        {
          inputs: {
            action: "login",
            username: "bob",
            password: "{{PASSWORD:bob}}",
          },
          expectedOutput: "LOGIN_SUCCESS",
        },
        { inputs: { action: "logout" }, expectedOutput: "LOGGED_OUT" },
      ],
    },
    {
      id: "login-post-logout-unauthorized",
      name: "Status is UNAUTHORIZED after logout",
      steps: [
        {
          inputs: {
            action: "login",
            username: "alice",
            password: "{{PASSWORD:alice}}",
          },
          expectedOutput: "LOGIN_SUCCESS",
        },
        { inputs: { action: "logout" }, expectedOutput: "LOGGED_OUT" },
        { inputs: { action: "status" }, expectedOutput: "UNAUTHORIZED" },
      ],
    },
    {
      id: "login-isolation-bob",
      name: "Bob authenticates as himself, not Alice",
      steps: [
        {
          inputs: {
            action: "login",
            username: "bob",
            password: "{{PASSWORD:bob}}",
          },
          expectedOutput: "LOGIN_SUCCESS",
        },
        { inputs: { action: "status" }, expectedOutput: "AUTHENTICATED as bob" },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "Passwords are never kept in plaintext: every row stores a bcrypt hash, and verification compares the submitted password with that hash rather than with the stored text. The session then carries the authenticated identity across requests, and status answers from what the session holds, not from the database.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Start the session first, load the config, connect, then select the user's row by username with a prepared statement. Bind the results, verify the submitted password against the hash column, and only on success regenerate the session id and store the username. For logout clear the session data, expire the cookie, destroy the session, and print the confirmation.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The grader checks a valid Alice login, a wrong password, an unknown user, a login where the username is a quote-and-condition so a naive query would match anything, login followed by status, logout after login, status after logout, and Bob logging in as himself. Prepared statements plus password_verify cover the injection case automatically.",
    },
  ],
  lessonReferences: [
    { lessonSlug: "php-mysql-login", label: "Login with sessions and MySQL" },
  ],
};