import type { Lesson } from "@/lib/learning/types";

export const LESSON_DATA_TYPES: Lesson = {
  id: "lesson-data-types",
  slug: "data-types",
  title: "Data Types",
  category: "basics",
  description: "Strings, integers, floats, booleans, arrays, and null.",
  order: 4,
  estimatedMinutes: 9,
  sections: [
    {
      heading: "Scalar types",
      explanation:
        "The basic building blocks: a text string, a whole number (integer), a decimal (float), and a truth value (boolean). PHP converts between them automatically where it makes sense.",
      code: {
        code: `<?php
$title   = "PHP Academy";   // string
$count   = 42;              // int
$price   = 19.99;           // float
$inStock = true;            // bool

$total = $count + 1;        // int + int
$halved = $count / 2;       // int / int gives 21 (whole)
$quarter = $count / 8;      // int / int gives 5.25 (float)`,
        output: "no output — declarations only",
      },
      notes: [
        "String quotes: single or double, both are valid.",
        "Use true / false for booleans; 1 / 0 are sometimes coerced.",
      ],
    },
    {
      heading: "Arrays",
      explanation:
        "PHP arrays are ordered maps. They can hold any mix of values, keyed by integers (list) or strings (associative array).",
      code: {
        code: `<?php
$fruits = ["apple", "banana", "cherry"];   // list
echo $fruits[0];

$user = [
    "name"  => "Tabiq",
    "level" => 7,
];
echo $user["name"];
echo $user["level"];`,
        output: "appleTabiq7",
      },
      notes: [
        "[] is the modern syntax; array() also still works.",
        "Keys colons => arrow: list and associative forms can mix.",
      ],
    },
    {
      heading: "Null",
      explanation:
        "null represents a variable with no value. Reading an unset variable, or one assigned null, is indistinguishable — the type system treats them the same.",
      code: {
        code: `<?php
$nothing = null;
var_dump($nothing);   // prints NULL
`,
        output: "NULL",
      },
      notes: ["isset($x) returns false for null or unset variables."],
    },
    {
      heading: "Checking types",
      explanation:
        "gettype() names a value's type; is_string(), is_int(), is_float(), is_bool(), is_array(), and is_null() test for one specifically. var_dump() prints the type AND value — invaluable for debugging.",
      code: {
        code: `<?php
$value = "42";

echo gettype($value);   // string
var_dump($value);       // string(2) "42"

$numbers = [1, 2, 3];
var_dump(is_array($numbers));   // bool(true)
var_dump(is_int($value));       // bool(false) — it is a string`,
        output: "stringstring(2) \"42\"bool(true)bool(false)",
      },
    },
    {
      heading: "Type juggling",
      explanation:
        "PHP coerces types to fit an operation. \"3\" + 4 gives 7 (numeric context); \"3\" . 4 gives \"34\" (string context). The == operator is loose and lenient; the === operator is strict and compares type too.",
      code: {
        code: `<?php
$num = "3";

echo $num + 4;    // int context: 7
echo $num . 4;    // string context: "34"

var_dump("3" == 3);    // bool(true)   loose
var_dump("3" === 3);   // bool(false)  strict`,
        output: "734bool(true)bool(false)",
      },
      notes: [
        "Prefer === when comparing values to avoid surprising coercions.",
        "Functions like intval() and floatval() convert explicitly.",
      ],
    },
  ],
};