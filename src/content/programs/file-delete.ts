import type { Program } from "@/lib/learning/types";

export const PROGRAM_FILE_DELETE: Program = {
  id: "program-file-delete",
  slug: "file-delete",
  title: "Delete academy.txt",
  description: "Remove a file safely with file_exists() and unlink().",
  category: "File System",
  difficulty: "beginner",
  problemStatement:
    "Allow the practice request to create academy.txt, report whether it exists, and delete it safely — only unlinking a file that is actually there.",
  concepts: ["file_exists()", "unlink()", "guarding deletion"],
  code: `<?php
$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

if ($action === "create") {
    $handle = fopen($file, "w");
    fwrite($handle, $_POST["content"] ?? "Welcome to PHP!");
    fclose($handle);
    echo "File created.";
} elseif ($action === "delete") {
    if (file_exists($file)) {
        unlink($file);
        echo "File deleted.";
    } else {
        echo "File not found.";
    }
} else {
    echo file_exists($file) ? "File exists." : "File does not exist.";
}`,
  expectedOutput:
    "File exists.\nFile deleted.\nFile does not exist.",
  explanation:
    "file_exists answers whether a file is on disk, and unlink removes it. Deleting unconditionally fails with a warning when the file is missing, so the delete branch checks first and prints a friendly message in both cases. The status branch uses file_exists to report current truth, which flips from true to false after the file is removed.",
  notes: [
    "Always guard unlink with file_exists so deleting a missing file is not an error.",
    "A deleted file stays gone: later status requests report it as missing until it is created again.",
  ],
  practice: {
    execution: "filesystem",
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "delete",
        description: "create, status or delete",
      },
      {
        name: "content",
        label: "Content",
        type: "text",
        value: "Welcome to PHP!",
        description: "Text written on create",
      },
    ],
    starterCode: `<?php

// The Input panel sends a real POST request with keys: action, content.
//
//   action = create -> open academy.txt in WRITE mode (w), fwrite the
//                      submitted content, fclose, then print "File created."
//   action = status  -> print "File exists." when the file is on disk,
//                      otherwise print "File does not exist."
//   action = delete  -> check file_exists FIRST, and only then unlink; print
//                      "File deleted." when it was removed, "File not found."
//                      when there was nothing to delete.
//
// unlink on a missing file raises a warning — the guard is not optional.
//
// Use $file = __DIR__ . "/academy.txt" so the path is machine-independent.

$file = __DIR__ . "/academy.txt";
$action = $_POST["action"] ?? "status";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "delete-removes",
      name: "Delete removes the file",
      steps: [
        {
          inputs: { action: "create", content: "Temporary note" },
          expectedOutput: "File created.",
          expectedFiles: { "academy.txt": "Temporary note" },
        },
        {
          inputs: { action: "delete" },
          expectedOutput: "File deleted.",
          expectedFiles: { "academy.txt": null },
        },
      ],
    },
    {
      id: "delete-missing",
      name: "Deleting nothing is safe",
      steps: [
        {
          inputs: { action: "delete" },
          expectedOutput: "File not found.",
          expectedFiles: { "academy.txt": null },
        },
      ],
    },
    {
      id: "status-reflects-delete",
      name: "Status reflects the deletion",
      steps: [
        {
          inputs: { action: "create", content: "Bye soon" },
          expectedOutput: "File created.",
        },
        { inputs: { action: "status" }, expectedOutput: "File exists." },
        { inputs: { action: "delete" }, expectedOutput: "File deleted." },
        { inputs: { action: "status" }, expectedOutput: "File does not exist." },
      ],
    },
    {
      id: "double-delete-guarded",
      name: "Second delete is guarded",
      steps: [
        {
          inputs: { action: "create", content: "Draft" },
          expectedOutput: "File created.",
        },
        { inputs: { action: "delete" }, expectedOutput: "File deleted." },
        {
          inputs: { action: "delete" },
          expectedOutput: "File not found.",
          expectedFiles: { "academy.txt": null },
        },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "A file only exists until it is removed. The request can ask whether the file is currently on disk, remove it when it is, and report nothing was there when it is not. The truth should always come from the file system, never from memory of a previous request.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Anchor the path to the script directory. Create the file by opening it for writing, writing the content and closing. For status, print the two-way report of whether the file exists. For delete, check existence first, then remove the file and print the matching confirmation, with a separate message when nothing was found.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check creates, reports, deletes and reports again inside one fresh workspace. Deleting a missing file must not produce a warning, so the guard decides everything: only when the file exists do you unlink. After deletion, a status request must report the file is gone, and a second delete must say nothing was found.",
    },
  ],
  lessonReferences: [{ lessonSlug: "filesystem", label: "Files & the Filesystem" }],
};