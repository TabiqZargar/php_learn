import type { Program } from "@/lib/learning/types";

export const PROGRAM_MYSQL_DELETE: Program = {
  id: "program-mysql-delete",
  slug: "mysql-delete",
  title: "Delete rows",
  description: "Remove seeded students with a DELETE statement.",
  category: "Databases",
  difficulty: "intermediate",
  problemStatement:
    "Delete students by id, report the rows actually removed, and list the survivors — then delete every row and confirm the table exists but is empty.",
  concepts: ["DELETE ... WHERE", "mysqli_affected_rows()", "empty vs missing", "prepared statements"],
  code: `<?php
$config = require __DIR__ . "/academy_db_config.php";

$conn = mysqli_connect(
    $config["host"], $config["user"], $config["password"],
    $config["database"], $config["port"]
);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$students = $config["table_prefix"] . "students";
$action = $_POST["action"] ?? "list";

if ($action === "delete") {
    $id = isset($_POST["id"]) ? (int) $_POST["id"] : 0;

    $stmt = mysqli_prepare($conn, "DELETE FROM \`$students\` WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);

    $removed = mysqli_stmt_affected_rows($stmt);
    echo $removed > 0 ? "Deleted 1 row." : "No rows deleted.";
    mysqli_stmt_close($stmt);
} else {
    $result = mysqli_query($conn, "SELECT id, name, grade FROM \`$students\` ORDER BY id");
    while ($row = mysqli_fetch_assoc($result)) {
        echo $row["id"] . " " . $row["name"] . " " . $row["grade"] . "\\n";
    }
}

mysqli_close($conn);`,
  expectedOutput: "Deleted 1 row.\n1 Alice 85\n2 Bob 92",
  explanation:
    "DELETE removes whole rows: the WHERE clause selects exactly the ones to go, and the affected-row count tells you how many actually disappeared. A missing id deletes nothing and reports zero, which is the right signal to report instead of silently assuming success. Rows are deleted permanently, not merely hidden, so the list branch shows exactly the survivors. After every seed row is deleted the table still exists — a SELECT on it returns zero rows, distinct from a table that was dropped.",
  notes: [
    "DELETE without WHERE executes against every row — always pair it with an id filter.",
    "Affected rows are the only reliable way to know whether anything was removed.",
    "Deleting the last row leaves the table empty, not gone.",
  ],
  practice: {
    execution: "mysql",
    mysql: { seedTables: ["students"] },
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "delete",
        description: "delete or list",
      },
      {
        name: "id",
        label: "Student id",
        type: "number",
        value: "2",
        description: "Row to delete",
      },
    ],
    starterCode: `<?php

$conn = mysqli_connect(...);   // from academy_db_config.php
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Physical table: $config["table_prefix"] . "students".
// It ALREADY exists, seeded with exactly these rows:
//   1 Alice 85  2 Bob 92  3 Carol 78
//
// The Input panel sends keys: action, id.
//
//   action = delete -> DELETE FROM students WHERE id=?
//                      Print "Deleted 1 row." when at least one row was
//                      removed, otherwise "No rows deleted."
//   action = list   -> SELECT id, name, grade ORDER BY id and print each row
//                      as "<id> <name> <grade>" on its own line; an empty
//                      table prints nothing.
//
// Prefer a prepared statement so the id value can never break the SQL.

$action = $_POST["action"] ?? "list";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "delete-removes-row",
      name: "Delete removes exactly one row",
      steps: [
        {
          inputs: { action: "delete", id: "2" },
          expectedOutput: "Deleted 1 row.",
          expectedDb: [
            {
              table: "students",
              rows: [
                { id: "1", name: "Alice", grade: "85" },
                { id: "3", name: "Carol", grade: "78" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "delete-no-match",
      name: "Unknown id deletes nothing",
      steps: [
        {
          inputs: { action: "delete", id: "99" },
          expectedOutput: "No rows deleted.",
          expectedDb: [
            {
              table: "students",
              rows: [
                { id: "1", name: "Alice", grade: "85" },
                { id: "2", name: "Bob", grade: "92" },
                { id: "3", name: "Carol", grade: "78" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "delete-then-list",
      name: "List shows the survivors",
      steps: [
        {
          inputs: { action: "delete", id: "3" },
          expectedOutput: "Deleted 1 row.",
        },
        {
          inputs: { action: "list" },
          expectedOutput: "1 Alice 85\n2 Bob 92",
        },
      ],
    },
    {
      id: "delete-all-leaves-empty",
      name: "Deleting every row leaves an empty table",
      steps: [
        {
          inputs: { action: "delete", id: "1" },
          expectedOutput: "Deleted 1 row.",
        },
        {
          inputs: { action: "delete", id: "2" },
          expectedOutput: "Deleted 1 row.",
        },
        {
          inputs: { action: "delete", id: "3" },
          expectedOutput: "Deleted 1 row.",
          expectedDb: [{ table: "students", rows: [] }],
        },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "DELETE fans out over every row the WHERE matches, and the affected-row count says how many actually went away. Deleting the final row leaves the table intact but empty — an empty table and a dropped table are different states.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Bind the id through a prepared statement, execute the DELETE, and read the affected-row count. Print \"Deleted 1 row.\" when it is above zero, \"No rows deleted.\" otherwise. The list branch prints the surviving rows in id order and prints nothing when the table is empty.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The grader exercises removing one row, removing zero rows by id, removing then listing survivors, and deleting all three rows so the table ends empty. If you print based on rows matched rather than affected, the no-match case misreports.",
    },
  ],
  lessonReferences: [{ lessonSlug: "mysql", label: "MySQL & Databases" }],
};