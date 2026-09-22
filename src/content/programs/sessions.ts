import type { Program } from "@/lib/learning/types";

export const PROGRAM_SESSIONS: Program = {
  id: "program-sessions",
  slug: "sessions",
  title: "PHP Session Login / Logout",
  description: "Build a session-backed login and logout flow.",
  category: "Web State",
  difficulty: "beginner",
  problemStatement:
    "Keep a logged-in user's identity available across multiple HTTP requests using a PHP session, then end the session cleanly on logout.",
  concepts: ["session_start()", "$_SESSION", "login / logout flow"],
  code: `<?php
session_start(); // resume the session for this request

$action = $_POST["action"] ?? "status";

if ($action === "login") {
    // Store the submitted user in the session.
    $_SESSION["username"] = $_POST["username"] ?? "";
    echo "Logged in as: " . $_SESSION["username"];
} elseif ($action === "logout") {
    // Clear the data, then remove the stored session.
    $_SESSION = [];
    session_destroy();
    echo "You have been logged out.";
} else {
    // Status: report who is logged in.
    if (isset($_SESSION["username"])) {
        echo "Logged in as: " . $_SESSION["username"];
    } else {
        echo "Not logged in.";
    }
}`,
  expectedOutput: "Logged in as: Tabiq\nYou have been logged out.",
  explanation:
    "session_start() resumes the session tied to this request, giving access through the $_SESSION superglobal. The login action stores the submitted username there; because the session id is kept in a cookie, the next request — even served by a new PHP process — can read it back. The logout action clears the data and calls session_destroy() to remove the stored session, so a later status request reports nobody is logged in.",
  notes: [
    "Call session_start() before any output is sent, even a blank line.",
    "Sessions live on the server; only the session id travels back and forth.",
    "Never store plain-text passwords in a session.",
  ],
  practice: {
    execution: "stateful",
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
        description: "Name to store on login",
      },
    ],
    starterCode: `<?php

session_start(); // must run before ANY output

// The Input panel sends a real POST request with keys: action, username.
//
//   action = login  -> store the submitted username in the session and
//                      print "Logged in as: " followed by the username
//   action = status -> print "Logged in as: <user>" when someone is stored,
//                      otherwise print "Not logged in."
//   action = logout -> clear the session data, destroy the session and
//                      print "You have been logged out."
//
// State you store persists across requests inside THIS practice session.

$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "session-login",
      name: "Login stores the user",
      steps: [
        {
          inputs: { action: "login", username: "alice" },
          expectedOutput: "Logged in as: alice",
        },
      ],
    },
    {
      id: "session-persists",
      name: "Session survives the next request",
      steps: [
        {
          inputs: { action: "login", username: "bob" },
          expectedOutput: "Logged in as: bob",
        },
        { inputs: { action: "status" }, expectedOutput: "Logged in as: bob" },
      ],
    },
    {
      id: "session-logout",
      name: "Logout ends the session",
      steps: [
        {
          inputs: { action: "login", username: "carol" },
          expectedOutput: "Logged in as: carol",
        },
        { inputs: { action: "logout" }, expectedOutput: "You have been logged out." },
      ],
    },
    {
      id: "session-post-logout",
      name: "State is gone after logout",
      steps: [
        {
          inputs: { action: "login", username: "dave" },
          expectedOutput: "Logged in as: dave",
        },
        {
          inputs: { action: "logout" },
          expectedOutput: "You have been logged out.",
        },
        { inputs: { action: "status" }, expectedOutput: "Not logged in." },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "Sessions live entirely on the server. Starting the session resumes the data tied to this practice session's cookie, and anything you store in the session array survives into the next request. Start every request with it, before anything is printed.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Branch on the action field so login writes the submitted username into the session array while status reads it back. For logout, clear the stored user first, then destroy the session, and print the confirmation so the learner sees it. Never print before starting the session.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "On the login request, store the submitted username. On status requests, print whether that stored value is set. On logout requests, wipe the session data, destroy the session, and print the goodbye message. The graded check runs several requests in one session — if you only print on every request without storing, the persistence test fails.",
    },
  ],
  lessonReferences: [{ lessonSlug: "sessions", label: "Sessions" }],
};