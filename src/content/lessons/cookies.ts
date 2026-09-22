import type { Lesson } from "@/lib/learning/types";

export const LESSON_COOKIES: Lesson = {
  id: "lesson-cookies",
  slug: "cookies",
  title: "Cookies",
  category: "basics",
  description: "Persist small, client-side values with cookies.",
  order: 10,
  estimatedMinutes: 10,
  sections: [
    {
      heading: "What a cookie is",
      explanation:
        "A cookie is a tiny piece of data the browser keeps and sends back with every request to the matching path. PHP writes cookies as Set-Cookie response headers with setcookie, and reads incoming cookies through the cookies superglobal on the next request.",
      code: {
        code: `<?php
// Writes a response header (no effect on the current request)
setcookie("theme", "dark", time() + 86400, "/");

// On the NEXT request the value is available here:
if (isset($_COOKIE["theme"])) {
    echo "Theme: " . $_COOKIE["theme"];
}`,
        output: "Theme: dark",
      },
      notes: [
        "setcookie() must run before any output, otherwise PHP reports a headers already sent warning.",
        "Only the value reaches the server; the browser owns the cookie.",
      ],
    },
    {
      heading: "Expiry and path",
      explanation:
        "setcookie accepts a lifetime and a path. A future expiry keeps the cookie alive; the root path makes it apply to the whole site. time() plus seconds is the usual way to build the expiry.",
      code: {
        code: `<?php
// Live for one hour, sent to every URL on the site
setcookie("theme", "dark", time() + 3600, "/");
echo "Cookie set.";`,
        output: "Cookie set.",
      },
      notes: [
        "Without a path the cookie still applies but only to the current directory tree in some setups — use the root path for site-wide keys.",
        "Cookies are tiny by design; store preferences, not data you could keep server-side.",
      ],
    },
    {
      heading: "Deleting a cookie",
      explanation:
        "Deleting a cookie means sending the same name and path with an empty value and an expiry in the past. The browser removes it right away, so the next request no longer carries it.",
      code: {
        code: `<?php
setcookie("theme", "", time() - 3600, "/");
echo "Cookie cleared.";`,
        output: "Cookie cleared.",
      },
      notes: [
        "The name and path of the delete must match the cookie you set.",
        "After deletion, isset checks on the superglobal in later requests are false.",
      ],
    },
    {
      heading: "The cookie practice",
      explanation:
        "In the practice window, every Run is a real request. The action field decides what happens: set writes the cookie response header, delete expires it, and status reads the cookies superglobal — which only sees values received from the previous request. That one-request delay is exactly why reading works on the next step.",
      notes: [
        "Call setcookie before printing anything, or the header is sent too late and nothing is stored.",
        "Visitors can see and edit cookies, so never store passwords or secrets in them.",
      ],
    },
  ],
};