import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_SESSIONS_AND_COOKIES: readonly ReferenceEntry[] = [
  {
    id: "session_start",
    name: "session_start()",
    categoryId: "sessions-and-cookies",
    summary: "Begin (or resume) a session.",
    signature: "session_start(): bool",
    description:
      "Must be called before any output. It starts a new session or resumes the current one, making the $_SESSION superglobal ready to read and write. Call it once at the top of every page.",
    examples: [
      {
        code: `<?php
session_start();
$_SESSION["username"] = "tabiq";
echo "started";`,
        output: "started",
      },
    ],
    keywords: ["begin", "resume", "start session", "state", "before output"],
  },
  {
    id: "session-superglobal",
    name: "$_SESSION",
    categoryId: "sessions-and-cookies",
    summary: "Session data shared across requests.",
    signature: "$_SESSION[\"key\"] = value;",
    description:
      "An associative array that persists across requests for the same visitor. Values you store are available on the next page as long as session_start() has been called.",
    examples: [
      {
        code: `<?php
session_start();
$_SESSION["visits"] = ($_SESSION["visits"] ?? 0) + 1;
echo "visit #" . $_SESSION["visits"];`,
        output: "visit #1",
      },
    ],
    keywords: ["persistent", "across requests", "state", "store data", "per-user"],
  },
  {
    id: "session_destroy",
    name: "session_destroy()",
    categoryId: "sessions-and-cookies",
    summary: "End the session and clear its data.",
    signature: "session_destroy(): bool",
    description:
      "Destroys the session and its data. Often used after unsetting the relevant keys, e.g. when a user logs out. The browser must still be told the session cookie is gone.",
    examples: [
      {
        code: `<?php
session_start();
session_unset();
session_destroy();
echo "session destroyed";`,
        output: "session destroyed",
      },
    ],
    keywords: ["end", "clear", "logout", "destroy session", "remove data"],
  },
  {
    id: "setcookie",
    name: "setcookie()",
    categoryId: "sessions-and-cookies",
    summary: "Send a cookie to the browser.",
    signature: "setcookie(string $name, string $value = \"\", int $expires = 0): bool",
    description:
      "Must be called before any output. Sends a Set-Cookie header; the browser stores it and returns it on later requests via $_COOKIE. Set an expiry in the past to delete a cookie.",
    examples: [
      {
        code: `<?php
setcookie("theme", "dark", time() + 60 * 60 * 24);   // 1 day
echo "cookie set";`,
        output: "cookie set",
      },
    ],
    keywords: ["set-cookie", "browser storage", "expires", "send to browser"],
  },
  {
    id: "cookie-superglobal",
    name: "$_COOKIE",
    categoryId: "sessions-and-cookies",
    summary: "Cookies sent by the visitor's browser.",
    signature: "$_COOKIE[\"name\"]",
    description:
      "Populated automatically from the browser's cookies. Read it like any array. Remember: cookies travel with every request, so never store secrets there.",
    examples: [
      {
        code: `<?php
echo $_COOKIE["theme"] ?? "light";`,
        output: "dark",
      },
    ],
    keywords: ["read cookie", "browser values", "preferences", "client data"],
  },
];
