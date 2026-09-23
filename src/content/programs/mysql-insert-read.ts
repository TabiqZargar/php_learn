import type { Program } from "@/lib/learning/types";

export const PROGRAM_MYSQL_INSERT_READ: Program = {
  id: "program-mysql-insert-read",
  slug: "mysql-insert-read",
  title: "Insert & Read Rows",
  description: "Insert rows into students and read them back in id order.",
  category: "Databases",
  difficulty: "intermediate",
  problemStatement:
    "Create the students table, insert rows from the submitted form fields, and print the stored rows in id order — teaching INSERT after the table exists and SELECT for verification.",
  concepts: ["INSERT INTO", "SELECT ... ORDER BY", "AUTO_INCREMENT", "row iteration with mysqli_fetch_assoc"],
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

if ($action === "setup") {
    $sql = "CREATE TABLE IF NOT EXISTS \`$students\` (
        id    INT AUTO_INCREMENT PRIMARY KEY,
        name  VARCHAR(50) NOT NULL,
        grade INT          NOT NULL
    )";
    mysqli_query($conn, $sql);
    echo "Table created.";
} elseif ($action === "insert") {
    $name  = isset($_POST["name"])  ? $_POST["name"]  : "Ada";
    $grade = isset($_POST["grade"]) ? (int) $_POST["grade"] : 90;
    $sql = "INSERT INTO \`$students\` (name, grade) VALUES ('"
        . mysqli_real_escape_string($conn, $name) . "', $grade)";
    mysqli_query($conn, $sql);
    echo "Inserted 1 row.";
} else {
    $result = mysqli_query($conn, "SELECT id, name, grade FROM \`$students\` ORDER BY id");
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            echo $row["id"] . " " . $row["name"] . " " . $row["grade"] . "\\n";
        }
    } else {
        echo "No rows.";
    }
}

mysqli_close($conn);`,
  expectedOutput: "Table created.\nInserted 1 row.\n1 Ada 90",
  explanation:
    "A table must exist before INSERT can add rows, so the setup action creates students idempotently. Inserting interpolates the submitted values into an INSERT statement; escaping the text value with mysqli_real_escape_string stops quotes from breaking the query. Reading back uses SELECT with ORDER BY id so the output follows insertion order, and the loop prints each row from the result set. The output format lines up the inserted values so the grader can compare the exact rows.",
  notes: [
    "Escape every text value that reaches a query; never trust form input.",
    "ORDER BY id makes auto-increment order explicit instead of whatever the server happens to return.",
    "CREATE TABLE IF NOT EXISTS keeps the setup action safe to repeat.",
  ],
  practice: {
    execution: "mysql",
    inputs: [
      {
        name: "action",
        label: "Action",
        type: "text",
        value: "insert",
        description: "setup, insert or list",
      },
      {
        name: "name",
        label: "Name",
        type: "text",
        value: "Ada",
        description: "Student name to insert",
      },
      {
        name: "grade",
        label: "Grade",
        type: "number",
        value: "90",
        description: "Student grade to insert",
      },
    ],
    starterCode: `<?php

$conn = mysqli_connect(...);   // from academy_db_config.php, as in
                               // mysql-connect / mysql-create-table
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Physical table: $config["table_prefix"] . "students".
//
// The Input panel sends keys: action, name, grade.
//
//   action = setup  -> CREATE TABLE IF NOT EXISTS students
//                        (id INT AUTO_INCREMENT PRIMARY KEY,
//                         name VARCHAR(50) NOT NULL, grade INT NOT NULL)
//                      and print "Table created."
//   action = insert -> INSERT the submitted name + grade (defaults "Ada"/90),
//                      print "Inserted 1 row."
//   action = list   -> SELECT id, name, grade ORDER BY id; print each row as
//                      "<id> <name> <grade>" on its own line; if the table is
//                      empty print "No rows."
//
// Escape text values before they touch SQL (mysqli_real_escape_string).

$action = $_POST["action"] ?? "list";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "setup-then-insert",
      name: "Insert writes one row",
      steps: [
        {
          inputs: { action: "setup" },
          expectedOutput: "Table created.",
        },
        {
          inputs: { action: "insert", name: "Grace", grade: "97" },
          expectedOutput: "Inserted 1 row.",
          expectedDb: [{ table: "students", rows: [{ id: "1", name: "Grace", grade: "97" }] }],
        },
      ],
    },
    {
      id: "insert-then-list",
      name: "Inserted row appears in the list",
      steps: [
        {
          inputs: { action: "setup" },
          expectedOutput: "Table created.",
        },
        {
          inputs: { action: "insert", name: "Ada", grade: "90" },
          expectedOutput: "Inserted 1 row.",
        },
        {
          inputs: { action: "list" },
          expectedOutput: "1 Ada 90",
        },
      ],
    },
    {
      id: "insert-multiple-then-list",
      name: "Rows are listed in id order",
      steps: [
        {
          inputs: { action: "setup" },
          expectedOutput: "Table created.",
        },
        {
          inputs: { action: "insert", name: "Alice", grade: "85" },
          expectedOutput: "Inserted 1 row.",
        },
        {
          inputs: { action: "insert", name: "Bob", grade: "92" },
          expectedOutput: "Inserted 1 row.",
        },
        {
          inputs: { action: "list" },
          expectedOutput: "1 Alice 85\n2 Bob 92",
          expectedDb: [
            {
              table: "students",
              rows: [
                { id: "1", name: "Alice", grade: "85" },
                { id: "2", name: "Bob", grade: "92" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "list-empty-table",
      name: "Empty table prints No rows",
      steps: [
        {
          inputs: { action: "setup" },
          expectedOutput: "Table created.",
        },
        {
          inputs: { action: "list" },
          expectedOutput: "No rows.",
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
        "INSERT needs a table that already exists, which is why the session flow always creates it first. Every submitted value that becomes part of a query must be escaped, and reading back with ORDER BY gives deterministic output the grader can compare.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Branch on the action field. Setup issues CREATE TABLE IF NOT EXISTS. Insert builds an INSERT statement from the submitted name/grade (escaping the text value) and prints a confirmation. List runs a SELECT ordered by id and prints each row as id, name, grade on its own line, falling back to \"No rows.\" when empty.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check always starts with setup, then inserts, then verifies the exact row set on disk. If list does not print every row in insertion order — or prints extra characters around the values — the comparison fails. Autoincrement ids start at 1, and the printed list must match the stored rows exactly.",
    },
  ],
  lessonReferences: [{ lessonSlug: "mysql", label: "MySQL & Databases" }],
};