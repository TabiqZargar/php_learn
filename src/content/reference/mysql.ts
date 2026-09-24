import type { ReferenceEntry } from "@/lib/reference/types";

export const REFERENCE_ENTRIES_MYSQL: readonly ReferenceEntry[] = [
  {
    id: "mysqli_connect",
    name: "mysqli_connect()",
    categoryId: "mysql",
    summary: "Open a connection to a MySQL server.",
    signature:
      "mysqli_connect(?string $hostname, ?string $username, ?string $password, ?string $database): mysqli|false",
    description:
      "Returns a connection object you pass to every later mysqli call. Supply the host, user, password and (optionally) the database. In modern PHP use the object-oriented form: new mysqli(...).",
    examples: [
      {
        code: `<?php
$conn = new mysqli("localhost", "root", "secret", "academy");
if ($conn->connect_error) {
    die("Connection failed");
}
echo "connected";`,
        output: "connected",
      },
    ],
    keywords: ["connect", "database connection", "new mysqli", "host", "server"],
  },
  {
    id: "mysqli_prepare",
    name: "mysqli_prepare()",
    categoryId: "mysql",
    summary: "Prepare a parameterized SQL statement.",
    signature: "mysqli_prepare(mysqli $mysql, string $query): mysqli_stmt|false",
    description:
      "Parses the query once, leaving ? placeholders that are safely bound later with bind_param. This is the defense against SQL injection — values never get concatenated into the SQL string.",
    examples: [
      {
        code: `<?php
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
echo $stmt ? "prepared" : "failed";`,
        output: "prepared",
      },
    ],
    keywords: ["parameterized", "placeholder", "spreliminary", "injection safe", "stmt"],
  },
  {
    id: "mysqli_stmt_bind_param",
    name: "mysqli_stmt_bind_param()",
    categoryId: "mysql",
    summary: "Bind values into a prepared statement's placeholders.",
    signature: "mysqli_stmt_bind_param(mysqli_stmt $stmt, string $types, mixed &...$vars): bool",
    description:
      "The types string uses one letter per placeholder: i integer, d double, s string, b blob. Each placeholder gets a matching variable. Order must line up exactly with the ? in the query.",
    examples: [
      {
        code: `<?php
$email = "tasha@example.com";
$age = 34;
$stmt->bind_param("si", $email, $age);
echo "bound";`,
        output: "bound",
      },
    ],
    keywords: ["bind", "placeholders", "types string", "inputs", "parameters", "si"],
  },
  {
    id: "mysqli_stmt_execute",
    name: "mysqli_stmt_execute()",
    categoryId: "mysql",
    summary: "Run a prepared statement.",
    signature: "mysqli_stmt_execute(mysqli_stmt $stmt): bool",
    description: "Executes the prepared statement. For SELECTs, call get_result next to fetch rows.",
    examples: [
      {
        code: `<?php
$stmt->execute();
echo "executed";`,
        output: "executed",
      },
    ],
    keywords: ["run", "execute query", "command", "fire"],
  },
  {
    id: "mysqli_stmt_get_result",
    name: "mysqli_stmt_get_result()",
    categoryId: "mysql",
    summary: "Get the result set of an executed SELECT.",
    signature: "mysqli_stmt_get_result(mysqli_stmt $stmt): mysqli_result|false",
    description:
      "After executing a prepared SELECT, this hands you a result object. Fetch rows one at a time with fetch_assoc or fetch_row.",
    examples: [
      {
        code: `<?php
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    echo $row["name"] . " ";
}`,
        output: "Tasha Zara ",
      },
    ],
    keywords: ["result set", "rows", "fetch", "select rows", "result object"],
  },
  {
    id: "mysqli_fetch_assoc",
    name: "mysqli_fetch_assoc()",
    categoryId: "mysql",
    summary: "Fetch one row as an associative array.",
    signature: "mysqli_fetch_assoc(mysqli_result $result): array|null",
    description:
      "Returns the next row with column names as keys, or null when there are no more rows. Loop with while to walk the whole result set.",
    examples: [
      {
        code: `<?php
while ($row = $result->fetch_assoc()) {
    echo $row["id"] . ":" . $row["name"] . " ";
}`,
        output: "1:Tasha 2:Zara ",
      },
    ],
    keywords: ["row", "associative", "columns", "next record", "read row"],
  },
  {
    id: "mysqli_query",
    name: "mysqli_query()",
    categoryId: "mysql",
    summary: "Run a one-off SQL statement.",
    signature: "mysqli_query(mysqli $mysql, string $query): mysqli_result|bool",
    description:
      "For quick queries without user input — e.g. CREATE TABLE — run them directly. For anything built from user data, always use prepare + bind_param instead.",
    examples: [
      {
        code: `<?php
mysqli_query($conn, "CREATE TABLE students (id INT PRIMARY KEY)");
echo "table created";`,
        output: "table created",
      },
    ],
    keywords: ["query", "run sql", "raw sql", "direct query", "one-off"],
  },
  {
    id: "mysqli_close",
    name: "mysqli_close()",
    categoryId: "mysql",
    summary: "Close the connection.",
    signature: "mysqli_close(mysqli $mysql): true",
    description:
      "Releases the connection. PHP closes it automatically at script end, but closing explicitly is tidy in long scripts.",
    examples: [
      {
        code: `<?php
mysqli_close($conn);
echo "closed";`,
        output: "closed",
      },
    ],
    keywords: ["close", "disconnect", "cleanup", "release connection"],
  },
];
