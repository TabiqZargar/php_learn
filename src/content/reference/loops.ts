import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_LOOPS: readonly ReferenceEntry[] = [
  {
    id: "for",
    name: "for",
    categoryId: "loops",
    summary: "Repeat a known number of times with a counter.",
    signature: "for ($i = 0; $i < n; $i++) { ... }",
    description:
      "for keeps three clauses: initialization, condition, and step. The block runs while the condition is true, then the step runs and the condition is re-checked.",
    examples: [
      {
        code: `<?php
for ($i = 1; $i <= 3; $i++) {
    echo $i . " ";
}`,
        output: "1 2 3 ",
      },
    ],
    keywords: ["counter", "iteration", "loop", "range"],
  },
  {
    id: "while",
    name: "while",
    categoryId: "loops",
    summary: "Repeat while a condition stays true.",
    signature: "while (condition) { ... }",
    description:
      "while checks the condition before each iteration. The classic use is reading input or retrying until a state changes.",
    examples: [
      {
        code: `<?php
$n = 1;
while ($n <= 4) {
    echo $n . " ";
    $n++;
}`,
        output: "1 2 3 4 ",
      },
    ],
    keywords: ["do", "condition loop", "retry"],
  },
  {
    id: "do-while",
    name: "do...while",
    categoryId: "loops",
    summary: "Run at least once, then repeat while true.",
    signature: "do { ... } while (condition);",
    description:
      "The body always executes once, because the condition is checked at the end of each pass. Choose it when the first iteration must happen regardless.",
    examples: [
      {
        code: `<?php
$i = 10;
do {
    echo $i . " ";
    $i++;
} while ($i < 12);`,
        output: "10 11 ",
      },
    ],
    keywords: ["post-test", "execute first", "until"],
  },
  {
    id: "foreach",
    name: "foreach",
    categoryId: "loops",
    summary: "Loop over every element of an array.",
    signature: "foreach ($array as $value) { ... }   |   foreach ($array as $key => $value) { ... }",
    description:
      "foreach iterates arrays (and other iterables) without a manual counter. The two-value form gives you each key as well as its value.",
    examples: [
      {
        code: `<?php
$days = ["Mon", "Tue", "Wed"];
foreach ($days as $day) {
    echo $day . " ";
}`,
        output: "Mon Tue Wed ",
      },
      {
        code: `<?php
$scores = ["php" => 90, "sql" => 75];
foreach ($scores as $subject => $score) {
    echo $subject . "=" . $score . " ";
}`,
        output: "php=90 sql=75 ",
      },
    ],
    notes: ["To modify values in place, iterate by reference: foreach ($a as &$v)."],
    keywords: ["iterate", "elements", "key value", "iterate array"],
  },
  {
    id: "break",
    name: "break",
    categoryId: "loops",
    summary: "Exit the loop early.",
    signature: "break;   |   break 2;",
    description:
      "break stops the current loop immediately; control continues after the loop. break n exits n nested loops.",
    examples: [
      {
        code: `<?php
for ($i = 1; $i <= 10; $i++) {
    if ($i === 4) {
        break;
    }
    echo $i . " ";
}`,
        output: "1 2 3 ",
      },
    ],
    keywords: ["exit", "stop", "abort loop"],
  },
  {
    id: "continue",
    name: "continue",
    categoryId: "loops",
    summary: "Skip to the next iteration.",
    signature: "continue;",
    description:
      "continue jumps straight to the next iteration, skipping whatever remains in the current body. It is the loop twin of break.",
    examples: [
      {
        code: `<?php
for ($i = 1; $i <= 5; $i++) {
    if ($i % 2 === 0) {
        continue;
    }
    echo $i . " ";
}`,
        output: "1 3 5 ",
      },
    ],
    keywords: ["skip", "next iteration"],
  },
];