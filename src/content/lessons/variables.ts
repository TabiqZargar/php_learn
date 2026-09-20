import type { Lesson } from "@/lib/learning/types";

export const LESSON_VARIABLES: Lesson = {
  id: "lesson-variables",
  slug: "variables",
  title: "Variables",
  category: "basics",
  description: "Storing and reusing values with $variables.",
  order: 3,
  estimatedMinutes: 7,
  sections: [
    {
      heading: "The dollar sign",
      explanation:
        "Every variable in PHP starts with a dollar sign followed by the name. Variables are created the moment you assign a value, and their type is inferred from that value.",
      code: {
        code: `<?php
$greeting = "Hello";
$year = 2026;
$pi = 3.14;

echo $greeting . " from PHP {$year}";`,
        output: "Hello from PHP 2026",
      },
      notes: [
        "No type declaration needed — PHP infers it.",
        "A variable must be assigned before it is read.",
      ],
    },
    {
      heading: "Naming rules",
      explanation:
        "Variable names are case-sensitive and may only contain letters, digits, and underscores, and cannot begin with a digit. By convention, developers use snake_case.",
      code: {
        code: `<?php
$first_name = "Tabiq";   // good: snake_case
$firstName = "Tabiq";    // also valid (camelCase)
$_private = "ok";        // leading underscore is allowed
$1name = "not allowed";  // invalid — name cannot start with a digit
?>`,
        output: "Comment explains the invalid line",
      },
    },
    {
      heading: "Assigning and reassigning",
      explanation:
        "The assignment operator is a single equals sign. Assigning again simply overwrites the previous value.",
      code: {
        code: `<?php
$level = 1;
echo "Start at level " . $level;

$level = 5;          // overwrite
echo "Now at level " . $level;

$level = $level + 1; // read, then write
echo "Gained a level: " . $level;`,
        output: "Start at level 1Now at level 5Gained a level: 6",
      },
    },
    {
      heading: "Concatenation vs interpolation",
      explanation:
        "Both join strings with variables. Concatenation uses a dot; interpolation happens automatically inside double-quoted strings.",
      code: {
        code: `<?php
$user = "Tabiq";

echo "Welcome, " . $user . "!";   // concatenation
echo "Welcome, $user!";           // interpolation
echo "Welcome, {$user}!";         // interpolation with braces`,
        output: "Welcome, Tabiq!Welcome, Tabiq!Welcome, Tabiq!",
      },
      notes: [
        "Braces help when the variable is followed by letters, e.g. \"{$user}s dog\".",
        "Single-quoted strings do NOT interpolate: '$user' prints literally.",
      ],
    },
    {
      heading: "Variable variables (a curiosity)",
      explanation:
        "PHP lets you use the value of one variable as the name of another. This is rarely needed and easy to misuse, but it explains why PHP variables are dynamic.",
      code: {
        code: `<?php
$name = "fruit";
$$name = "apple";      // creates $fruit

echo $fruit;`,
        output: "apple",
      },
      notes: ["Prefer arrays or objects over variable variables in real code."],
    },
  ],
};