const fs = require("fs");

const file = "src/components/desktop/Desktop.tsx";
let path = "src\\components\\desktop\\Desktop.tsx";
let s = fs.readFileSync(path, "utf8");

// The buffer fill doesn't work reading via "Temp" - read from real path via node
const real = require("path").resolve("src/components/desktop/Desktop.tsx");
s = fs.readFileSync(real, "utf8");
const orig = s;

function assertOnce(s, needle, tag) {
  const count = s.split(needle).length - 1;
  if (count !== 1) {
    console.error(tag + "_COUNT=" + count);
    process.exit(3);
  }
}

// --- Fix 1: AcademyWindow — remove onOpenReference threading (children reject it) ---
{
  const needle =
    "initialLessonRequest={payload?.lessonRequest}\n" +
    "            onOpenPractice={(program) => openPractice(program.slug)}\n" +
    "            onOpenReference={(categoryId) => openReference(categoryId)}\n" +
    "          />";
  const repl =
    "initialLessonRequest={payload?.lessonRequest}\n" +
    "            onOpenPractice={(program) => openPractice(program.slug)}\n" +
    "          />";
  assertOnce(s, needle, "ACADEMY");
  s = s.replace(needle, repl);
}

// --- Fix 2: ProgramsWindow — remove onOpenReference threading ---
{
  const needle =
    "onOpenPractice={(program) => openPractice(program.slug)}\n" +
    "            onOpenReference={(categoryId) => openReference(categoryId)}\n" +
    "          />";
  const repl =
    "onOpenPractice={(program) => openPractice(program.slug)}\n" +
    "          />";
  assertOnce(s, needle, "PROGRAMS");
  s = s.replace(needle, repl);
}

// --- Fix 3: PracticeWindow — remove onOpenReference threading ---
{
  const needle =
    "onOpenLesson={openLesson}\n" +
    "            onOpenReference={(categoryId) => openReference(categoryId)}\n" +
    "          />";
  const repl =
    "onOpenLesson={openLesson}\n" +
    "          />";
  assertOnce(s, needle, "PRACTICE");
  s = s.replace(needle, repl);
}

// --- Fix 4: reference case payload field: referenceRequest -> request ---
{
  const needle = "request={payload?.referenceRequest}";
  const repl = "request={payload?.request}";
  assertOnce(s, needle, "PAYLOAD_FIELD");
  s = s.replace(needle, repl);
}

if (s === orig) {
  console.error("NO_CHANGE");
  process.exit(4);
}

fs.writeFileSync(real, sjpg);
console.log("P11_FIXES_APPLIED");
