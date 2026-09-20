import type { Lesson } from "@/lib/learning/types";

export const LESSON_CONDITIONALS: Lesson = {
  id: "lesson-conditionals",
  slug: "conditionals",
  title: "Conditional Statements",
  category: "basics",
  description: "Directing the flow with if, else, elseif, and switch.",
  order: 6,
  estimatedMinutes: 8,
  sections: [
    {
      heading: "if and else",
      explanation:
        "The if statement runs its block when the condition is truthy; else runs when it is not.",
      code: {
        code: `<?php
$score = 72;

if ($score >= 60) {
    echo "Passed";
} else {
    echo "Failed";
}`,
        output: "Passed",
      },
    },
    {
      heading: "elseif chains",
      explanation:
        "Chain conditions with elseif. The interpreter stops at the first true branch, so order matters.",
      code: {
        code: `<?php
$score = 85;

if ($score >= 90) {
    echo "A";
} elseif ($score >= 80) {
    echo "B";
} elseif ($score >= 70) {
    echo "C";
} else {
    echo "Needs improvement";
}`,
        output: "B",
      },
      notes: ["Check the most specific condition first."],
    },
    {
      heading: "Truthiness",
      explanation:
        "PHP treats empty values as falsy in a condition: 0, 0.0, \"\", \"0\", [], null, and false. Everything else is truthy — including the string \"false\".",
      code: {
        code: `<?php
$items = [];          // empty array is falsy

if ($items) {
    echo "There are items";
} else {
    echo "Cart is empty";
}

$flag = "false";      // non-empty string is TRUTHY
if ($flag) {
    echo "Runs!";
}`,
        output: "Cart is emptyRuns!",
      },
    },
    {
      heading: "Ternary and null coalescing",
      explanation:
        "The ternary operator ? : is a compact if/else returning a value. The null coalescing operator ?? returns the left side if it exists and is not null, otherwise the right side.",
      code: {
        code: `<?php
$age = 17;
echo $age >= 18 ? "adult" : "minor";   // ternary: minor

$name = $_GET["name"] ?? "Guest";       // coalescing
echo $name;`,
        output: "minorGuest",
      },
      notes: [
        "?? is the safe way to read array keys and form input.",
        "Nested ternaries are hard to read — use if/else instead.",
      ],
    },
    {
      heading: "switch",
      explanation:
        "switch compares one value against many cases. Unlike if/else chains, switch uses loose (==) comparison.",
      code: {
        code: `<?php
$day = "friday";

switch ($day) {
    case "monday":
        echo "Start of week";
        break;
    case "friday":
        echo "Almost weekend";
        break;
    default:
        echo "Another day";
}`,
        output: "Almost weekend",
      },
      notes: [
        "Every case needs break to stop propagation — otherwise it falls through.",
        "Prefer switch when testing many fixed values against one variable.",
      ],
    },
  ],
};