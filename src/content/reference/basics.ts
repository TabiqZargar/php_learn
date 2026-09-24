import type { ReferenceEntry } from "@/lib/reference/types";

/**
 * Language-level fundamentals. All snippets are read-only examples; they are
 * NOT executed by the reference UI.
 */
export const REFERENCE_ENTRIES_BASICS: readonly ReferenceEntry[] = [
  {
    id: "php-tags",
    name: "PHP tags",
    categoryId: "basics",
    summary: "PHP code lives inside <?php ... ?> blocks.",
    signature: "<?php ... ?>",
    description:
      "A PHP file normally mixes HTML with PHP. Everything inside an opening <?php tag and its closing ?> is run by the PHP engine; anything outside is handed straight to the browser.",
    examples: [
      {
        code: `<?php
echo "Hello from PHP";
?>`,
        output: "Hello from PHP",
      },
    ],
    notes: [
      "Files containing only PHP should skip the closing ?> tag to avoid stray whitespace.",
      "The short echo tag <?= ... ?> is short for <?php echo ... ?>.",
    ],
  },
  {
    id: "echo",
    name: "echo",
    categoryId: "basics",
    summary: "Outputs one or more values to the page.",
    signature: "echo expression [, expression ...]",
    description:
      "echo is a language construct, not a function, so no parentheses are required. It prints strings, numbers and other scalar values to the output.",
    examples: [
      {
        code: `<?php
echo "Hello";
echo "World";
echo "A", "B", "C";
echo 5 + 3;`,
        output: "HelloWorldABC8",
      },
    ],
    keywords: ["print output", "write"],
    notes: ["echo returns no value, so it cannot be used in an expression."],
  },
  {
    id: "print",
    name: "print",
    categoryId: "basics",
    summary: "Outputs a single value and returns 1.",
    signature: "print expression",
    description:
      "print behaves like echo but accepts exactly one argument and always returns the integer 1, which makes it the only output construct that can be used inside an expression.",
    examples: [
      {
        code: `<?php
print "Hi there";
$result = print "X";
echo "\\nResult: " . $result;`,
        output: "Hi thereX\nResult: 1",
      },
    ],
    keywords: ["output one value", "returns 1"],
    notes: ["Most code uses echo for brevity; print is equivalent in practice."],
  },
  {
    id: "comments",
    name: "Comments",
    categoryId: "basics",
    summary: "Notes PHP ignores — single-line and block forms.",
    signature: "// line  |  # line  |  /* block */",
    description:
      "Comments are stripped by the parser and never sent to the browser. Use them to explain why code exists, not to repeat what it does.",
    examples: [
      {
        code: `<?php
// single-line comment
# also a single-line comment
/* block comment
   spanning lines */
echo "Only I am printed";`,
        output: "Only I am printed",
      },
    ],
    keywords: ["//", "/*", "#", "documentation"],
  },
];