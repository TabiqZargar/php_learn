/**
 * Shared, strongly typed models for the learning content layer.
 * UI components consume these types only — content lives in src/content.
 */
import type { PracticeConfig } from "@/lib/practice/types";

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
  /** Optional guided hints, intended for a later phase. */
  hints?: string[];
  // Extensions land with the execution engine: testCases, hints, solution.
}