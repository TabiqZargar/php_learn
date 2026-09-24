import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_OPERATORS: readonly ReferenceEntry[] = [
  {
    id: "arithmetic-operators",
    name: "Arithmetic operators",
    categoryId: "operators",
    summary: "Math on numbers: + - * / % **.",
    signature: "$a + $b",
    description:
      "PHP supports the usual math operators. Division / always produces a float (or warning), modulus % gives the remainder, and ** raises a power.",
    examples: [
      {
        code: `<?php
echo 7 + 3;
echo " " . (7 - 3);
echo " " . (7 * 3);
echo " " . (7 / 2);
echo " " . (7 % 3);
echo " " . (2 ** 3);`,
        output: "10 4 21 3.5 1 8",
      },
    ],
    keywords: ["add", "subtract", "multiply", "divide", "modulo", "power", "**", "math"],
  },
  {
    id: "assignment-operators",
    name: "Assignment operators",
    categoryId: "operators",
    summary: "Set a value, or do an operation and assign in one step.",
    signature: "$a = value;   |   $a += 2;",
    description:
      "The = sign assigns. Compound operators combine an operation with assignment: +=, -=, *=, /=, %=, **=, and .= for strings.",
    examples: [
      {
        code: `<?php
$score = 10;
$score += 5;   // 15
$score *= 2;   // 30
$name = "php";
$name .= " academy";  // "php academy"
echo $score;
echo " " . $name;`,
        output: "30 php academy",
      },
    ],
    keywords: ["=", "+=", ".=", "compound", "increment assignment"],
  },
  {
    id: "comparison-operators",
    name: "Comparison operators",
    categoryId: "operators",
    summary: "Compare values and get a boolean result.",
    signature: "$a == $b   |   $a === $b   |   $a <=> $b",
    description:
      "== compares loosely (with type juggling); === compares value AND type. Also >=, <=, >, <, !=, !==. The spaceship <=> returns -1, 0 or 1.",
    examples: [
      {
        code: `<?php
var_dump(1 == "1");    // bool(true) loose
var_dump(1 === "1");   // bool(false) strict
var_dump(10 > 3);      // bool(true)
var_dump(2 <=> 5);     // int(-1) because 2 < 5`,
      },
    ],
    keywords: ["==", "===", "!=", "<=", ">=", "<=>", "spaceship", "equal"],
  },
  {
    id: "logical-operators",
    name: "Logical operators",
    categoryId: "operators",
    summary: "Combine booleans: && || !.",
    signature: "$a && $b   |   $a || $b   |   !$a",
    description:
      "and/or combine conditions, ! negates. The symbolic forms && and || bind tighter than the word forms and or. Comparison and logical operators short-circuit.",
    examples: [
      {
        code: `<?php
$age = 25;
$hasId = true;
if ($age >= 18 && $hasId) {
    echo "allowed";
}
if (!$hasId) {
    echo "denied";
}`,
        output: "allowed",
      },
    ],
    keywords: ["and", "or", "not", "&&", "||", "!", "bool", "condition"],
  },
  {
    id: "increment-decrement",
    name: "Increment / decrement",
    categoryId: "operators",
    summary: "Add or subtract one: ++ and --.",
    signature: "$x++   |   ++$x   |   $x--   |   --$x",
    description:
      "++ and -- change a variable by one. Postfix ($x++) returns the old value; prefix (++$x) returns the new value — handy in loops and counters.",
    examples: [
      {
        code: `<?php
$i = 5;
echo $i++;   // 5, then $i becomes 6
echo " " . ++$i;  // $i becomes 7, outputs 7
echo " " . --$i;  // 6`,
        output: "5 7 6",
      },
    ],
    keywords: ["counter", "$i++", "++", "--", "loop counter"],
  },
  {
    id: "string-concatenation",
    name: "String concatenation",
    categoryId: "operators",
    summary: "Join strings together with the dot operator.",
    signature: "$a . $b",
    description:
      "The . operator joins two strings into one. Use .= to append to an existing string. Numbers in a concatenation are coerced to strings.",
    examples: [
      {
        code: `<?php
$first = "Hello";
echo $first . " world!";
echo " " . (1 . 2); // 12`,
        output: "Hello world! 12",
      },
    ],
    keywords: ["dot", "join", "append", "."],
  },
  {
    id: "null-coalescing",
    name: "Null coalescing",
    categoryId: "operators",
    summary: "Fall back when a value is missing: ??.",
    signature: "$x ?? \"default\"",
    description:
      "?? returns the left side unless it is null or unset, in which case it returns the right side. ??= assigns the fallback when the left is null — ideal for form fields.",
    examples: [
      {
        code: `<?php
$user = [];
echo $user["name"] ?? "anonymous";   // anonymous
$mode = null;
$mode ??= "light";                    // $mode = "light"
echo " " . $mode;`,
        output: "anonymous light",
      },
    ],
    keywords: ["??", "??=", "fallback", "default", "binary operator"],
  },
];