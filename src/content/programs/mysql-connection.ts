import type { Program } from "@/lib/learning/types";

export const PROGRAM_MYSQL_CONNECTION: Program = {
  id: "program-mysql-connection",
  slug: "mysql-connection",
  title: "MySQL Connection",
  description: "Connect to a MySQL database with mysqli.",
  category: "Databases",
  difficulty: "intermediate",
  problemStatement:
    "Connect a PHP script to a MySQL database and verify that the connection works, using mysqli and the modern object-oriented style.",
  concepts: ["mysqli", "connect_error", "Error handling", "Configuration placeholders"],
  code: `<?php
// Database configuration. Replace the placeholder constants with the
// values for YOUR local server (e.g. XAMPP defaults: host localhost,
// username root, empty password, database name "php_academy").
$host     = "DB_HOST";
$username = "DB_USERNAME";
$password = "DB_PASSWORD";
$dbName   = "DB_NAME";

$conn = new mysqli($host, $username, $password, $dbName);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully.";

$conn->close();`,
  expectedOutput: `Connected successfully.`,
  explanation:
    "The mysqli constructor attempts the connection; on failure the driver records an explanation in connect_error instead of crashing. Checking it and aborting with die() gives a controlled error message. When the check passes, the rest of the script can rely on $conn, and close() frees the connection when finished. The four values are configuration placeholders — substitute them with your own server settings.",
  notes: [
    "DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME are placeholders — no real credentials belong in code.",
    "Never put production credentials inside source files; use environment configuration.",
    "die() is fine for a short study script; production apps use exceptions and logging.",
  ],
};