import type { Lesson } from "@/lib/learning/types";

export const LESSON_PHP_INTRODUCTION: Lesson = {
  id: "lesson-php-introduction",
  slug: "php-introduction",
  title: "PHP Introduction",
  category: "basics",
  description: "What PHP is, why it exists, and how it powers websites.",
  order: 1,
  estimatedMinutes: 8,
  sections: [
    {
      heading: "What is PHP?",
      explanation:
        "PHP (PHP: Hypertext Preprocessor) is a scripting language designed for the web.\n\nUnlike JavaScript which runs in the browser, PHP runs on the web server. When someone requests a web page, the server executes the PHP code and sends the resulting HTML back to the visitor's browser.",
      notes: [
        "PHP is interpreted — no separate compile step.",
        "PHP code is embedded inside HTML files, not separate from them.",
        "Created by Rasmus Lerdorf in 1994; PHP 8 is the current major version.",
      ],
    },
    {
      heading: "Server-side scripting",
      explanation:
        "Because PHP runs on the server, the visitor never sees your source code — only the output it produces. That makes PHP a natural fit for anything involving databases, sessions, cookies, and user authentication.",
      code: {
        code: `<!-- This is what YOU write -->
<p>Hello, <?php echo "PHP Academy"; ?>!</p>

<!-- This is what the BROWSER receives -->
<p>Hello, PHP Academy!</p>`,
        output: "Hello, PHP Academy!",
      },
      notes: [
        "The browser only ever receives the generated output.",
        "You can mix plain HTML and PHP in the same file.",
      ],
    },
    {
      heading: "Where PHP runs",
      explanation:
        "To run PHP locally you need the PHP interpreter and, typically, a web server. Common local setups are XAMPP, Laragon, or WAMP on Windows. The interpreter processes any file whose code sits between the opening tag <?php and the closing tag ?>.",
    },
    {
      heading: "Your first PHP file",
      explanation:
        "Save the following as index.php. The opening tag tells the interpreter to start executing; text outside the tags is passed through untouched.",
      code: {
        code: `<?php
echo "Hello, PHP Academy!";
?>`,
        output: "Hello, PHP Academy!",
      },
      notes: [
        "echo sends text to the output.",
        "The trailing ?> is optional at the end of a file and is often omitted.",
        "Every statement ends with a semicolon.",
      ],
    },
    {
      heading: "Comments",
      explanation:
        "Comments are ignored by the interpreter. Use them to explain what your code does.",
      code: {
        code: `<?php
// Single-line comment
# Another single-line comment

/*
 * Multi-line comment.
 * Useful for longer notes.
 */

echo "Learning PHP"; // Comments can trail code too
?>`,
        output: "Learning PHP",
      },
    },
  ],
};