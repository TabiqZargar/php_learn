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
};