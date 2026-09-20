import type { Program } from "@/lib/learning/types";

export const PROGRAM_SENTENCE_PARSER: Program = {
  id: "program-sentence-parser",
  slug: "sentence-parser",
  title: "Sentence Parser",
  description: "Count words and punctuation in a sentence.",
  category: "Strings",
  difficulty: "intermediate",
  problemStatement:
    "Analyze a sentence and report the number of words it contains and how many punctuation marks it has.",
  concepts: ["str_word_count()", "preg_match_all()", "PHP_EOL"],
  code: `<?php
$sentence = "Hello, PHP! How are you today?";

$words = str_word_count($sentence);
$punctuation = preg_match_all("/[.,!?;:]/", $sentence);

echo "Words: " . $words . PHP_EOL;
echo "Punctuation marks: " . $punctuation;

$characters = strlen($sentence);
echo PHP_EOL . "Characters: " . $characters;`,
  expectedOutput: `Words: 6
Punctuation marks: 3
Characters: 30`,
  explanation:
    "str_word_count() counts contiguous letter sequences, ignoring spaces and punctuation. A regular expression scans for the characters in the set [.,!?;:], and preg_match_all() returns how many matched. strlen() gives the raw character count including spaces and marks.",
  notes: [
    "The pattern is a character class: each of the listed characters counts once.",
    "PHP_EOL is the platform's end-of-line sequence, kept for readable CLI output.",
  ],
};