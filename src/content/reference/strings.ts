import type { ReferenceEntry } from "@/lib/reference/types";

/**
 * Common string functions. All snippets are read-only examples; they are NOT
 * executed by the reference UI.
 */
export const REFERENCE_ENTRIES_STRINGS: readonly ReferenceEntry[] = [
  {
    id: "strlen",
    name: "strlen()",
    categoryId: "strings",
    summary: "Number of bytes in a string (characters for ASCII).",
    signature: "strlen(string $string): int",
    description:
      "strlen returns the length in bytes. For multi-byte text (UTF-8) use mb_strlen instead, because a single character can occupy several bytes.",
    examples: [
      {
        code: `<?php
echo strlen("hello");
echo " " . strlen("PHP");`,
        output: "5 3",
      },
    ],
    keywords: ["length", "size", "count characters", "bytes"],
  },
  {
    id: "strtolower",
    name: "strtolower()",
    categoryId: "strings",
    summary: "Convert a string to lowercase.",
    signature: "strtolower(string $string): string",
    description:
      "Returns a copy with every uppercase ASCII letter lowered. Non-letters are untouched. Use mb_strtolower for UTF-8 text.",
    examples: [
      {
        code: `<?php
echo strtolower("PhP AcAdEmY");`,
        output: "php academy",
      },
    ],
    keywords: ["lower", "case-insensitive", "casefold", "normalize"],
  },
  {
    id: "strtoupper",
    name: "strtoupper()",
    categoryId: "strings",
    summary: "Convert a string to uppercase.",
    signature: "strtoupper(string $string): string",
    description: "mirrors strtolower: every ASCII letter becomes uppercase.",
    examples: [
      {
        code: `<?php
echo strtoupper("php academy");`,
        output: "PHP ACADEMY",
      },
    ],
    keywords: ["upper", "capitalize", "uppercase", "case"],
  },
  {
    id: "trim",
    name: "trim()",
    categoryId: "strings",
    summary: "Strip whitespace from the start and end.",
    signature: "trim(string $string, string $characters = \" \\n\\r\\t\\v\\0\"): string",
    description:
      "Removes leading and trailing whitespace by default. ltrim strips only the left, rtrim only the right, and the optional second argument lets you strip custom characters.",
    examples: [
      {
        code: `<?php
echo trim("  hello  ");
echo "|" . trim("===hi===", "=") . "|";`,
        output: "hello|hi|",
      },
    ],
    keywords: ["whitespace", "strip", "ltrim", "rtrim", "space", "pad"],
  },
  {
    id: "str_replace",
    name: "str_replace()",
    categoryId: "strings",
    summary: "Replace occurrences of a substring.",
    signature: "str_replace(string|array $search, string|array $replace, string|array $subject): string|array",
    description:
      "Replaces every occurrence of search inside subject. All three arguments may be arrays so several replacements happen in one call. Case-sensitive; use str_ireplace for case-insensitive.",
    examples: [
      {
        code: `<?php
echo str_replace("day", "night", "Good day, fellow day");`,
        output: "Good night, fellow night",
      },
    ],
    keywords: ["replace", "substitute", "find", "swap", "str_ireplace"],
  },
  {
    id: "substr",
    name: "substr()",
    categoryId: "strings",
    summary: "Extract part of a string.",
    signature: "substr(string $string, int $offset, ?int $length = null): string",
    description:
      "Returns the portion starting at offset (negative counts from the end). Without length it goes to the end; a negative length stops that many characters from the end.",
    examples: [
      {
        code: `<?php
echo substr("Hello, world", 0, 5);
echo " " . substr("Hello, world", 7);
echo " " . substr("Hello, world", -5);`,
        output: "Hello world world",
      },
    ],
    keywords: ["slice", "substring", "cut", "portion", "extract"],
  },
  {
    id: "strpos",
    name: "strpos()",
    categoryId: "strings",
    summary: "Find the position of a substring, or false.",
    signature: "strpos(string $haystack, string $needle, int $offset = 0): int|false",
    description:
      "Returns the zero-based index where needle first appears, or false. Always compare the result with === because position 0 is falsy. Use str_contains (PHP 8+) for a simple boolean check.",
    examples: [
      {
        code: `<?php
$pos = strpos("Hello, world", "world");
if ($pos !== false) {
    echo "Found at $pos";
}
echo " " . (str_contains("Hello", "ell") ? "yes" : "no");`,
        output: "Found at 7 yes",
      },
    ],
    keywords: ["find", "index", "search", "contains", "position", "needle"],
  },
  {
    id: "substr-count",
    name: "substr_count()",
    categoryId: "strings",
    summary: "How many times a substring appears.",
    signature: "substr_count(string $haystack, string $needle): int",
    description: "Counts non-overlapping occurrences of needle in haystack.",
    examples: [
      {
        code: `<?php
echo substr_count("php php php", "php");`,
        output: "3",
      },
    ],
    keywords: ["count", "occurrences", "frequency", "times"],
  },
  {
    id: "explode",
    name: "explode()",
    categoryId: "strings",
    summary: "Split a string into an array by a separator.",
    signature: "explode(string $separator, string $string, int $limit = PHP_INT_MAX): array",
    description:
      "Turns a delimited string into an array. A positive limit caps the number of pieces (extra delimiters stay in the last piece); negative removes trailing empty pieces.",
    examples: [
      {
        code: `<?php
$parts = explode(",", "apple,banana,cherry");
echo $parts[1];
echo " " . count($parts);`,
        output: "banana 3",
      },
    ],
    keywords: ["split", "csv", "delimiter", "tokenize", "parts"],
  },
  {
    id: "implode",
    name: "implode()",
    categoryId: "strings",
    summary: "Join array elements into a string.",
    signature: "implode(string $separator, array $array): string",
    description: "The reverse of explode: glue the values of an array together with a separator.",
    examples: [
      {
        code: `<?php
$tags = ["php", "mysql", "php8"];
echo implode(", ", $tags);`,
        output: "php, mysql, php8",
      },
    ],
    keywords: ["join", "glue", "concatenate array", "separator"],
  },
];
