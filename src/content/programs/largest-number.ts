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
    starterCode: `<?php

// Return the largest of three numbers.
function largest($a, $b, $c) {
    // Your logic here

    return $a; // <- replace with the correct result
}

// These values come from the Input panel.
$a = 10;
$b = 25;
$c = 15;

echo "Largest number: " . largest($a, $b, $c);`,
    inputs: [
      { name: "a", label: "First number", type: "number", value: "10", description: "The first integer to compare." },
      { name: "b", label: "Second number", type: "number", value: "25", description: "The second integer to compare." },
      { name: "c", label: "Third number", type: "number", value: "15", description: "The third integer to compare." },
    ],
  },
};