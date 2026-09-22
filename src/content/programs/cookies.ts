import type { Program } from "@/lib/learning/types";

export const PROGRAM_COOKIES: Program = {
  id: "program-cookies",
  slug: "cookies",
  title: "PHP Cookies",
  description: "Persist small, client-side values with cookies.",
  category: "Web State",
  difficulty: "beginner",
  problemStatement:
    "Store a color preference in a cookie, read it back on the next request, and remove it again.",
  concepts: ["setcookie()", "$_COOKIE", "Cookie lifecycle"],
  code: `<?php
$action = $_POST["action"] ?? "status";

if ($action === "set") {
    // Create a cookie that lives for one hour.
    setcookie("color", "blue", time() + 3600, "/");
    echo "Color cookie set.";
} elseif ($action === "delete") {
    // Delete: expire it in the past and reuse the same path.
    setcookie("color", "", time() - 3600, "/");
    echo "Color cookie deleted.";
} else {
    // Status: the value arrives with this request's cookies.
    if (isset($_COOKIE["color"])) {
        echo "Color: " . $_COOKIE["color"];
    } else {
        echo "No color cookie set.";
    }
}`,
  expectedOutput: "Color cookie set.\nColor: blue\nColor cookie deleted.\nNo color cookie set.",
  explanation:
    "setcookie() sends a Set-Cookie header, so it must run before any output and its effect is only visible on the NEXT request through $_COOKIE. The path argument (/) makes the cookie apply to the whole site. Deleting means sending an empty value with an expiry in the past — the browser drops the cookie, so later requests no longer carry it.",
  notes: [
    "Cookies are sent to the browser and sent back with every request — keep them small.",
    "Never store passwords in cookies; they are visible and editable client-side.",
    "A setcookie() call after output fails with a headers already sent warning.",
  ],
  practice: {
    execution: "stateful",
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "set",
        description: "set, delete or status",
      },
    ],
    starterCode: `<?php

// The Input panel sends a real POST request (key: action).
//
//   action = set     -> setcookie("color", "blue", time() + 3600, "/");
//                       print "Color cookie set."
//   action = delete  -> expire the color cookie in the PAST and send an
//                       empty value: setcookie("color", "", time() - 3600, "/");
//                       print "Color cookie deleted."
//   action = status  -> print "Color: blue" when $_COOKIE["color"] is set,
//                       otherwise print "No color cookie set."
//
// setcookie() writes a response HEADER, so call it before any output; the
// value only appears in $_COOKIE on the NEXT request.

$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "cookie-set",
      name: "Set stores a cookie",
      steps: [
        {
          inputs: { action: "set" },
          expectedOutput: "Color cookie set.",
          expectedCookies: { color: "blue" },
        },
      ],
    },
    {
      id: "cookie-read",
      name: "Cookie is read on the next request",
      steps: [
        { inputs: { action: "set" }, expectedOutput: "Color cookie set." },
        { inputs: { action: "status" }, expectedOutput: "Color: blue" },
      ],
    },
    {
      id: "cookie-delete",
      name: "Delete removes the cookie",
      steps: [
        { inputs: { action: "set" }, expectedOutput: "Color cookie set." },
        {
          inputs: { action: "delete" },
          expectedOutput: "Color cookie deleted.",
          expectedCookies: { color: null },
        },
      ],
    },
    {
      id: "cookie-absent",
      name: "Cookie stays gone",
      steps: [
        { inputs: { action: "set" }, expectedOutput: "Color cookie set." },
        { inputs: { action: "delete" }, expectedOutput: "Color cookie deleted." },
        { inputs: { action: "status" }, expectedOutput: "No color cookie set." },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "A cookie is stored and sent back by the browser, so PHP never keeps it. setcookie adds a Set-Cookie header to the response — call it before printing anything and accept that the value only reaches your script on the following request through the cookies superglobal.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Branch on the action field. The set branch should call setcookie with the color name, a value, a future expiry and the root path, then print its confirmation. The status branch should print the color only when the superglobal has it. The delete branch should expire the cookie in the past with an empty value and print its confirmation.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check sends several requests inside one session: set arrives first, then status must read what the superglobal now holds, then delete, then status must report the cookie is gone. If you print output before setcookie, PHP sends the header too late, nothing is stored, and the status request finds nothing.",
    },
  ],
  lessonReferences: [{ lessonSlug: "cookies", label: "Cookies" }],
};