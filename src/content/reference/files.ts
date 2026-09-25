import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_FILES: readonly ReferenceEntry[] = [
  {
    id: "fopen",
    name: "fopen()",
    categoryId: "files",
    summary: "Open a file and get a handle to work with.",
    signature: "fopen(string $filename, string $mode): resource|false",
    description:
      "fopen returns a file handle you pass to fread/fwrite/fclose. The second argument is the mode: r read, w write (creates or truncates), a append, and r+ / w+ for read+write.",
    examples: [
      {
        code: `<?php
$handle = fopen("notes.txt", "w");
echo $handle ? "opened" : "failed";`,
        output: "opened",
      },
    ],
    keywords: ["open", "handle", "mode", "resource", "w", "r", "a"],
  },
  {
    id: "fwrite",
    name: "fwrite()",
    categoryId: "files",
    summary: "Write a string to an open file handle.",
    signature: "fwrite(resource $handle, string $data): int|false",
    description:
      "fwrite writes data to the handle opened by fopen and returns how many bytes were written. Combine with fclose to make sure everything is flushed to disk.",
    examples: [
      {
        code: `<?php
$file = fopen("notes.txt", "w");
fwrite($file, "Hello from PHP");
fclose($file);
echo filesize("notes.txt") . " bytes";`,
        output: "14 bytes",
      },
    ],
    keywords: ["write", "save", "record", "store bytes"],
  },
  {
    id: "file-put-contents",
    name: "file_put_contents()",
    categoryId: "files",
    summary: "Write a string to a file in ONE call.",
    signature: "file_put_contents(string $filename, mixed $data): int|false",
    description:
      "A shortcut for fopen + fwrite + fclose. Pass FILE_APPEND as the third argument to add to the end instead of overwriting. Returns bytes written or false on failure.",
    examples: [
      {
        code: `<?php
file_put_contents("log.txt", "first");
file_put_contents("log.txt", " second", FILE_APPEND);
echo file_get_contents("log.txt");`,
        output: "first second",
      },
    ],
    keywords: ["write file", "save", "append", "FILE_APPEND", "shortcut"],
  },
  {
    id: "file",
    name: "file()",
    categoryId: "files",
    summary: "Read a whole file into an array of lines.",
    signature: "file(string $filename): array",
    description:
      "file opens the file and returns every line as one array element, including each line's trailing newline. Use file_get_contents when you want the whole text as a single string.",
    examples: [
      {
        code: `<?php
$lines = file("names.txt");
echo count($lines) . " lines";`,
        output: "3 lines",
      },
    ],
    keywords: ["read lines", "split by newline", "contents to array"],
  },
  {
    id: "file_exists",
    name: "file_exists()",
    categoryId: "files",
    summary: "Does this file or directory exist?",
    signature: "file_exists(string $filename): bool",
    description:
      "Returns true when the given path points to an existing file or directory. Useful before reading, or to avoid overwriting when you want a truly new file.",
    examples: [
      {
        code: `<?php
$name = "notes.txt";
echo file_exists($name) ? "exists" : "missing";`,
        output: "missing",
      },
    ],
    keywords: ["exists", "check", "is there", "path"],
  },
  {
    id: "unlink",
    name: "unlink()",
    categoryId: "files",
    summary: "Delete a file.",
    signature: "unlink(string $filename): bool",
    description:
      "unlink removes the file at the given path and returns true on success. There is no confirmation — make sure you meant to remove it, and check the result.",
    examples: [
      {
        code: `<?php
$ok = unlink("notes.txt");
echo $ok ? "deleted" : "could not delete";`,
        output: "deleted",
      },
    ],
    keywords: ["delete", "remove", "delete file"],
  },
  {
    id: "basename",
    name: "basename() / dirname()",
    categoryId: "files",
    summary: "Split a path into its file and folder parts.",
    signature: "basename(string $path): string   |   dirname(string $path): string",
    description:
      "basename returns the file name at the end of a path; dirname returns everything before it. Together they keep you from hard-coding separators when working with file locations.",
    examples: [
      {
        code: `<?php
$path = "/home/user/logs/app.log";
echo basename($path);
echo " in " . dirname($path);`,
        output: "app.log in /home/user/logs",
      },
    ],
    keywords: ["path parts", "filename", "folder", "strip path"],
  },
];
