import type { Lesson } from "@/lib/learning/types";

export const LESSON_FILESYSTEM: Lesson = {
  id: "lesson-filesystem",
  slug: "filesystem",
  title: "Files & the Filesystem",
  category: "basics",
  description: "Create, read, append to, and delete files on disk.",
  order: 11,
  estimatedMinutes: 12,
  sections: [
    {
      heading: "Opening a file",
      explanation:
        "PHP talks to files through a handle returned by fopen. The second argument is the mode: w creates or truncates the file for writing, r opens an existing file for reading, and a opens for appending — data written with append joins the existing contents instead of replacing them. After finishing, fclose releases the handle so later code in the same request can re-open or delete the file.",
      code: {
        code: `<?php
$file = __DIR__ . "/academy.txt";
$handle = fopen($file, "w");   // create (or truncate) the file
fclose($handle);               // release the handle
echo file_exists($file) ? "File created." : "Missing.";`,
        output: "File created.",
      },
      notes: [
        "A safer pattern is __DIR__ plus a file name, so the file lands next to the script and never depends on the caller's working directory.",
        "Mode w destroys whatever the file held before; mode a never touches existing contents.",
      ],
    },
    {
      heading: "Writing and closing",
      explanation:
        "fwrite writes a string through an open handle. In write mode the file is created on first write, so you do not need a separate create step. Always close the handle with fclose — PHP flushes buffered data and releases the file for other operations such as reading or deleting.",
      code: {
        code: `<?php
$file = __DIR__ . "/academy.txt";
$handle = fopen($file, "w");
fwrite($handle, "Welcome to PHP!");
fclose($handle);
echo "Saved " . filesize($file) . " bytes.";`,
        output: "Saved 15 bytes.",
      },
      notes: [
        "fopen with w fails if the directory is not writable — inside the practice workspace it always is.",
        "Check the return value of fopen before writing in real code; false means the open failed.",
      ],
    },
    {
      heading: "Reading a file back",
      explanation:
        "To read, open in mode r and pull the contents with fread, passing the number of bytes to read. filesize returns that number, so reading a whole small file is one fread call. Close the handle as soon as you are done reading.",
      code: {
        code: `<?php
$file = __DIR__ . "/academy.txt";
$handle = fopen($file, "r");
$contents = fread($handle, filesize($file));
fclose($handle);
echo $contents;`,
        output: "Welcome to PHP!",
      },
      notes: [
        "fread only reads what you ask for — size it with filesize for a full read.",
        "For larger files a loop or file_get_contents is usually simpler; this lesson sticks to the fopen trio.",
      ],
    },
    {
      heading: "Appending",
      explanation:
        "Mode a opens the file for append: the pointer starts at the end, so whatever you write is added after the existing contents. Append is how logs and journals accumulate lines without re-writing the whole file. Note that the mode letter is a — writing the input unchanged keeps the file contents predictable on every machine.",
      code: {
        code: `<?php
$file = __DIR__ . "/academy.txt";
$handle = fopen($file, "a");
fwrite($handle, "Second line");
fclose($handle);
echo "Appended.";`,
        output: "Appended.",
      },
      notes: [
        "Unlike w, mode a never truncates the file.",
        "If the file does not exist yet, append mode creates it before the first write.",
      ],
    },
    {
      heading: "Deleting a file",
      explanation:
        "unlink removes a file from disk. PHP warns and the operation fails if the file does not exist, so good code checks file_exists first and only deletes when the file is actually there.",
      code: {
        code: `<?php
$file = __DIR__ . "/academy.txt";
if (file_exists($file)) {
    unlink($file);
    echo "File deleted.";
} else {
    echo "File not found.";
}`,
        output: "File deleted.",
      },
      notes: [
        "Guard with file_exists: deleting a missing file raises a warning.",
        "After a successful unlink, file_exists returns false on the next request too.",
      ],
    },
    {
      heading: "The filesystem practice",
      explanation:
        "Each practice program runs inside its own isolated workspace. Every Run is a real PHP request in that same workspace, so a file you create in one Run still exists on the next — exactly like disk storage on a server. Reset Editor only restores the starter code; Reset Session deletes the workspace along with every file you created.",
      notes: [
        "Create, then read, then append, then delete — state persists between Runs until you reset the session.",
        "Files live in the throwaway workspace only; no host file outside it is ever touched.",
      ],
    },
  ],
};