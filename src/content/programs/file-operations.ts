import type { Program } from "@/lib/learning/types";

export const PROGRAM_FILE_OPERATIONS: Program = {
  id: "program-file-operations",
  slug: "file-operations",
  title: "File Operations",
  description: "Write, append, read, and delete files.",
  category: "File System",
  difficulty: "intermediate",
  problemStatement:
    "Create a text file, write an opening line, append another line, read the full contents back, and finally delete the file.",
  concepts: ["file_put_contents() with FILE_APPEND", "fopen / fread / fclose", "unlink()"],
  code: `<?php
$file = "notes.txt";

file_put_contents($file, "First line" . PHP_EOL);              // write
file_put_contents($file, "Appended line" . PHP_EOL, FILE_APPEND); // append

$handle = fopen($file, "r");
$content = fread($handle, filesize($file));
fclose($handle);

echo nl2br($content);     // newlines become <br> for HTML output

unlink($file);            // delete the file
echo "\\n(File deleted.)";`,
  expectedOutput: `First line
Appended line
(File deleted.)`,
  explanation:
    "file_put_contents() writes a string in one call; adding the FILE_APPEND flag makes it add to the end instead of overwriting. fopen() opens a low-level handle for reading, fread() pulls filesize() bytes, and fclose() releases the handle — the read/write trio every file job uses. unlink() removes the file from disk.",
  notes: [
    "Always close handles: PHP releases them at script end anyway, but explicit fclose() is good hygiene.",
    "Files are written relative to the script's working directory — confirm permissions before relying on writes.",
    "For a one-shot read/write, file_get_contents() / file_put_contents() are the simpler, safe defaults.",
  ],
};