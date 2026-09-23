import type { Program } from "@/lib/learning/types";

export const PROGRAM_MYSQL_UPDATE: Program = {
  id: "program-mysql-update",
  slug: "mysql-update",
  title: "Update a row",
  description: "Change a student's name and grade with an UPDATE statement.",
  category: "Databases",
  difficulty: "intermediate",
  problemStatement:
    "Change the name and grade of a student identified by id, report how many rows actually changed, and list the seeded students to verify the outcome.",
  concepts: ["UPDATE ... WHERE", "mysqli_affected_rows()", "prepared statements", "idempotent writes"],
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

if ($action === "update") {
    $id    = isset($_POST["id"])    ? (int) $_POST["id"]    : 0;
    $name  = isset($_POST["name"])  ? $_POST["name"]        : "";
    $grade = isset($_POST["grade"]) ? (int) $_POST["grade"] : 0;

    // Prepared statement: the values are bound separately, so quotes in the
    // name can never break out of the SQL.
    $stmt = mysqli_prepare(
        $conn,
        "UPDATE \`$students\` SET name = ?, grade = ? WHERE id = ?"
    );
    mysqli_stmt_bind_param($stmt, "sii", $name, $grade, $id);
    mysqli_stmt_execute($stmt);

    // mysqli_affected_rows counts rows that CHANGED — so updating a row to
    // the same values reports 0, exactly as MySQL behaves.
    $changed = mysqli_stmt_affected_rows($stmt);
    echo $changed > 0 ? "Updated 1 row." : "No rows updated.";
    mysqli_stmt_close($stmt);
} else {
    $result = mysqli_query($conn, "SELECT id, name, grade FROM \`$students\` ORDER BY id");
    while ($row = mysqli_fetch_assoc($result)) {
        echo $row["id"] . " " . $row["name"] . " " . $row["grade"] . "\\n";
    }
}

mysqli_close($conn);`,
  expectedOutput: "Updated 1 row.\n1 Alice 85\n2 Bob 92\n3 Carol 78",
  explanation:
    "UPDATE targets rows through WHERE id, so a single student changes while the rest stay untouched. Running it through a prepared statement binds name, grade and id as separate parameters, which keeps submitted text out of the SQL text. The trick is that MySQL reports AFFECTED rows, not matched rows: writing the same values back counts as zero, and a WHERE clause that matches nothing also reports zero. Printing that count is the observable difference between a real and a no-op update.",
  notes: [
    "mysqli_affected_rows is about rows that changed — a same-value write is a no-op.",
    "UPDATE with no WHERE would rewrite every row; always filter by id.",
    "Prepared statements make text values safe without manual escaping.",
  ],
  practice: {
    execution: "mysql",
    mysql: { seedTables: ["students"] },
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "update",
        description: "update or list",
      },
      {
        name: "id",
        label: "Student id",
        type: "number",
        value: "1",
        description: "Row to update",
      },
      {
        name: "name",
        label: "New name",
        type: "text",
        value: "Alicia",
        description: "Value written to the name column",
      },
      {
        name: "grade",
        label: "New grade",
        type: "number",
        value: "98",
        description: "Value written to the grade column",
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
// The Input panel sends keys: action, id, name, grade.
//
//   action = update -> UPDATE students SET name=?, grade=? WHERE id=?
//                      Print "Updated 1 row." when at least one row actually
//                      changed, otherwise "No rows updated." (MySQL reports
//                      AFFECTED rows — a same-value write reports 0).
//   action = list   -> SELECT id, name, grade ORDER BY id and print each row
//                      as "<id> <name> <grade>" on its own line.
//
// Prefer a prepared statement so the submitted values can never break the SQL.

$action = $_POST["action"] ?? "list";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "update-changes-row",
      name: "Update rewrites the target row",
      steps: [
        {
          inputs: { action: "update", id: "1", name: "Alicia", grade: "98" },
          expectedOutput: "Updated 1 row.",
          expectedDb: [
            {
              table: "students",
              rows: [
                { id: "1", name: "Alicia", grade: "98" },
                { id: "2", name: "Bob", grade: "92" },
                { id: "3", name: "Carol", grade: "78" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "update-no-match",
      name: "Unknown id is a no-op",
      steps: [
        {
          inputs: { action: "update", id: "99", name: "Nobody", grade: "50" },
          expectedOutput: "No rows updated.",
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
      id: "update-same-values",
      name: "Writing the same value reports 0",
      steps: [
        {
          inputs: { action: "update", id: "2", name: "Bob", grade: "92" },
          expectedOutput: "No rows updated.",
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
      id: "update-then-list",
      name: "List reflects the update",
      steps: [
        {
          inputs: { action: "update", id: "3", name: "Carol", grade: "99" },
          expectedOutput: "Updated 1 row.",
        },
        {
          inputs: { action: "list" },
          expectedOutput: "1 Alice 85\n2 Bob 92\n3 Carol 99",
        },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "UPDATE changes the rows a WHERE clause selects, and MySQL reports how many rows were actually changed — not how many matched. That distinction is the trap: no matching id and identical new values both report zero.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Bind id, name and grade through a prepared statement, execute, then read the affected-row count with mysqli_stmt_affected_rows. Print \"Updated 1 row.\" when the count is above zero and \"No rows updated.\" otherwise. The list branch prints every seeded row in id order.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The grader checks three behaviors: a real change updates the row set; an unknown id changes nothing and reports zero; writing identical values also reports zero. If you print based on rows matched instead of rows affected, the same-value case fails.",
    },
  ],
  lessonReferences: [{ lessonSlug: "mysql", label: "MySQL & Databases" }],
};