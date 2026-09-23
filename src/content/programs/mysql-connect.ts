import type { Program } from "@/lib/learning/types";

export const PROGRAM_MYSQL_CONNECT: Program = {
  id: "program-mysql-connect",
  slug: "mysql-connect",
  title: "Connect with mysqli",
  description: "Open and verify a mysqli connection to the practice database.",
  category: "Databases",
  difficulty: "beginner",
  problemStatement:
    "Load the session's connection config, connect to the practice database with procedural mysqli, and print exactly \"Connected successfully.\" when the connection is live.",
  concepts: ["require config", "mysqli_connect()", "mysqli_connect_error()", "mysqli_close()"],
  code: `<?php
// The runner injects this file into the practice workspace for THIS session
// only. It contains this session's credentials and table prefix.
$config = require __DIR__ . "/academy_db_config.php";

$conn = mysqli_connect(
    $config["host"],
    $config["user"],
    $config["password"],
    $config["database"],
    $config["port"]
);

// mysqli_connect_error() reports WHY the connection was attempted and failed.
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

echo "Connected successfully.";

mysqli_close($conn);`,
  expectedOutput: "Connected successfully.",
  explanation:
    "Loading the injected config keeps credentials out of learner code and ties every connection to the current session's database namespace. mysqli_connect returns a connection handle when it succeeds, and false when it cannot reach the server; the guard reports the failure through mysqli_connect_error instead of letting the script limp on. On success echo the confirmation, then mysqli_close frees the connection so a later connect in the same script still has free handles.",
  notes: [
    "The config file only exists inside the practice session — the values are session-scoped and never shipped to the browser.",
    "Always use the port from the config; MySQL may not be listening on the default 3306.",
    "Close connections when done; repeated practice runs stack connections otherwise.",
  ],
  practice: {
    execution: "mysql",
    inputs: [],
    starterCode: `<?php

// A config file for THIS practice session was injected next to your script.
// Load it, then connect with mysqli_connect(host, user, password, database,
// port). On failure print: "Connection failed: " . mysqli_connect_error()
// and stop. On success print exactly: Connected successfully.
// Afterwards close the connection with mysqli_close().
//
// Hints:
//   $config = require __DIR__ . "/academy_db_config.php";
//   $conn   = mysqli_connect(...config values...);
// Check the handle BEFORE using it.

$config = require __DIR__ . "/academy_db_config.php";

// Your logic here
`,
  },
  statefulTestCases: [
    {
      id: "connect-basic",
      name: "Connects to the practice database",
      steps: [
        { inputs: {}, expectedOutput: "Connected successfully." },
      ],
    },
    {
      id: "connect-twice",
      name: "Repeated connections stay healthy",
      steps: [
        { inputs: {}, expectedOutput: "Connected successfully." },
        { inputs: {}, expectedOutput: "Connected successfully." },
      ],
    },
    {
      id: "connect-close-then-reconnect",
      name: "Close then reconnect works",
      steps: [
        { inputs: {}, expectedOutput: "Connected successfully." },
        { inputs: {}, expectedOutput: "Connected successfully." },
      ],
    },
    {
      id: "connect-fresh-namespace",
      name: "Each session starts with no tables",
      steps: [
        {
          inputs: {},
          expectedOutput: "Connected successfully.",
          expectedDb: [{ table: "students", rows: null }],
        },
      ],
    },
  ],
  hints: [
    {
      id: "conceptual",
      title: "Conceptual direction",
      content:
        "The runner injects academy_db_config.php next to your script, containing the host, port, database, user, password and table prefix for exactly this session. Connecting is a function call that either hands back a live handle or reports the reason it could not connect.",
    },
    {
      id: "implementation",
      title: "Implementation approach",
      content:
        "Load the array with require, pass its five connection values into mysqli_connect, then guard the result: a false handle means the connection failed and mysqli_connect_error carries the reason. Only after that guard succeeds should you echo the confirmation and close the connection.",
    },
    {
      id: "step-level",
      title: "Step-by-step hint",
      content:
        "The graded check connects at least twice (and after a close). If you print anything besides the exact \"Connected successfully.\" line — or misspell the mysqli function names — the case fails. Close the handle at the end so the second connection in the same script is not affected.",
    },
  ],
  lessonReferences: [{ lessonSlug: "mysql", label: "MySQL & Databases" }],
};