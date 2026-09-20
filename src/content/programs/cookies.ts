import type { Program } from "@/lib/learning/types";

export const PROGRAM_COOKIES: Program = {
  id: "program-cookies",
  slug: "cookies",
  title: "PHP Cookies",
  description: "Persist small, client-side values with cookies.",
  category: "Web State",
  difficulty: "beginner",
  problemStatement:
    "Store a visitor's username in a cookie, read it back on the next request, and remove it again.",
  concepts: ["setcookie()", "$_COOKIE", "Cookie lifecycle"],
  code: `<?php
// Create a cookie that lives for one hour.
setcookie("username", "Tabiq", time() + 3600, "/");

// setcookie() writes HEADERS — it has no immediate effect on $_COOKIE.
// On the next request the value is available again:
if (isset($_COOKIE["username"])) {
    echo "Welcome back, " . $_COOKIE["username"];
} else {
    echo "Cookie set — reload to see the value.";
}

// Delete a cookie: expire it in the past and reuse the same path.
setcookie("username", "", time() - 3600, "/");
echo "\\nCookie cleared.";
`,
  expectedOutput: `Cookie set — reload to see the value.
Cookie cleared.`,
  explanation:
    "setcookie() sends a Set-Cookie header, so it must run before any output and its effects are only visible on the NEXT request through $_COOKIE. The path argument (/) makes the cookie apply to the whole site. Deleting means setting an expiry in the past.",
  notes: [
    "Cookies are sent to the browser and sent back with every request — keep them small.",
    "Never store passwords in cookies; they are visible and editable client-side.",
    "A setcookie() call after output emits headers already fails with a warning.",
  ],
};