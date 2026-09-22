/**
 * Shared, strongly typed models for the learning content layer.
 * UI components consume these types only — content lives in src/content.
 */
import type { PracticeConfig, PracticeInput } from "@/lib/practice/types";

export type LessonCategory = "basics";

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** A runnable-looking code sample rendered read-only in the UI. */
export interface CodeSample {
  /** PHP source, indentation preserved. */
  code: string;
  /** Optional sample output shown below the code. */
  output?: string;
  /** Label for the output block ("Output" by default). */
  outputLabel?: string;
}

/** One block within a lesson (heading/explanation/code/notes). */
export interface LessonSection {
  heading: string;
  /** Plain-text explanation; blank lines are preserved as paragraphs. */
  explanation?: string;
  code?: CodeSample;
  /** Bulleted take-away points. */
  notes?: string[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  category: LessonCategory;
  description: string;
  /** Position within the curriculum; used for prev/next navigation. */
  order: number;
  estimatedMinutes: number;
  sections: LessonSection[];
}

export interface ProgramTestCase {
  /** Stable key referenced by the evaluation API results (no spaces). */
  id: string;
  /** Human-friendly label shown in the result panel (e.g. "Negative values"). */
  name: string;
  /** Values the student's code receives as CLI arguments, in order. */
  inputs: PracticeInput[];
  /** Exact output the program must print (whitespace/line-ending differences are tolerated). */
  expectedOutput: string;
}

/**
 * One HTTP request in a stateful test case. Consecutive steps share the same
 * isolated practice session (same PHP $_SESSION and cookie jar) so learners
 * genuinely exercise request-to-request state.
 */
export interface StatefulTestStep {
  /** Values sent as POST form fields for this request. */
  inputs: Record<string, string>;
  /** Exact output the request must produce. */
  expectedOutput: string;
  /**
   * Optional jar-state assertions checked after the step. A value string must
   * be present in the cookie jar; null means the cookie must be absent.
   */
  expectedCookies?: Record<string, string | null>;
}

/** A graded stateful scenario: a fresh isolated session plus sequential steps. */
export interface StatefulTestCase {
  /** Stable key referenced in evaluation results (no spaces). */
  id: string;
  /** Human-friendly label shown in the result panel. */
  name: string;
  /** Steps executed in order; the test stops at the first failing step. */
  steps: StatefulTestStep[];
}

/** One progressive hint in a program's practice sequence. */
export interface ProgramHint {
  /** Unique id within the program (used as a stable key). */
  id: string;
  /** Short thematic label, e.g. "Conceptual direction". */
  title: string;
  /**
   * Hint body. Progressively more specific across the sequence, but NEVER
   * a complete solution — no code snippets or copy-paste answers.
   */
  content: string;
}

/** A related lesson promoted after an evaluation, opening it in the Academy. */
export interface LessonReference {
  /** Must resolve to an existing lesson slug in the curriculum. */
  lessonSlug: string;
  /** Human-friendly link label shown in the related-lessons list. */
  label: string;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  problemStatement: string;
  /** Bullet list of the ideas the solution demonstrates. */
  concepts: string[];
  /** Full PHP source, read-only. */
  code: string;
  /** What the script prints when run against the sample inputs. */
  expectedOutput?: string;
  explanation: string;
  notes?: string[];
  /** Practice workspace for this program (present = Practice mode supported). */
  practice?: PracticeConfig;
  /** Graded test cases for Check Solution (present = evaluation supported). */
  testCases?: ProgramTestCase[];
  /**
   * Graded stateful scenarios for execution === "stateful" programs. A
   * program uses exactly one of testCases or statefulTestCases.
   */
  statefulTestCases?: StatefulTestCase[];
  /**
   * Progressive guided hints shown in the practice window. Present when
   * hints are authored for the program; a program always has 0 or 3 hints.
   */
  hints?: ProgramHint[];
  /** Related lessons promoted after an evaluation (composition over time). */
  lessonReferences?: LessonReference[];
}