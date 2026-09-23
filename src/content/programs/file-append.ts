import type { Program } from "@/lib/learning/types";

export const PROGRAM_FILE_APPEND: Program = {
  id: "program-file-append",
  slug: "file-append",
  title: "Append to academy.txt",
  description: "Add lines to an existing file without overwriting it.",
  category: "File System",
  difficulty: "beginner",
  problemStatement:
    "Use append mode so each submitted line joins the end of academy.txt instead of replacing what is already there, then read the accumulated contents back.",
  concepts: ["fopen() mode a", "appending vs overwriting", "fwrite()"],
  code: `<?php
$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

if ($action === "append") {
    $handle = fopen($file, "a");                     // append mode
    fwrite($handle, $_POST["line"] ?? "Learning PHP.");
    fclose($handle);
    echo "Line appended.";
} else {
    // read mode
    $handle = fopen($file, "r");
    $contents = fread($handle, filesize($file));
    fclose($handle);
    echo $contents;
}`,
  expectedOutput: "Line appended.\nLine appended.\nFirst lineSecond line",
  explanation:
    "fopen with mode a creates the file when it does not exist and positions the pointer at the end, so every fwrite adds to what is already there — nothing is truncated. Writing the submitted line exactly as received keeps the stored contents predictable regardless of the machine. Reading back with the file-handle trio shows the appended lines accumulated in order.",
  notes: [
    "Append mode is how logs and journals grow without rewriting the whole file.",
    "Unlike write mode, running append twice doubles the contents instead of replacing them.",
  ],
  practice: {
    execution: "filesystem",
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "append",
        description: "append or read",
      },
      {
        name: "line",
        label: "Line",
        type: "text",
        value: "Learning PHP.",
        description: "Text appended to the file",
      },
    ],
    starterCode: `<?php

// The Input panel sends a real POST request with keys: action, line.
//
//   action = append -> open academy.txt in APPEND mode (a), fwrite the
//                      submitted line, fclose, then print "Line appended."
//   action = read    -> open academy.txt in READ mode (r), fread the whole
//                      file, fclose, then echo the contents.
//
// Append mode must NOT truncate: appending twice leaves BOTH lines on disk,
// in the order they arrived.
//
// Use $file = __DIR__ . "/academy.txt" so the path is machine-independent.

$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "append-creates",
      name: "Append creates the file",
      steps: [
        {
          inputs: { action: "append", line: "Learning PHP." },
          expectedOutput: "Line appended.",
          expectedFiles: { "academy.txt": "Learning PHP." },
        },
      ],
    },
    {
      id: "append-accumulates",
      name: "Appends join the end",
      steps: [
        {
          inputs: { action: "append", line: "First line" },
          expectedOutput: "Line appended.",
          expectedFiles: { "academy.txt": "First line" },
        },
        {
          inputs: { action: "append", line: "Second line" },
          expectedOutput: "Line appended.",
          expectedFiles: { "academy.txt": "First lineSecond line" },
        },
      ],
    },
    {
      id: "append-then-read",
      name: "Read shows the full contents",
      steps: [
        { inputs: { action: "append", line: "Alpha" }, expectedOutput: "Line appended." },
        { inputs: { action: "append", line: "Beta" }, expectedOutput: "Line appended." },
        { inputs: { action: "read" }, expectedOutput: "AlphaBeta" },
      ],
    },
    {
      id: "append-never-truncates",
      name: "Later appends preserve earlier data",
      steps: [
        { inputs: { action: "append", line: "Base" }, expectedOutput: "Line appended." },
        { inputs: { action: "append", line: "Extra" }, expectedOutput: "Line appended." },
        { inputs: { action: "read" }, expectedOutput: "BaseExtra" },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "The mode string decides how a write behaves. One mode replaces everything, while the other leaves existing contents alone and only adds to the tail. Pick the one that accumulates, and write the submitted line through the same handle pattern as before.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Anchor the file path to the script directory. In the append branch, open the file with the non-truncating mode, write the submitted line, close the handle, and print a confirmation. In the read branch, open for reading, read the whole file using its byte count, close, and print the contents.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check appends several times inside one fresh workspace and then reads. If the mode truncates, only the last line survives and the accumulation step fails. Reading must show every appended line in submission order, which only holds when each write lands after all earlier ones.",
    },
  ],
  lessonReferences: [{ lessonSlug: "filesystem", label: "Files & the Filesystem" }],
};