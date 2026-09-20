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
    starterCode: `<?php

// Return true when $n is prime, false otherwise.
function isPrime($n) {
    // Your logic here

    return false; // <- replace with the correct result
}

// This value comes from the Input panel.
$n = 7;

echo $n . " is " . (isPrime($n) ? "prime" : "not prime");`,
    inputs: [
      { name: "n", label: "Number", type: "number", value: "7", description: "Check whether this integer is prime." },
    ],
  },
};