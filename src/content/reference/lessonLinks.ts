import type { ReferenceCategoryId } from "@/lib/reference/types";

interface CategoryCurriculum {
  lessons: readonly string[];
  programs: readonly string[];
}

/**
 * Which curriculum material covers each PHP Reference category.
 *
 * The learning content already links every program → its lessons through each
 * program's curriculumSlug + lessonReferences. This table reuses that same idea
 * in the other direction: the reference detail view suggests the lessons and
 * programs that teach a category, so a reader can jump from a syntax entry to
 * the lesson that explains it.
 *
 * Grouping is deliberately not another navigation subsystem — it is a single
 * flat table keyed by category. Lesson and program slugs are plain strings (no
 * unifying union exists in the learning domain) and a lesson and a program may
 * share a slug (sessions, cookies, php-mysql-login), which is exactly why the
 * two are kept in separate lists instead of one deduplicated map.
 */
const CURRICULUM_BY_CATEGORY: Readonly<Record<ReferenceCategoryId, CategoryCurriculum>> = {
  basics: { lessons: ["php-introduction", "syntax"], programs: [] },
  variables: { lessons: ["variables"], programs: [] },
  "data-types": { lessons: ["data-types"], programs: [] },
  operators: { lessons: ["operators"], programs: ["largest-number"] },
  conditionals: { lessons: ["conditionals"], programs: ["prime-number"] },
  loops: { lessons: ["loops"], programs: ["factorial"] },
  functions: { lessons: ["functions"], programs: [] },
  strings: { lessons: [], programs: ["reverse-string", "lowercase-string", "sentence-parser"] },
  arrays: { lessons: [], programs: ["array-sorting"] },
  "sessions-and-cookies": {
    lessons: ["sessions", "cookies"],
    programs: ["sessions", "cookies"],
  },
  files: { lessons: ["filesystem"], programs: ["file-create", "file-append", "file-delete"] },
  mysql: {
    lessons: ["mysql"],
    programs: [
      "mysql-connect",
      "mysql-create-table",
      "mysql-insert-read",
      "mysql-update",
      "mysql-delete",
    ],
  },
  authentication: {
    lessons: ["php-mysql-login"],
    programs: ["php-mysql-login"],
  },
};

/** Curriculum slugs that cover a reference category, as two ordered lists. */
export function getRelatedCurriculumForCategory(categoryId: ReferenceCategoryId): {
  lessons: readonly string[];
  programs: readonly string[];
} {
  return CURRICULUM_BY_CATEGORY[categoryId];
}
