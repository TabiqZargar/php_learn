import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_CONDITIONALS: readonly ReferenceEntry[] = [
  {
    id: "if",
    name: "if",
    categoryId: "conditionals",
    summary: "Run a block only when a condition is true.",
    signature: "if (condition) { ... }",
    description:
      "The simplest branch: evaluate the condition, and execute the block only if it is truthy. Comparisons and logical operators are the usual conditions.",
    examples: [
      {
        code: `<?php
$score = 85;
if ($score >= 60) {
    echo "pass";
}`,
        output: "pass",
      },
    ],
    keywords: ["condition", "branch", "true"],
  },
  {
    id: "elseif-else",
    name: "elseif / else",
    categoryId: "conditionals",
    summary: "Check further conditions, then a final fallback.",
    signature: "if (c1) { ... } elseif (c2) { ... } else { ... }",
    description:
      "elseif only runs when the earlier conditions were false and it is true. else runs when everything above was false. Only one branch executes.",
    examples: [
      {
        code: `<?php
$grade = 72;
if ($grade >= 90) {
    echo "A";
} elseif ($grade >= 70) {
    echo "B";
} else {
    echo "C";
}`,
        output: "B",
      },
    ],
    keywords: ["else if", "branch", "multiple", "elif"],
  },
  {
    id: "switch",
    name: "switch",
    categoryId: "conditionals",
    summary: "Compare one expression against many values.",
    signature: "switch ($x) { case a: ... break; default: ... }",
    description:
      "switch compares a single value with == against each case in order and runs the first match. break ends the case — without it execution falls through.",
    examples: [
      {
        code: `<?php
$color = "blue";
switch ($color) {
    case "red":
        echo "stop";
        break;
    case "blue":
        echo "calm";
        break;
    default:
        echo "unknown";
}`,
        output: "calm",
      },
    ],
    notes: ["switch uses loose comparison (==), unlike match which uses strict comparison (===)."],
    keywords: ["case", "default", "break", "branch"],
  },
  {
    id: "match",
    name: "match",
    categoryId: "conditionals",
    summary: "A strict expression version of switch that returns a value.",
    signature: "$result = match ($x) { 1 => \"one\", default => \"other\" };",
    description:
      "match is an expression: it evaluates to the value on the right of the first arm whose value strictly equals (===) the subject. No break needed — no fall-through.",
    examples: [
      {
        code: `<?php
$status = 404;
$message = match ($status) {
    200 => "OK",
    404 => "Not Found",
    default => "Unknown",
};
echo $message;`,
        output: "Not Found",
      },
    ],
    notes: ["Unhandled values throw an UnhandledMatchError instead of silently continuing."],
    keywords: ["expression", "strict", "arm", "=== switch"],
  },
];