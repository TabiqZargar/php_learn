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
import { LESSON_FILESYSTEM } from "./lessons/filesystem.ts";
import { LESSON_MYSQL } from "./lessons/mysql.ts";
import { LESSON_PHP_MYSQL_LOGIN } from "./lessons/php-mysql-login.ts";

import { PROGRAM_LARGEST_NUMBER } from "./programs/largest-number.ts";
import { PROGRAM_FACTORIAL } from "./programs/factorial.ts";
import { PROGRAM_PRIME_NUMBER } from "./programs/prime-number.ts";
import { PROGRAM_REVERSE_STRING } from "./programs/reverse-string.ts";
import { PROGRAM_LOWERCASE_STRING } from "./programs/lowercase-string.ts";
import { PROGRAM_ARRAY_SORTING } from "./programs/array-sorting.ts";
import { PROGRAM_SESSIONS } from "./programs/sessions.ts";
import { PROGRAM_SENTENCE_PARSER } from "./programs/sentence-parser.ts";
import { PROGRAM_COOKIES } from "./programs/cookies.ts";
import { PROGRAM_FILE_CREATE } from "./programs/file-create.ts";
import { PROGRAM_FILE_APPEND } from "./programs/file-append.ts";
import { PROGRAM_FILE_DELETE } from "./programs/file-delete.ts";
import { PROGRAM_MYSQL_CONNECT } from "./programs/mysql-connect.ts";
import { PROGRAM_MYSQL_CREATE_TABLE } from "./programs/mysql-create-table.ts";
import { PROGRAM_MYSQL_INSERT_READ } from "./programs/mysql-insert-read.ts";
import { PROGRAM_MYSQL_UPDATE } from "./programs/mysql-update.ts";
import { PROGRAM_MYSQL_DELETE } from "./programs/mysql-delete.ts";
import { PROGRAM_PHP_MYSQL_LOGIN } from "./programs/php-mysql-login.ts";

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
  LESSON_FILESYSTEM,
  LESSON_MYSQL,
  LESSON_PHP_MYSQL_LOGIN,
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
  PROGRAM_FILE_CREATE,
  PROGRAM_FILE_APPEND,
  PROGRAM_FILE_DELETE,
  PROGRAM_MYSQL_CONNECT,
  PROGRAM_MYSQL_CREATE_TABLE,
  PROGRAM_MYSQL_INSERT_READ,
  PROGRAM_MYSQL_UPDATE,
  PROGRAM_MYSQL_DELETE,
  PROGRAM_PHP_MYSQL_LOGIN,
];

export const FIRST_LESSON = LESSONS[0];
export const FIRST_PROGRAM = PROGRAMS[0];

export function getLessonBySlug(slug: string | null): Lesson | undefined {
  return slug ? LESSONS.find((lesson) => lesson.slug === slug) : undefined;
}

export function getProgramBySlug(slug: string | null): Program | undefined {
  return slug ? PROGRAMS.find((program) => program.slug === slug) : undefined;
}