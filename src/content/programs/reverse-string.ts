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
  testCases: [
    {
      id: "reverse-hello",
      name: "Ordinary word",
      inputs: [{ name: "text", label: "Text", type: "text", value: "hello" }],
      expectedOutput: "Original: hello\nReversed: olleh",
    },
    {
      id: "reverse-palindrome",
      name: "Palindrome (PHP)",
      inputs: [{ name: "text", label: "Text", type: "text", value: "PHP" }],
      expectedOutput: "Original: PHP\nReversed: PHP",
    },
    {
      id: "reverse-sentence",
      name: "Two-word string",
      inputs: [{ name: "text", label: "Text", type: "text", value: "PHP Academy" }],
      expectedOutput: "Original: PHP Academy\nReversed: ymedacA PHP",
    },
    {
      id: "reverse-empty",
      name: "Empty string",
      inputs: [{ name: "text", label: "Text", type: "text", value: "" }],
      expectedOutput: "Original: \nReversed: ",
    },
  ],
  hints: [
    {
      id: "reverse-hint-1",
      title: "Conceptual direction",
      content:
        "Reversing keeps every character but flips the order: the last character becomes the first. The empty string reversed is still empty — there is nothing to undo there.",
    },
    {
      id: "reverse-hint-2",
      title: "Implementation strategy",
      content:
        "Two roads lead to the answer: take characters off the end of the original one at a time, or use a PHP built-in function designed for strings. Both produce the same result.",
    },
    {
      id: "reverse-hint-3",
      title: "Algorithmic guidance",
      content:
        "PHP provides strrev(), which returns the reversed version of a string — and this exercise expects exactly PHP's built-in helpers. If you prefer a loop, append each character from the last index down to zero to a new string.",
    },
  ],
  lessonReferences: [
    { lessonSlug: "data-types", label: "Data Types" },
    { lessonSlug: "loops", label: "Loops" },
    { lessonSlug: "variables", label: "Variables" },
  ],
};