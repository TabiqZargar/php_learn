import type { Program } from "@/lib/learning/types";

export const PROGRAM_LOWERCASE_STRING: Program = {
  id: "program-lowercase-string",
  slug: "lowercase-string",
  title: "Lowercase a String",
  description: "Detect and convert uppercase letters to lowercase.",
  category: "Strings",
  difficulty: "beginner",
  problemStatement:
    "Check whether a string is written entirely in lowercase; if it is not, convert it to lowercase and report the transformation.",
  concepts: ["strtolower()", "Comparison", "String functions"],
  code: `<?php
function toLowercase($text) {
    $lower = strtolower($text);

    if ($lower === $text) {
        echo "The string is already lowercase: $text";
    } else {
        echo "Converted '$text' to lowercase: $lower";
    }
}

toLowercase("php academy");
toLowercase("PHP Academy!");`,
  expectedOutput: `The string is already lowercase: php academy
Converted 'PHP Academy!' to lowercase: php academy!`,
  explanation:
    "strtolower() returns a fully lowercase copy of the string. Comparing that copy with the original with the strict operator === tells us whether any uppercase letters existed. If the values differ, we know a conversion happened, and the lowercase version becomes the result.",
  notes: [
    "=== treats 'PHP' and 'php' as different strings; == would too for strings, but === is the explicit choice here.",
    "strtoupper() is the mirrored function for the reverse operation.",
  ],
practice: {
      starterCode: `<?php

// Return a lowercase copy of $text.
function toLowercase($text) {
    // Your logic here

    return $text; // <- replace with the correct result
}

// The input from the Input panel arrives as a CLI argument.
$text = $argv[1];

echo "Converted: " . toLowercase($text);`,
    inputs: [
      { name: "text", label: "Text", type: "text", value: "PHP Academy!", description: "The string to convert to lowercase." },
    ],
  },
  testCases: [
    {
      id: "lowercase-already",
      name: "Already lowercase",
      inputs: [{ name: "text", label: "Text", type: "text", value: "hello" }],
      expectedOutput: "Converted: hello",
    },
    {
      id: "lowercase-single-capital",
      name: "Single capital letter",
      inputs: [{ name: "text", label: "Text", type: "text", value: "Hello" }],
      expectedOutput: "Converted: hello",
    },
    {
      id: "lowercase-phrase",
      name: "Lowercase phrase",
      inputs: [{ name: "text", label: "Text", type: "text", value: "php academy" }],
      expectedOutput: "Converted: php academy",
    },
    {
      id: "lowercase-mixed-symbol",
      name: "Mixed case and symbols",
      inputs: [{ name: "text", label: "Text", type: "text", value: "PHP Academy!" }],
      expectedOutput: "Converted: php academy!",
    },
  ],
};