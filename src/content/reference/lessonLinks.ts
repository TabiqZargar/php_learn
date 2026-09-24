import type { ReferenceCategoryId } from "@/lib/reference/types";

/**
 * Deep-link registry: curriculum slug → PHP Reference category.
 *
 * The learning content already links every program → its lessons through each
 * program's curriculumSlug + lessonReferences. This small table reuses that
 * same idea in one other direction: a lesson or program can carry exactly ONE
 * "PHP Reference" deep link. Grouping is deliberately not another navigation
 * subsystem — it is a single lookup, keyed by slug, that the shared "PHP
 * Reference" button consults. Lesson and program slugs are plain strings (no
 * unifying union exists in the learning domain) and a lesson and a program may
 * share a slug (sessions, cookies), which is exactly why keys are string and
 * the maps stay flat: one canonical row per slug, category wins.
 */
const REFERENCE_CATEGORY_BY_SLUG: Readonly<
  Partial<Record<string, ReferenceCategoryId>>
> = {
  // Lessons
  "php-introduction": "basics",
  syntax: "basics",
  variables: "variables",
  "data-types": "data-types",
  operators: "operators",
  conditionals: "conditionals",
  loops: "loops",
  functions: "functions",
  sessions: "sessions-and-cookies",
  cookies: "sessions-and-cookies",
  filesystem: "files",
  mysql: "mysql",
  "php-mysql-login": "authentication",
  // Programs
  "largest-number": "operators",
  factorial: "loops",
  "prime-number": "conditionals",
  "reverse-string": "strings",
  "lowercase-string": "strings",
  "array-sorting": "arrays",
  "sentence-parser": "strings",
  "file-create": "files",
  "file-append": "files",
  "file-delete": "files",
  "mysql-connect": "mysql",
  "mysql-create-table": "mysql",
  "mysql-insert-read": "mysql",
  "mysql-update": "mysql",
  "mysql-delete": "mysql",
};

/**
 * Category a slug's "PHP Reference" button opens. A slug not present in the
 * registry (e.g. mp3s: php programs that have no reference link) resolves to
 * undefined and the button simply does not render.
 */
export function getReferenceCategoryForSlug(
  slug: string,
): ReferenceCategoryId | undefined {
  return REFERENCE_CATEGORY_BY_SLUG[slug];
}
