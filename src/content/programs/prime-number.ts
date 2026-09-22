import type { Program } from "@/lib/learning/types";

export const PROGRAM_PRIME_NUMBER: Program = {
  id: "program-prime-number",
  slug: "prime-number",
  title: "Prime Number",
  description: "Check whether a number is prime.",
  category: "Numbers",
  difficulty: "beginner",
  problemStatement:
    "Write a function that returns true when its argument is a prime number — divisible only by 1 and itself — and false otherwise.",
  concepts: ["Divisibility (%)", "for loops", "Early exit"],
  code: `<?php
function isPrime($n) {
    if ($n < 2) {
        return false;              // 0 and 1 are not prime
    }

    for ($i = 2; $i * $i <= $n; $i++) {
        if ($n % $i == 0) {
            return false;          // found a divisor — not prime
        }
    }

    return true;
}

$numbers = [1, 2, 7, 9, 17];

foreach ($numbers as $n) {
    echo $n . " -> " . (isPrime($n) ? "prime" : "not prime") . "\\n";
}`,
  expectedOutput: `1 -> not prime
2 -> prime
7 -> prime
9 -> not prime
17 -> prime`,
  explanation:
    "After rejecting anything below 2, the loop tests every candidate divisor up to the square root of n. If n had a divisor larger than its square root, a smaller matching divisor would already exist — so stopping at i * i <= n is enough. The first divisor found returns false immediately, saving work.",
  notes: [
    "Checking only up to the square root makes the test much faster for large numbers.",
    "The early return (exit) works because one divisor is sufficient proof.",
  ],
practice: {
      execution: "pure",
      starterCode: `<?php

// Return true when $n is prime, false otherwise.
function isPrime($n) {
    // Your logic here

    return false; // <- replace with the correct result
}

// The input from the Input panel arrives as a CLI argument.
$n = (int)$argv[1];

echo $n . " is " . (isPrime($n) ? "prime" : "not prime");`,
    inputs: [
      { name: "n", label: "Number", type: "number", value: "7", description: "Check whether this integer is prime." },
    ],
  },
  testCases: [
    {
      id: "prime-two",
      name: "Two is prime",
      inputs: [{ name: "n", label: "Number", type: "number", value: "2" }],
      expectedOutput: "2 is prime",
    },
    {
      id: "prime-seven",
      name: "Seven is prime",
      inputs: [{ name: "n", label: "Number", type: "number", value: "7" }],
      expectedOutput: "7 is prime",
    },
    {
      id: "prime-eight",
      name: "Eight is not prime",
      inputs: [{ name: "n", label: "Number", type: "number", value: "8" }],
      expectedOutput: "8 is not prime",
    },
    {
      id: "prime-one",
      name: "One is not prime",
      inputs: [{ name: "n", label: "Number", type: "number", value: "1" }],
      expectedOutput: "1 is not prime",
    },
    {
      id: "prime-seventeen",
      name: "Seventeen is prime",
      inputs: [{ name: "n", label: "Number", type: "number", value: "17" }],
      expectedOutput: "17 is prime",
    },
  ],
  hints: [
    {
      id: "prime-hint-1",
      title: "Conceptual direction",
      content:
        "A prime has exactly two divisors: 1 and itself. To show a number is NOT prime you only need to find one other divisor — so this problem is really a search for a single counter-example.",
    },
    {
      id: "prime-hint-2",
      title: "Implementation strategy",
      content:
        "Test candidate divisors one by one and stop at the first hit. A division that leaves a remainder of 0 is your clue that a divisor was found; if you reach the end without finding any, the number is prime.",
    },
    {
      id: "prime-hint-3",
      title: "Algorithmic guidance",
      content:
        "Reject anything below 2 as not prime immediately. Then try each whole divisor starting at 2; the moment one divides n evenly, return false, and if no divisor is found, return true. You may stop testing after the divisor pairs with itself exceed n, because any larger divisor would pair with a smaller one you already checked.",
    },
  ],
  lessonReferences: [
    { lessonSlug: "conditionals", label: "Conditional Statements" },
    { lessonSlug: "loops", label: "Loops" },
    { lessonSlug: "operators", label: "Operators" },
  ],
};