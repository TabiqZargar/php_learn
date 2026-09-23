import type { Lesson } from "@/lib/learning/types";

export const LESSON_MYSQL: Lesson = {
  id: "lesson-mysql",
  slug: "mysql",
  title: "MySQL & Databases",
  category: "basics",
  description: "Connect to MySQL, then create, insert, update, read and delete rows with mysqli.",
  order: 12,
  estimatedMinutes: 16,
  sections: [
    {
      heading: "Connecting with mysqli",
      explanation:
        "Procedural mysqli connects with mysqli_connect(), passing the host, port, database, user and password. Instead of hard-coding credentials, the practice runner injects an academy_db_config.php into the session's workspace: requiring it returns an array of host, port, database, user, password and table_prefix that belongs to exactly this session. The connection call either returns a live handle or false with the reason in mysqli_connect_error(); always check the handle before doing anything else, and release the connection with mysqli_close() when finished.",
      code: {
        code: `<?php
$config = require __DIR__ . "/academy_db_config.php";

$conn = mysqli_connect(
    $config["host"], $config["user"], $config["password"],
    $config["database"], $config["port"]
);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.";
mysqli_close($conn);`,
        output: "Connected successfully.",
      },
      notes: [
        "The injected config carries the credentials for one session only; they are never shipped to the browser.",
        "Use the config's port — MySQL does not always listen on 3306.",
      ],
    },
    {
      heading: "Creating and dropping tables",
      explanation:
        "DDL runs through the same connection handle as any query. CREATE TABLE IF NOT EXISTS creates the table once and stays harmless when run again — idempotency that a repeated practice run needs. DROP TABLE IF EXISTS removes it without error when it is missing. The physical table name is prefixed per session (table_prefix + 'students'), so sessions share the practice database but never collide. Prepend the prefix and backtick-quote the name in SQL.",
      code: {
        code: `<?php
$table = $config["table_prefix"] . "products";
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS \`$table\` (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(50)  NOT NULL,
    price DECIMAL(8,2) NOT NULL
)");
echo "Table created.";`,
        output: "Table created.",
      },
      notes: [
        "CREATE TABLE without IF NOT EXISTS fails on the second run.",
        "AUTO_INCREMENT PRIMARY KEY hands each new row a stable, unique id.",
      ],
    },
    {
      heading: "Inserting rows",
      explanation:
        "INSERT adds rows to an existing table. Values are interpolated into the statement, so every text value must be escaped with mysqli_real_escape_string to stop quotes or malicious content from breaking out of the SQL. INSERT then SELECT ... ORDER BY id lets you verify exactly what was stored, in insertion order.",
      code: {
        code: `<?php
$name = mysqli_real_escape_string($conn, "Ada");
mysqli_query($conn, "INSERT INTO \`$students\` (name, grade) VALUES ('$name', 90)");
echo "Inserted 1 row.";`,
        output: "Inserted 1 row.",
      },
      notes: [
        "Never splice raw form input into SQL; escape it or use a prepared statement.",
        "ORDER BY id makes query output deterministic.",
      ],
    },
    {
      heading: "Updating rows",
      explanation:
        "UPDATE rewrites the columns of the rows WHERE picks out. The id filter keeps the change scoped to one row — a missing WHERE would rewrite the whole table. A prepared statement binds the new values as parameters so text cannot break the SQL text. MySQL reports AFFECTED rows, not matched rows, so an update that writes identical values counts as zero.",
      code: {
        code: `<?php
$stmt = mysqli_prepare($conn, "UPDATE \`$students\` SET name = ?, grade = ? WHERE id = ?");
mysqli_stmt_bind_param($stmt, "sii", $name, $grade, $id);
mysqli_stmt_execute($stmt);
echo mysqli_stmt_affected_rows($stmt) > 0 ? "Updated 1 row." : "No rows updated.";`,
        output: "Updated 1 row.",
      },
      notes: [
        "mysqli_affected_rows counts rows that changed — the same-value trap.",
        "Prepared statements (?) are the safest way to pass text into SQL.",
      ],
    },
    {
      heading: "Deleting rows",
      explanation:
        "DELETE removes entire rows. Scope it with WHERE id so only the intended row goes, because DELETE without a filter removes every row. The affected-row count tells you whether anything was actually removed. Deleting the last row leaves the table present but empty — a different state than a table that was dropped.",
      code: {
        code: `<?php
$stmt = mysqli_prepare($conn, "DELETE FROM \`$students\` WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
echo mysqli_stmt_affected_rows($stmt) > 0 ? "Deleted 1 row." : "No rows deleted.";`,
        output: "Deleted 1 row.",
      },
      notes: [
        "Always filter DELETE by a unique column; unfiltered DELETE wipes the table.",
        "An empty table still matches SELECT — only DROP makes it missing.",
      ],
    },
    {
      heading: "The MySQL practice",
      explanation:
        "Every MySQL practice program runs in an isolated session that owns its own database namespace: a per-session table prefix that keeps this session's tables separate from every other session in the shared practice database. The update and delete programs start with students already seeded so you mutate known rows; create/insert programs start empty. The server-only grader snapshots the actual table state after each step (expectedDb), so Check Solution verifies what you really persisted, not what you printed. Reset Session drops this session's tables along with its workspace.",
      notes: [
        "The database user is granted privileges on the practice database only — not *.*.",
        "Each session's prefix means no learner can ever see another learner's tables.",
      ],
    },
  ],
};