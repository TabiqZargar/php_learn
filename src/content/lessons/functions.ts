import type { Lesson } from "@/lib/learning/types";

export const LESSON_FUNCTIONS: Lesson = {
  id: "lesson-functions",
  slug: "functions",
  title: "Functions",
  category: "basics",
  description: "Reusable blocks of code with parameters and return values.",
  order: 8,
  estimatedMinutes: 10,
  sections: [
    {
      heading: "Defining and calling",
      explanation:
        "A function is a named block that runs when called. Define it once with function and the code after it, then call it by name.",
      code: {
        code: `<?php
function greet() {
    echo "Hello from PHP";
}

greet();   // call it
greet();   // and again`,
        output: "Hello from PHPHello from PHP",
      },
    },
    {
      heading: "Parameters and arguments",
      explanation:
        "Parameters are the placeholders in the definition; arguments are the real values you pass in. You can give parameters defaults so they can be omitted.",
      code: {
        code: `<?php
function greet($name, $title = "Student") {
    echo "Hello, $title $name!";
}

greet("Tabiq");              // uses default title
greet("Sara", "Instructor"); // overrides it`,
        output: "Hello, Student Tabiq!Hello, Instructor Sara!",
      },
    },
    {
      heading: "Return values",
      explanation:
        "return hands a value back to the caller, where it can be used or stored. Returning ends the function immediately.",
      code: {
        code: `<?php
function double($n) {
    return $n * 2;
}

$result = double(21);
echo $result;      // 42
echo double(5) + double(10);   // 10 + 20`,
        output: "4230",
      },
      notes: ["A function without return returns null."],
    },
    {
      heading: "Variable scope",
      explanation:
        "Variables created inside a function are local — invisible outside it, and the function cannot see your outer variables unless you pass them in as arguments.",
      code: {
        code: `<?php
$name = "Global";

function scopeDemo() {
    $name = "Local";      // this is a DIFFERENT variable
    $temp = "Secret";
    return $name;
}

echo scopeDemo();     // Local
echo $name;           // Global (outer untouched)
echo $temp;           // undefined — out of scope`,
        output: "LocalGlobal",
      },
      notes: [
        "Arguments travel in one direction: values in, results out.",
        "Avoid the global keyword — it makes code hard to follow.",
      ],
    },
    {
      heading: "Type declarations",
      explanation:
        "PHP 7+ lets you declare parameter and return types. The engine enforces them — passing the wrong type throws a TypeError.",
      code: {
        code: `<?php
function area(float $width, float $height): float {
    return $width * $height;
}

echo area(4.5, 2.0);   // returns a float

function maxOf(int $a, int $b): int {
    return $a > $b ? $a : $b;
}

echo maxOf(8, 3);      // 8`,
        output: "98",
      },
      notes: [
        "Strict types can be forced per-file with declare(strict_types=1);.",
        "Types make bugs obvious early and document the intent.",
      ],
    },
  ],
};