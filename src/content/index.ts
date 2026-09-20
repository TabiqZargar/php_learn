import type { Lesson, Program } from "@/lib/learning/types";

import { LESSON_PHP_INTRODUCTION } from "./lessons/php-introduction";
import { LESSON_SYNTAX } from "./lessons/syntax";
import { LESSON_VARIABLES } from "./lessons/variables";
import { LESSON_DATA_TYPES } from "./lessons/data-types";
import { LESSON_OPERATORS } from "./lessons/operators";
import { LESSON_CONDITIONALS } from "./lessons/conditionals";
import { LESSON_LOOPS } from "./lessons/loops";
import { LESSON_FUNCTIONS } from "./lessons/functions";

import { PROGRAM_LARGEST_NUMBER } from "./programs/largest-number";
import { PROGRAM_FACTORIAL } from "./programs/factorial";
import { PROGRAM_PRIME_NUMBER } from "./programs/prime-number";
import { PROGRAM_REVERSE_STRING } from "./programs/reverse-string";
import { PROGRAM_LOWERCASE_STRING } from "./programs/lowercase-string";
import { PROGRAM_ARRAY_SORTING } from "./programs/array-sorting";
import { PROGRAM_SESSIONS } from "./programs/sessions";
import { PROGRAM_SENTENCE_PARSER } from "./programs/sentence-parser";
import { PROGRAM_COOKIES } from "./programs/cookies";
import { PROGRAM_MYSQL_CONNECTION } from "./programs/mysql-connection";
import { PROGRAM_FILE_OPERATIONS } from "./programs/file-operations";
import { PROGRAM_MYSQL_LOGIN } from "./programs/mysql-login";

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