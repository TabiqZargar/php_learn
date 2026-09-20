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
};