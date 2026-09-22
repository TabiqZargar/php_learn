import type { Program } from "@/lib/learning/types";

export const PROGRAM_LARGEST_NUMBER: Program = {
  id: "program-largest-number",
  slug: "largest-number",
  title: "Largest Number",
  description: "Determine the largest of three numbers.",
  category: "Conditional Logic",
  difficulty: "beginner",
  problemStatement:
    "Write a program that reads three numbers and prints the largest of the three.",
  concepts: ["Functions", "if / else comparison", "return values"],
  code: `<?php
function largest($a, $b, $c) {
    $largest = $a;

    if ($b > $largest) {
        $largest = $b;
    }
    if ($c > $largest) {
        $largest = $c;
    }

    return $largest;
}

echo "Largest number: " . largest(12, 45, 30);
echo "\\nSmallest-case: " . largest(7, 7, 7);`,
  expectedOutput: `Largest number: 45
Smallest-case: 7`,
  explanation:
    "The function seeds the result with the first number, then compares it against each of the other two, updating the running maximum. Because every comparison is independent, the two if statements form a direct, easy-to-read solution that also works when numbers are equal.",
  notes: [
    "A running maximum is a common pattern: start with a candidate, then refine it.",
    "The solution scales to any number of inputs if you loop over them.",
  ],
practice: {
      execution: "pure",
      starterCode: `<?php

// Return the largest of three numbers.
function largest($a, $b, $c) {
    // Your logic here

    return $a; // <- replace with the correct result
}

// Inputs from the Input panel arrive as CLI arguments.
$a = (int)$argv[1];
$b = (int)$argv[2];
$c = (int)$argv[3];

echo "Largest number: " . largest($a, $b, $c);`,
    inputs: [
      { name: "a", label: "First number", type: "number", value: "10", description: "The first integer to compare." },
      { name: "b", label: "Second number", type: "number", value: "25", description: "The second integer to compare." },
      { name: "c", label: "Third number", type: "number", value: "15", description: "The third integer to compare." },
    ],
  },
  testCases: [
    {
      id: "largest-ascending",
      name: "Ascending values",
      inputs: [
        { name: "a", label: "First number", type: "number", value: "1" },
        { name: "b", label: "Second number", type: "number", value: "2" },
        { name: "c", label: "Third number", type: "number", value: "3" },
      ],
      expectedOutput: "Largest number: 3",
    },
    {
      id: "largest-middle",
      name: "Middle value wins",
      inputs: [
        { name: "a", label: "First number", type: "number", value: "10" },
        { name: "b", label: "Second number", type: "number", value: "25" },
        { name: "c", label: "Third number", type: "number", value: "15" },
      ],
      expectedOutput: "Largest number: 25",
    },
    {
      id: "largest-descending",
      name: "Descending values",
      inputs: [
        { name: "a", label: "First number", type: "number", value: "45" },
        { name: "b", label: "Second number", type: "number", value: "30" },
        { name: "c", label: "Third number", type: "number", value: "12" },
      ],
      expectedOutput: "Largest number: 45",
    },
    {
      id: "largest-negative",
      name: "Negative values",
      inputs: [
        { name: "a", label: "First number", type: "number", value: "-1" },
        { name: "b", label: "Second number", type: "number", value: "-5" },
        { name: "c", label: "Third number", type: "number", value: "-2" },
      ],
      expectedOutput: "Largest number: -1",
    },
    {
      id: "largest-tie",
      name: "All equal",
      inputs: [
        { name: "a", label: "First number", type: "number", value: "7" },
        { name: "b", label: "Second number", type: "number", value: "7" },
        { name: "c", label: "Third number", type: "number", value: "7" },
      ],
      expectedOutput: "Largest number: 7",
    },
  ],
  hints: [
    {
      id: "largest-hint-1",
      title: "Conceptual direction",
      content:
        "There is no magic shortcut: you do not rearrange the numbers, you compare them. Ask yourself what property decides that one of three values is \"the largest\".",
    },
    {
      id: "largest-hint-2",
      title: "Implementation strategy",
      content:
        "Hold a running candidate and ask one yes/no question at a time: \"is the next number bigger than the one I currently believe is largest?\" Update the candidate only when the answer is yes.",
    },
    {
      id: "largest-hint-3",
      title: "Algorithmic guidance",
      content:
        "Seed your candidate with the first number, then check each of the other two in turn with a single if. When a checked value is greater, replace the candidate. After both checks the candidate is the largest; ties work because an equal value never replaces it.",
    },
  ],
  lessonReferences: [
    { lessonSlug: "variables", label: "Variables" },
    { lessonSlug: "conditionals", label: "Conditional Statements" },
    { lessonSlug: "operators", label: "Operators" },
  ],
};