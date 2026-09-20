import type { Lesson } from "@/lib/learning/types";

export const LESSON_LOOPS: Lesson = {
  id: "lesson-loops",
  slug: "loops",
  title: "Loops",
  category: "basics",
  description: "Repeating work with for, while, foreach, and do-while.",
  order: 7,
  estimatedMinutes: 9,
  sections: [
    {
      heading: "for loops",
      explanation:
        "Use for when you know how many times to repeat. The three parts — start, condition, step — are defined up front.",
      code: {
        code: `<?php
for ($i = 1; $i <= 5; $i++) {
    echo $i . " ";
}`,
        output: "1 2 3 4 5",
      },
    },
    {
      heading: "while loops",
      explanation:
        "The while loop re-checks the condition before every iteration and runs while it is truthy. Guard against an infinite loop by changing the condition inside.",
      code: {
        code: `<?php
$guess = 0;

while ($guess < 3) {
    $guess++;
    echo "Attempt " . $guess . "\\n";
}`,
        output: "Attempt 1\nAttempt 2\nAttempt 3",
      },
      notes: [
        "while is ideal when the number of repeats is unknown in advance.",
        "\\n in double quotes is a newline; in single quotes it is literal backslash-n.",
      ],
    },
    {
      heading: "do-while loops",
      explanation:
        "A do-while runs its body first and checks the condition after. The body therefore always executes at least once.",
      code: {
        code: `<?php
$count = 1;

do {
    echo "Run " . $count;
    $count++;
} while ($count <= 3);`,
        output: "Run 1Run 2Run 3",
      },
      notes: ["Same as while, except the condition is tested at the end."],
    },
    {
      heading: "foreach loops",
      explanation:
        "foreach iterates arrays without a counter. Use it for almost all array work: it is safer and easier to read than a manual index loop.",
      code: {
        code: `<?php
$scores = ["Math" => 85, "Science" => 92, "Art" => 78];

foreach ($scores as $subject => $score) {
    echo $subject . ": " . $score . "\\n";
}`,
        output: "Math: 85\nScience: 92\nArt: 78",
      },
      notes: [
        "$subject holds each key; $score holds each value.",
        "foreach loops over a copy — to mutate values use &$score.",
      ],
    },
    {
      heading: "break and continue",
      explanation:
        "break exits the loop immediately. continue skips to the next iteration. Both accept a numeric argument to affect outer loops.",
      code: {
        code: `<?php
for ($i = 1; $i <= 10; $i++) {
    if ($i % 2 === 0) {
        continue;   // skip even numbers
    }
    if ($i > 7) {
        break;      // stop after 7
    }
    echo $i . " ";
}`,
        output: "1 3 5 7",
      },
    },
  ],
};