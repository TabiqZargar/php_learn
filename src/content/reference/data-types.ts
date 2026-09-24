import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_DATA_TYPES: readonly ReferenceEntry[] = [
  {
    id: "string",
    name: "String",
    categoryId: "data-types",
    summary: "A sequence of characters, quoted single or double.",
    signature: "\"text\"  |  'text'",
    description:
      "Strings hold text. Double quotes interpolate variables, single quotes print the source literally. Strings are measured in characters with strlen().",
    examples: [
      {
        code: `<?php
$name = "Tabiq";
echo strlen($name);
echo " " . $name;`,
        output: "5 Tabiq",
      },
    ],
    keywords: ["text", "character", "quoted"],
  },
  {
    id: "integer",
    name: "Integer",
    categoryId: "data-types",
    summary: "A whole number (positive, negative or zero).",
    signature: "123  |  -42  |  1_000_000",
    description:
      "Integers are whole numbers. Underscores between digits are ignored by the parser and just improve readability of large literals.",
    examples: [
      {
        code: `<?php
$count = 10;
echo $count + 5;
echo " " . (-7);`,
        output: "15 -7",
      },
    ],
    keywords: ["int", "whole number", "number"],
  },
  {
    id: "float",
    name: "Float",
    categoryId: "data-types",
    summary: "A number with a decimal part.",
    signature: "3.14  |  2.5e3",
    description:
      "Floats (also called doubles) represent fractional numbers. They are imprecise for money — prefer integer cents or string math where exactness matters.",
    examples: [
      {
        code: `<?php
$pi = 3.14159;
echo round($pi, 2);
echo " " . (2.5 * 2);`,
        output: "3.14 5",
      },
    ],
    keywords: ["double", "decimal", "fraction", "real number"],
  },
  {
    id: "boolean",
    name: "Boolean",
    categoryId: "data-types",
    summary: "true or false — the result of comparisons.",
    signature: "true  |  false",
    description:
      "Booleans hold truth values. PHP's type juggling treats empty strings, 0, null and empty arrays as false in boolean contexts, so be explicit with comparisons.",
    examples: [
      {
        code: `<?php
$isReady = true;
$isReady = (10 > 3);   // true
echo $isReady ? "yes" : "no";
echo " " . (bool) 0; // false prints as nothing`,
        output: "yes ",
      },
    ],
    keywords: ["bool", "true", "false", "truthy"],
  },
  {
    id: "array",
    name: "Array",
    categoryId: "data-types",
    summary: "An ordered, indexable collection of values.",
    signature: "[\"a\", \"b\"]  |  [\"key\" => value]",
    description:
      "Arrays can be sequential (indexed by integers starting at 0) or associative (indexed by string keys), or a mix of both. They are the workhorse of PHP data.",
    examples: [
      {
        code: `<?php
$fruits = ["apple", "banana"];
$user = ["name" => "Tabiq", "score" => 42];

echo $fruits[0];
echo " " . $user["name"];
echo " count=" . count($fruits);`,
        output: "apple Tabiq count=2",
      },
    ],
    keywords: ["list", "collection", "map", "keyed"],
  },
  {
    id: "null",
    name: "null",
    categoryId: "data-types",
    summary: "The absence of a value.",
    signature: "null  |  $x = null;",
    description:
      "null means 'no value here'. An unset variable or a function with no return evaluates to null. Check with is_null() or the null-coalescing operator ??.",
    examples: [
      {
        code: `<?php
$thing = null;
echo is_null($thing) ? "null" : "set";
echo " " . ($thing ?? "fallback");`,
        output: "null fallback",
      },
    ],
    keywords: ["nothing", "unset", "is_null"],
  },
  {
    id: "object",
    name: "object",
    categoryId: "data-types",
    summary: "An instance of a class with properties and methods.",
    signature: "new ClassName()",
    description:
      "Objects bundle data (properties) with behavior (methods). PHP also offers the generic stdClass for quick data objects.",
    examples: [
      {
        code: `<?php
$user = new stdClass();
$user->name = "Tabiq";
echo $user->name;`,
        output: "Tabiq",
      },
    ],
    keywords: ["class", "instance", "stdClass", "->"],
  },
];