import type { ReferenceEntry } from "@/lib/reference/types";

/**
 * Defining and calling functions. All snippets are read-only examples; they
 * are NOT executed by the reference UI.
 */
export const REFERENCE_ENTRIES_FUNCTIONS: readonly ReferenceEntry[] = [
  {
    id: "function-declaration",
    name: "Declaring a function",
    categoryId: "functions",
    summary: "Bundle reusable logic under a name.",
    signature: "function name(parameters) { body }",
    description:
      "function introduces a named block of statements. The name must start with a letter or underscore and is case-insensitive. Calling it runs the body.",
    examples: [
      {
        code: `<?php
function greet() {
    echo "Hello!";
}
greet();`,
        output: "Hello!",
      },
    ],
    keywords: ["define", "create function", "call", "invoke"],
  },
  {
    id: "function-parameters",
    name: "Parameters and arguments",
    categoryId: "functions",
    summary: "Pass data into a function.",
    signature: "function name($a, $b = \"default\") { ... }",
    description:
      "Parameters are the named variables in the declaration; arguments are the values you pass when calling. Parameters with a default value may be omitted on the call.",
    examples: [
      {
        code: `<?php
function add($a, $b = 1) {
    return $a + $b;
}
echo add(5);      // 6
echo " " . add(5, 3);  // 8`,
        output: "6 8",
      },
    ],
    keywords: ["arguments", "params", "default value", "pass by value"],
  },
  {
    id: "return",
    name: "return",
    categoryId: "functions",
    summary: "Send a value back and stop the function.",
    signature: "return value;",
    description:
      "return ends the function immediately and gives the caller the value (or null when nothing is returned). A function without return logs null.",
    examples: [
      {
        code: `<?php
function double($n) {
    return $n * 2;
}
echo double(4);`,
        output: "8",
      },
    ],
    keywords: ["return value", "exit function", "result"],
  },
  {
    id: "type-declarations",
    name: "Type declarations",
    categoryId: "functions",
    summary: "Pin a parameter or return type so PHP enforces it.",
    signature: "function f(int $n): string { ... }",
    description:
      "Prefix a parameter with a type to require it, and add : type after the closing paren for the return. PHP validates at call time; strict_types=1 makes the check exact instead of coercive.",
    examples: [
      {
        code: `<?php
declare(strict_types=1);
function describe(int $n): string {
    return "Value: " . $n;
}
echo describe(7);`,
        output: "Value: 7",
      },
    ],
    keywords: ["int", "string", "strict_types", "typed", "?nullable", "void"],
  },
  {
    id: "arrow-functions",
    name: "Arrow functions (fn)",
    categoryId: "functions",
    summary: "A short function that returns one expression.",
    signature: "fn($x) => $x * 2",
    description:
      "fn creates a compact anonymous function that returns the single expression and automatically captures outer variables by value — no use needed.",
    examples: [
      {
        code: `<?php
$numbers = [1, 2, 3];
$doubled = array_map(fn($n) => $n * 2, $numbers);
echo implode(" ", $doubled);`,
        output: "2 4 6",
      },
    ],
    keywords: ["anonymous", "closure", "fn", "lambda", "short"],
  },
];
