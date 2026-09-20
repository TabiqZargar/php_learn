import type { Lesson } from "@/lib/learning/types";

export const LESSON_SYNTAX: Lesson = {
  id: "lesson-syntax",
  slug: "syntax",
  title: "PHP Syntax",
  category: "basics",
  description: "Tags, statements, semicolons, and how PHP fits inside HTML.",
  order: 2,
  estimatedMinutes: 7,
  sections: [
    {
      heading: "PHP tags",
      explanation:
        "PHP parser only triggers inside delimiters. The standard tag is <?php ... ?>. There is also a shortcut echo tag <?= ... ?>, which is always available and acts just like echo.",
      code: {
        code: `<?php
echo "Full tag";      // long form
?>

<?= "Short echo tag" ?>   // shortcut, same as echo`,
        output: "Full tag Short echo tag",
      },
      notes: [
        "The short echo tag <?= always works in PHP 5.4 and later.",
        "Use <?php ... ?> for everything that is not a quick print.",
      ],
    },
    {
      heading: "Statements and semicolons",
      explanation:
        "A statement is one instruction. Statements end with a semicolon. The closing tag ?> also acts as the end of a statement, which is why the line before it does not require one.",
      code: {
        code: `<?php
echo "One";     // statement
echo "Two";     // statement
echo "Three";   // statement
?>`,
        output: "OneTwoThree",
      },
    },
    {
      heading: "Whitespace is ignored",
      explanation:
        "Newlines, spaces, and indentation are cosmetic. PHP reads the tokens, not the layout, so you are free to format code for readability.",
      code: {
        code: `<?php
echo
    "Hello";

echo "World";
?>`,
        output: "HelloWorld",
      },
    },
    {
      heading: "Case sensitivity",
      explanation:
        "Language keywords (if, else, echo), function names, and class names are case-insensitive. Variable names are case-sensitive.",
      code: {
        code: `<?php
echo "echo works";        // lower case
ECHO "ECHO also works";   // keywords ignore case

$name = "PHP";
echo $name;               // prints PHP
echo $Name;               // different variable — undefined!
?>`,
        output: "echo worksECHO also worksPHP",
      },
      notes: [
        "echo / ECHO / Echo are all the same statement.",
        "$name and $Name are two totally different variables.",
      ],
    },
    {
      heading: "Embedding PHP in HTML",
      explanation:
        "You switch freely between HTML and PHP. This is the classic way pages are authored.",
      code: {
        code: `<!DOCTYPE html>
<html>
  <body>
    <h1><?= "My PHP Page" ?></h1>
    <ul>
      <?php for ($i = 1; $i <= 3; $i++): ?>
        <li>Item <?= $i ?></li>
      <?php endfor; ?>
    </ul>
  </body>
</html>`,
        output: `<h1>My PHP Page</h1>
Item 1 / Item 2 / Item 3 as list items`,
      },
    },
  ],
};