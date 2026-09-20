import type { Program } from "@/lib/learning/types";

export const PROGRAM_REVERSE_STRING: Program = {
  id: "program-reverse-string",
  slug: "reverse-string",
  title: "Reverse a String",
  description: "Print a string's characters in reverse order.",
  category: "Strings",
  difficulty: "beginner",
  problemStatement:
    "Given an input string, produce a new string with its characters in reverse order, then print both the original and the reversed version.",
  concepts: ["strrev()", "Concatenation", "Built-in functions"],
  code: `<?php
function reverseString($text) {
    return strrev($text);
}

$original = "PHP Academy";
$reversed = reverseString($original);

echo "Original: $original";
echo "\\nReversed: $reversed";
echo "\\nManual check: " . (strrev($original) === $reversed ? "OK" : "FAIL");`,
  expectedOutput: `Original: PHP Academy
Reversed: ymedacA PHP
Manual check: OK`,
  explanation:
    "PHP ships with strrev(), which returns the reversed string directly. The example wraps it in a named function so the intent is clear and reusable, then verifies the result against a second call to prove the logic is consistent.",
  notes: [
    "Check the PHP manual before writing a loop — string functions cover most needs.",
    "strrev() works on single-byte characters; multibyte strings need mb_strrev-style handling.",
  ],
practice: {
      starterCode: `<?php

// Return $text with its characters reversed.
function reverseString($text) {
    // Your logic here

    return $text; // <- replace with the correct result
}

// The input from the Input panel arrives as a CLI argument.
$text = $argv[1];

echo "Original: $text" . PHP_EOL;
echo "Reversed: " . reverseString($text);`,
    inputs: [
      { name: "text", label: "Text", type: "text", value: "PHP Academy", description: "The string to reverse." },
    ],
  },
};