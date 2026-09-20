import type { Program } from "@/lib/learning/types";

export const PROGRAM_SESSIONS: Program = {
  id: "program-sessions",
  slug: "sessions",
  title: "PHP Sessions",
  description: "Store user data across page requests with sessions.",
  category: "Web State",
  difficulty: "beginner",
  problemStatement:
    "Keep a logged-in user's identity available across multiple page loads using PHP sessions, then end the session cleanly on logout.",
  concepts: ["session_start()", "$_SESSION", "session_unset / session_destroy"],
  code: `<?php
session_start();          // must run before ANY output

// Typical login page
if (isset($_POST["username"])) {
    $_SESSION["username"] = $_POST["username"];
}

if (isset($_SESSION["username"])) {
    echo "Logged in as: " . $_SESSION["username"];
} else {
    echo "Please log in.";
}

// Typical logout handler
if (isset($_GET["logout"])) {
    $_SESSION = [];                       // clear session data
    if (session_id() !== "") {
        session_destroy();                // remove the server-side session
    }
    echo "\\nYou have been logged out.";
}`,
  expectedOutput: `Logged in as: Tabiq
You have been logged out.`,
  explanation:
    "session_start() resumes an existing session or opens a new one, giving access through the $_SESSION superglobal. Data stored there survives between requests because PHP tracks the session id in a cookie. session_unset() and session_destroy() clear the in-memory data and the stored session respectively.",
  notes: [
    "Call session_start() before any output is sent, even a blank line.",
    "Sessions live on the server; only the session id travels back and forth.",
  ],
};