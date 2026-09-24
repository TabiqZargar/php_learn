import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_ARRAYS: readonly ReferenceEntry[] = [
  {
    id: "count",
    name: "count()",
    categoryId: "arrays",
    summary: "How many elements an array has.",
    signature: "count(array|Countable $value): int",
    description:
      "count returns the number of items in the array. With the optional second flag COUNT_RECURSIVE it counts items inside nested arrays too.",
    examples: [
      {
        code: `<?php
$fruits = ["apple", "banana", "cherry"];
echo count($fruits);`,
        output: "3",
      },
    ],
    keywords: ["size", "length", "elements", "length of array", "total"],
  },
  {
    id: "array_push",
    name: "array_push()",
    categoryId: "arrays",
    summary: "Add one or more values to the end of an array.",
    signature: "array_push(array &$array, mixed ...$values): int",
    description:
      "Appends values to the array and returns the new element count. The array is modified in place via the reference parameter.",
    examples: [
      {
        code: `<?php
$queue = [];
array_push($queue, "first", "second");
echo implode(",", $queue);`,
        output: "first,second",
      },
    ],
    keywords: ["append", "add to end", "stack", "enqueue", "tail"],
  },
  {
    id: "array_pop",
    name: "array_pop()",
    categoryId: "arrays",
    summary: "Remove and return the LAST element.",
    signature: "array_pop(array &$array): mixed",
    description:
      "Pops the final element off the array, shortening it by one, and returns that value. Useful for stack-like behavior.",
    examples: [
      {
        code: `<?php
$stack = [1, 2, 3];
$last = array_pop($stack);
echo $last . ";" . implode(",", $stack);`,
        output: "3;1,2",
      },
    ],
    keywords: ["last", "LIFO", "remove end", "unshift pop", "stack top"],
  },
  {
    id: "array_shift",
    name: "array_shift()",
    categoryId: "arrays",
    summary: "Remove and return the FIRST element.",
    signature: "array_shift(array &$array): mixed",
    description:
      "Shifts the first element off the front, re-indexes numeric keys, and returns the removed value. The complement of array_pop.",
    examples: [
      {
        code: `<?php
$queue = ["first", "second"];
$first = array_shift($queue);
echo $first . ";" . implode(",", $queue);`,
        output: "first;second",
      },
    ],
    keywords: ["front", "FIFO", "remove first", "dequeue", "head"],
  },
  {
    id: "array_merge",
    name: "array_merge()",
    categoryId: "arrays",
    summary: "Combine two or more arrays into one.",
    signature: "array_merge(array ...$arrays): array",
    description:
      "Joins arrays into a single array. String keys in later arrays overwrite earlier ones; numeric keys are appended re-indexed so nothing is overwritten.",
    examples: [
      {
        code: `<?php
$a = ["a", "b"];
$b = ["c"];
echo implode(",", array_merge($a, $b));`,
        output: "a,b,c",
      },
    ],
    keywords: ["combine", "union", "join arrays", "concat arrays", "merge"],
  },
  {
    id: "in_array",
    name: "in_array()",
    categoryId: "arrays",
    summary: "Is a value present in the array?",
    signature: "in_array(mixed $needle, array $haystack, bool $strict = false): bool",
    description:
      "Returns true when the needle value exists in the array. With strict set to true it requires identical type too. Useful for whitelists and a quick membership check.",
    examples: [
      {
        code: `<?php
$allowed = ["admin", "editor", "viewer"];
echo in_array("editor", $allowed) ? "allowed" : "denied";`,
        output: "allowed",
      },
    ],
    keywords: ["contains", "membership", "find value", "lookup", "search array"],
  },
  {
    id: "sort",
    name: "sort()",
    categoryId: "arrays",
    summary: "Sort values ascending, in place.",
    signature: "sort(array &$array, int $flags = SORT_REGULAR): true",
    description: "Sorts the array values in place by default, lowest to highest, discarding the keys.",
    examples: [
      {
        code: `<?php
$nums = [5, 1, 3];
sort($nums);
echo implode(",", $nums);`,
        output: "1,3,5",
      },
    ],
    keywords: ["order", "ascending", "reorder", "numbers order", "lowest to highest"],
  },
  {
    id: "foreach-array",
    name: "foreach over arrays",
    categoryId: "arrays",
    summary: "Visit every element of an array.",
    signature: "foreach ($array as $item)   |   foreach ($array as $key => $value)",
    description:
      "foreach automatically walks every element. The two-value form gives you the key (index or string key) alongside each value.",
    examples: [
      {
        code: `<?php
$stock = ["php" => 3, "mysql" => 2];
foreach ($stock as $topic => $qty) {
    echo $topic . "=" . $qty . " ";
}`,
        output: "php=3 mysql=2 ",
      },
    ],
    keywords: ["iterate", "each", "loop through array", "walk array", "for each element"],
  },
];
