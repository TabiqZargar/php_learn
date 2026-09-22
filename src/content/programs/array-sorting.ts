import type { Program } from "@/lib/learning/types";

export const PROGRAM_ARRAY_SORTING: Program = {
  id: "program-array-sorting",
  slug: "array-sorting",
  title: "Array Sorting",
  description: "Sort a list of numbers from smallest to largest.",
  category: "Arrays",
  difficulty: "beginner",
  problemStatement:
    "Take an unsorted array of integers and print them in ascending order.",
  concepts: ["sort()", "foreach", "Array mutation"],
  code: `<?php
$numbers = [4, 2, 8, 1, 3, 6];

sort($numbers);

echo "Ascending: ";
foreach ($numbers as $number) {
    echo $number . " ";
}

rsort($numbers);
echo "\\nDescending: ";
echo implode(" ", $numbers);`,
  expectedOutput: `Ascending: 1 2 3 4 6 8
Descending: 8 6 4 3 2 1`,
  explanation:
    "sort() reorders the array in place — no new array is returned — producing ascending order. foreach then walks the sorted result for printing. rsort() mirrors the operation for descending order, and implode() joins the values with spaces so the second line does not need a loop.",
  notes: [
    "sort() keeps integer keys, which is why a numeric-list foreach reads cleanly.",
    "For associative arrays use asort()/arsort() to keep key-value pairs intact.",
  ],
practice: {
      execution: "pure",
      starterCode: `<?php

// Return the array sorted in ascending order.
function sortNumbers($numbers) {
    // Your logic here

    return $numbers; // <- replace with the correct result
}

// The input from the Input panel arrives as a CLI argument.
// It is JSON like [4, 2, 8, 1, 3, 6]; json_decode turns it into an array.
$numbers = json_decode($argv[1], true);

echo "Sorted: " . implode(" ", sortNumbers($numbers));`,
    inputs: [
      { name: "numbers", label: "Numbers", type: "text", value: "[4, 2, 8, 1, 3, 6]", description: "Array as comma-separated values, e.g. [4, 2, 8, 1, 3, 6]." },
    ],
  },
  testCases: [
    {
      id: "sort-unsorted",
      name: "Unsorted list",
      inputs: [{ name: "numbers", label: "Numbers", type: "text", value: "[3, 1, 2]" }],
      expectedOutput: "Sorted: 1 2 3",
    },
    {
      id: "sort-duplicates",
      name: "Duplicates stay",
      inputs: [{ name: "numbers", label: "Numbers", type: "text", value: "[5, 5, 1]" }],
      expectedOutput: "Sorted: 1 5 5",
    },
    {
      id: "sort-negative",
      name: "Negative values",
      inputs: [{ name: "numbers", label: "Numbers", type: "text", value: "[-2, 4, 0]" }],
      expectedOutput: "Sorted: -2 0 4",
    },
    {
      id: "sort-longer",
      name: "Longer list",
      inputs: [{ name: "numbers", label: "Numbers", type: "text", value: "[13, 7, 21, 4]" }],
      expectedOutput: "Sorted: 4 7 13 21",
    },
  ],
  hints: [
    {
      id: "sort-hint-1",
      title: "Conceptual direction",
      content:
        "Sorting puts the values in ascending order: the smallest comes first and the largest last. Sorting never drops or duplicates values — the same set of numbers must come back out.",
    },
    {
      id: "sort-hint-2",
      title: "Implementation strategy",
      content:
        "PHP has built-in functions that reorder an array for you. The tricky part is that they work in place: they change the array you pass and do NOT hand back a brand-new sorted array.",
    },
    {
      id: "sort-hint-3",
      title: "Algorithmic guidance",
      content:
        "Call sort() on the array argument, then return that same array. The sort() return value is only true/false for success, so build your return on the array variable itself, not on the call's result.",
    },
  ],
  lessonReferences: [
    { lessonSlug: "data-types", label: "Data Types" },
    { lessonSlug: "functions", label: "Functions" },
  ],
};