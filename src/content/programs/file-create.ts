import type { Program } from "@/lib/learning/types";

export const PROGRAM_FILE_CREATE: Program = {
  id: "program-file-create",
  slug: "file-create",
  title: "Write & Read academy.txt",
  description: "Create a text file, write to it, and read it back.",
  category: "File System",
  difficulty: "beginner",
  problemStatement:
    "Create academy.txt in the practice workspace, write a greeting into it with the file-handle trio, and then read the whole file back on the next request.",
  concepts: ["fopen() modes", "fwrite()", "fread() with filesize()", "fclose()"],
  code: `<?php
$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

if ($action === "create") {
    $handle = fopen($file, "w");                     // create or truncate
    fwrite($handle, $_POST["content"] ?? "Welcome to PHP!");
    fclose($handle);
    echo "File created.";
} else {
    // read mode
    $handle = fopen($file, "r");
    $contents = fread($handle, filesize($file));
    fclose($handle);
    echo $contents;
}`,
  expectedOutput: "File created.\nWelcome to PHP!",
  explanation:
    "fopen with mode w creates academy.txt (or empties it if it already exists) and hands back a handle. fwrite writes the submitted content through that handle, and fclose flushes the data to disk and releases the file. Opening in mode r and sizing fread with filesize reads the whole file back. Because every request runs inside the same practice workspace, the file that create writes is still there when the read request arrives.",
  notes: [
    "Mode w truncates: writing twice replaces the previous contents instead of doubling them.",
    "Always close the handle; a file that is still open cannot be safely re-opened or deleted.",
  ],
  practice: {
    execution: "filesystem",
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "create",
        description: "create or read",
      },
      {
        name: "content",
        label: "Content",
        type: "text",
        value: "Welcome to PHP!",
        description: "Text written to the file on create",
      },
    ],
    starterCode: `<?php

// The Input panel sends a real POST request with keys: action, content.
//
//   action = create -> open academy.txt in WRITE mode (w), fwrite the
//                      submitted content (default "Welcome to PHP!"),
//                      fclose the handle, then print "File created."
//   action = read    -> open academy.txt in READ mode (r), fread the whole
//                      file (filesize tells you the byte count), fclose,
//                      then echo the contents.
//
// The file lives in THIS practice session's isolated workspace, so whatever
// create writes is still there for the next Run.
//
// Use $file = __DIR__ . "/academy.txt" so the path is machine-independent.

$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "create-writes-content",
      name: "Create writes the file",
      steps: [
        {
          inputs: { action: "create", content: "Welcome to PHP!" },
          expectedOutput: "File created.",
          expectedFiles: { "academy.txt": "Welcome to PHP!" },
        },
      ],
    },
    {
      id: "create-then-read",
      name: "Write then read back",
      steps: [
        {
          inputs: { action: "create", content: "Hello from PHP" },
          expectedOutput: "File created.",
          expectedFiles: { "academy.txt": "Hello from PHP" },
        },
        { inputs: { action: "read" }, expectedOutput: "Hello from PHP" },
      ],
    },
    {
      id: "create-overwrites",
      name: "Write mode truncates",
      steps: [
        {
          inputs: { action: "create", content: "First draft" },
          expectedOutput: "File created.",
        },
        {
          inputs: { action: "create", content: "Final draft" },
          expectedOutput: "File created.",
          expectedFiles: { "academy.txt": "Final draft" },
        },
      ],
    },
    {
      id: "create-stays-until-reset",
      name: "File persists across requests",
      steps: [
        {
          inputs: { action: "create", content: "Persistent data" },
          expectedOutput: "File created.",
        },
        { inputs: { action: "read" }, expectedOutput: "Persistent data" },
        { inputs: { action: "read" }, expectedOutput: "Persistent data" },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "Files are reached through a handle: a mode string tells PHP whether to create, replace or keep existing contents, and the same handle is reused for writing and then closed. Between requests the file stays on disk inside the practice workspace, so a later request can open it again.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Build a file path anchored to the script directory so the location never depends on the working directory. For the create branch, open it for writing, send the submitted content to the handle, close it, and print a confirmation. For the read branch, open for reading, size the read with the file's byte count, close, and print the contents.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check runs several requests in one fresh workspace. Create must actually write to disk, or the subsequent read finds nothing. Writing twice in write mode must leave only the second value on disk. Anchor the path to the script directory so the grader's workspace is always the file's home.",
    },
  ],
  lessonReferences: [{ lessonSlug: "filesystem", label: "Files & the Filesystem" }],
};