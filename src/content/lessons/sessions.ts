import type { Lesson } from "@/lib/learning/types";

export const LESSON_SESSIONS: Lesson = {
  id: "lesson-sessions",
  slug: "sessions",
  title: "Sessions",
  category: "basics",
  description: "Keep data across page requests with server-side sessions.",
  order: 9,
  estimatedMinutes: 10,
  sections: [
    {
      heading: "State across requests",
      explanation:
        "HTTP has no memory: every request is independent and PHP forgets everything between them. A session is server-side storage tagged with an id that the browser sends back in a cookie, so data can survive from one request to the next. Start or resume the session with session_start before any output, then treat the session superglobal like a normal array.",
      code: {
        code: `<?php
// First request: store a value
session_start();
$_SESSION["user"] = "alice";
echo "Stored.";

// Second request (a separate page load): read it back
session_start();
echo " " . $_SESSION["user"];`,
        output: "Stored. alice",
      },
      notes: [
        "Only the session id travels to the browser; the data stays on the server.",
        "session_start() must be called before anything is printed, even a space.",
      ],
    },
    {
      heading: "Reading and updating session data",
      explanation:
        "Once started, the session superglobal behaves like an ordinary array: isset tells you a key exists, you can overwrite values, and unset removes them. The data is re-read at the start of every request, so counts and preferences persist naturally.",
      code: {
        code: `<?php
session_start();
if (isset($_SESSION["visits"])) {
    $_SESSION["visits"]++;
} else {
    $_SESSION["visits"] = 1;
}
echo "Visit number " . $_SESSION["visits"];`,
        output: "Visit number 1",
      },
      notes: [
        "Reloading the page again would print Visit number 2, then 3, and so on.",
        "Storing only small identity data keeps the session file cheap.",
      ],
    },
    {
      heading: "Logging out",
      explanation:
        "Logging out means deleting the stored identity and destroying the server-side session. Clear the array so nothing lingers in memory, then call session_destroy so the stored file is removed and the browser's session cookie becomes useless.",
      code: {
        code: `<?php
session_start();

// logout handler
$_SESSION = [];      // blank the stored data
session_destroy();   // remove the session on the server
echo "You have been logged out.";`,
        output: "You have been logged out.",
      },
      notes: [
        "After logout, a status check on a fresh request finds no stored user.",
        "Real apps usually redirect the visitor to a public page after logging out.",
      ],
    },
    {
      heading: "The login/logout practice",
      explanation:
        "The practice program receives a real POST request every time you press Run, carrying the fields from the Input panel. The action field switches between login, status and logout while the username field carries the name to store. Because every Run shares the same practice session, data you store in the session superglobal survives until you reset the session.",
      notes: [
        "Key the logic on the action field: store on login, report on status, clear on logout.",
        "Never store plain-text passwords; keep identity data such as usernames only.",
      ],
    },
  ],
};