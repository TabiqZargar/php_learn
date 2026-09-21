import type { Program } from "@/lib/learning/types";

export const PROGRAM_FACTORIAL: Program = {
  id: "program-factorial",
  slug: "factorial",
  title: "Factorial",
  description: "Compute n! using a loop and a recursive function.",
  category: "Numbers",
  difficulty: "beginner",
  problemStatement:
    "Compute the factorial of a non-negative integer n (n! = n × (n-1) × ... × 1, with 0! defined as 1).",
  concepts: ["Loops", "Recursion", "Base cases"],
  code: `<?php
function factorialLoop($n) {
    $result = 1;
    for ($i = 2; $i <= $n; $i++) {
        $result *= $i;
    }
    return $result;
}

function factorialRec($n) {
    if ($n <= 1) {
        return 1;                 // base case
    }
    return $n * factorialRec($n - 1);  // recursive step
}

echo "Loop:     " . factorialLoop(5);
echo "\\nRecursive: " . factorialRec(5);`,
  expectedOutput: `Loop:     120
Recursive: 120`,
  explanation:
    "The loop version multiplies 2 through n into an accumulator. The recursive version solves the problem by redefining it: n! is n times (n-1)!. The base case stops the recursion when the input can be answered directly. Both approaches produce 120 for 5 (5 × 4 × 3 × 2 × 1).",
  notes: [
    "Any recursive function needs a base case, or it recurses forever.",
    "For very large n the integer overflows; PHP promotes to float when needed.",
  ],
practice: {
      starterCode: `<?php

// Return $n! where 0! and 1! are both 1.
function factorial($n) {
    // Your logic here

    return 1; // <- replace with the correct result
}

// The input from the Input panel arrives as a CLI argument.
$n = (int)$argv[1];

echo "Factorial: " . factorial($n);`,
    inputs: [
      { name: "n", label: "Number", type: "number", value: "5", description: "Compute the factorial of this integer." },
    ],
  },
  testCases: [
    {
      id: "factorial-zero",
      name: "Zero (0! = 1)",
      inputs: [{ name: "n", label: "Number", type: "number", value: "0" }],
      expectedOutput: "Factorial: 1",
    },
    {
      id: "factorial-one",
      name: "One (1! = 1)",
      inputs: [{ name: "n", label: "Number", type: "number", value: "1" }],
      expectedOutput: "Factorial: 1",
    },
    {
      id: "factorial-three",
      name: "Three (3! = 6)",
      inputs: [{ name: "n", label: "Number", type: "number", value: "3" }],
      expectedOutput: "Factorial: 6",
    },
    {
      id: "factorial-five",
      name: "Five (5! = 120)",
      inputs: [{ name: "n", label: "Number", type: "number", value: "5" }],
      expectedOutput: "Factorial: 120",
    },
    {
      id: "factorial-ten",
      name: "Ten (10! = 3628800)",
      inputs: [{ name: "n", label: "Number", type: "number", value: "10" }],
      expectedOutput: "Factorial: 3628800",
    },
  ],
};