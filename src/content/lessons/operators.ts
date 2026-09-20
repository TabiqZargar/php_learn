import type { Lesson } from "@/lib/learning/types";

export const LESSON_OPERATORS: Lesson = {
  id: "lesson-operators",
  slug: "operators",
  title: "Operators",
  category: "basics",
  description: "Arithmetic, comparison, logical, and assignment operators.",
  order: 5,
  estimatedMinutes: 8,
  sections: [
    {
      heading: "Arithmetic operators",
      explanation:
        "The same operators you know from math, plus modulo (%) for remainders and a power operator (**) added in PHP 5.6.",
      code: {
        code: `<?php
echo 7 + 3;    // 10
echo 7 - 3;    // 4
echo 7 * 3;    // 21
echo 7 / 2;    // 3.5
echo 7 % 2;    // 1  (remainder)
echo 2 ** 3;   // 8  (power)`,
        output: "104213.518",
      },
    },
    {
      heading: "Comparison operators",
      explanation:
        "Comparisons return booleans. The strict versions (===, !==) also check the type, which prevents many subtle bugs.",
      code: {
        code: `<?php
var_dump(5 > 3);      // bool(true)
var_dump(5 <= 4);     // bool(false)
var_dump("a" == "a"); // bool(true)

var_dump(0 == false);    // bool(true)    loose — types ignored
var_dump(0 === false);   // bool(false)   strict

var_dump(2 <=> 1);       // int(1)  spaceship: -1 / 0 / 1`,
        output: "bool(true)bool(false)bool(true)bool(true)bool(false)int(1)",
      },
      notes: [
        "<=> returns -1, 0, or 1 — handy for sorting callbacks.",
        "Use === unless you explicitly want loose comparison.",
      ],
    },
    {
      heading: "Logical operators",
      explanation:
        "Combine conditions with and, or, and not. && and || are the classic symbols; the words and/or are lower-precedence alternatives.",
      code: {
        code: `<?php
$age = 20;
$hasTicket = true;

if ($age >= 18 && $hasTicket) {
    echo "Entry allowed";
}

if (!$hasTicket) {
    echo "No entry";
}`,
        output: "Entry allowed",
      },
    },
    {
      heading: "Assignment operators",
      explanation:
        "A shorthand that applies an operation and assigns the result in one step. The . and -= family works for strings too.",
      code: {
        code: `<?php
$total = 10;
$total += 5;       // 15
$total -= 3;       // 12
$total *= 2;       // 24
$total /= 6;       // 4

$message = "Hello";
$message .= " World";   // "Hello World"

echo $total;
echo $message;`,
        output: "4Hello World",
      },
      notes: [".= appends text; += on a string would fail, use .= instead."],
    },
    {
      heading: "Increment and decrement",
      explanation:
        "++ and -- tick a number by one. Placed before the variable they change it first, then return it; after the variable they return it first, then change it.",
      code: {
        code: `<?php
$n = 5;
echo ++$n;   // 6  (incremented before use)
echo $n++;   // 6  (returned before increment — now 7)
echo $n;     // 7`,
        output: "667",
      },
      notes: ["$n++ is the classic counter idiom in for loops."],
    },
  ],
};