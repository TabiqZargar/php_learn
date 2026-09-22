import type { Lesson, Program } from "@/lib/learning/types";

import { LESSON_PHP_INTRODUCTION } from "./lessons/php-introduction.ts";
import { LESSON_SYNTAX } from "./lessons/syntax.ts";
import { LESSON_VARIABLES } from "./lessons/variables.ts";
import { LESSON_DATA_TYPES } from "./lessons/data-types.ts";
import { LESSON_OPERATORS } from "./lessons/operators.ts";
import { LESSON_CONDITIONALS } from "./lessons/conditionals.ts";
import { LESSON_LOOPS } from "./lessons/loops.ts";
import { LESSON_FUNCTIONS } from "./lessons/functions.ts";
import { LESSON_SESSIONS } from "./lessons/sessions.ts";
import { LESSON_COOKIES } from "./lessons/cookies.ts";

import { PROGRAM_LARGEST_NUMBER } from "./programs/largest-number.ts";
import { PROGRAM_FACTORIAL } from "./programs/factorial.ts";
import { PROGRAM_PRIME_NUMBER } from "./programs/prime-number.ts";
import { PROGRAM_REVERSE_STRING } from "./programs/reverse-string.ts";
import { PROGRAM_LOWERCASE_STRING } from "./programs/lowercase-string.ts";
import { PROGRAM_ARRAY_SORTING } from "./programs/array-sorting.ts";
import { PROGRAM_SESSIONS } from "./programs/sessions.ts";
import { PROGRAM_SENTENCE_PARSER } from "./programs/sentence-parser.ts";
import { PROGRAM_COOKIES } from "./programs/cookies.ts";
import { PROGRAM_MYSQL_CONNECTION } from "./programs/mysql-connection.ts";
import { PROGRAM_FILE_OPERATIONS } from "./programs/file-operations.ts";
import { PROGRAM_MYSQL_LOGIN } from "./programs/mysql-login.ts";

/** All lessons ordered as the curriculum intends. */
export const LESSONS: Lesson[] = [
  LESSON_PHP_INTRODUCTION,
  LESSON_SYNTAX,
  LESSON_VARIABLES,
  LESSON_DATA_TYPES,
  LESSON_OPERATORS,
  LESSON_CONDITIONALS,
  LESSON_LOOPS,
  LESSON_FUNCTIONS,
  LESSON_SESSIONS,
  LESSON_COOKIES,
];

/** All practice programs in a sensible study order. */
export const PROGRAMS: Program[] = [
  PROGRAM_LARGEST_NUMBER,
  PROGRAM_FACTORIAL,
  PROGRAM_PRIME_NUMBER,
  PROGRAM_REVERSE_STRING,
  PROGRAM_LOWERCASE_STRING,
  PROGRAM_ARRAY_SORTING,
  PROGRAM_SESSIONS,
  PROGRAM_SENTENCE_PARSER,
  PROGRAM_COOKIES,
  PROGRAM_MYSQL_CONNECTION,
  PROGRAM_FILE_OPERATIONS,
  PROGRAM_MYSQL_LOGIN,
];

export const FIRST_LESSON = LESSONS[0];
export const FIRST_PROGRAM = PROGRAMS[0];

export function getLessonBySlug(slug: string | null): Lesson | undefined {
  return slug ? LESSONS.find((lesson) => lesson.slug === slug) : undefined;
}

export function getProgramBySlug(slug: string | null): Program | undefined {
  return slug ? PROGRAMS.find((program) => program.slug === slug) : undefined;
}