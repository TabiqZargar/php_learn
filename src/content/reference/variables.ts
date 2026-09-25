import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_VARIABLES: readonly ReferenceEntry[] = [
  {
    id: "variable-declaration",
    name: "Declaring a variable",
    categoryId: "variables",
    summary: "A variable is created by assigning it a value.",
    signature: "$name = value;",
    description:
      "Every variable starts with a dollar sign. PHP infers the type from the value you assign, and a variable is created simply by giving it a value.",
    examples: [
      {
        code: `<?php
$greeting = "Hello";
$year = 2026;
$pi = 3.14;
$isReady = true;

echo $greeting . " — " . $year;`,
        output: "Hello — 2026",
      },
    ],
    notes: [
      "Variable names are case-sensitive and may contain letters, digits and underscores, but must not start with a digit.",
      "Using an unset variable emits a warning in PHP 8 — assign before you read.",
    ],
    keywords: ["$", "assign", "var"],
  },
  {
    id: "interpolation",
    name: "Interpolation",
    categoryId: "variables",
    summary: "Embed variable values directly inside double-quoted strings.",
    signature: `"...{$variable}..."`,
    description:
      "Inside double-quoted strings PHP substitutes the value of a variable. Curly braces make the boundary explicit when the variable is followed by other characters.",
    examples: [
      {
        code: `<?php
$user = "Tabiq";
echo "Welcome, $user!";
echo "\\nScore: {$user}_score";
echo "\\n" . 'Single quotes do NOT interpolate: $user';`,
        output: "Welcome, Tabiq!\nScore: Tabiq_score\nSingle quotes do NOT interpolate: $user",
      },
    ],
    keywords: ["double quotes", "string", "embedded", "$ in string"],
    notes: [
      "Single-quoted strings never interpolate — $user stays literally $user.",
      "Prefer concatenation with . when the string is more pattern than message.",
    ],
  },
  {
    id: "constants",
    name: "Constants",
    categoryId: "variables",
    summary: "Immutable names, defined with define() or const.",
    signature: "const NAME = value;   |   define(\"NAME\", value);",
    description:
      "Constants hold a value that cannot change once defined. They are conventionally written in UPPERCASE and do not use a dollar sign.",
    examples: [
      {
        code: `<?php
const SITE_NAME = "PHP Academy";
define("MAX_TRIES", 3);

echo SITE_NAME;
echo "\\nMax tries: " . MAX_TRIES;`,
        output: "PHP Academy\nMax tries: 3",
      },
    ],
    notes: [
      "const must be top-level or inside a class; define() works anywhere at runtime.",
      "Magic constants like __FILE__ and __DIR__ are pre-defined by PHP.",
    ],
    keywords: ["immutable", "define", "const", "MAX_"],
  },
  {
    id: "variable-scope",
    name: "Variable scope",
    categoryId: "variables",
    summary: "Function bodies cannot see outer variables automatically.",
    description:
      "A variable declared outside a function is not visible inside it unless you say global, and a variable assigned inside a function is local to that function.",
    examples: [
      {
        code: `<?php
$level = 1;

function showLevel() {
    global $level;
    echo $level;
}

showLevel();`,
        output: "1",
      },
    ],
    notes: [
      "Superglobals ($_POST, $_SESSION, ...) are available everywhere without global.",
      "Prefer passing values as parameters and returning results over global.",
    ],
    keywords: ["global", "local", "function scope", "visibility"],
  },
];