/**
 * Shared, strongly typed models for the PHP Reference content layer.
 * UI components consume these types only — content lives in src/content/reference.
 */

/** The fixed set of grouped topic areas in the PHP Reference. */
export type ReferenceCategoryId =
  | "basics"
  | "variables"
  | "data-types"
  | "operators"
  | "conditionals"
  | "loops"
  | "functions"
  | "strings"
  | "arrays"
  | "sessions-and-cookies"
  | "files"
  | "mysql"
  | "authentication";

export interface ReferenceCategory {
  id: ReferenceCategoryId;
  /** Display name shown in the sidebar, e.g. "Strings". */
  label: string;
  /** One-line description rendered at the top of the category view. */
  description: string;
}

/** A runnable-looking PHP snippet rendered read-only in the reference UI. */
export interface ReferenceExample {
  code: string;
  /** Optional output shown below the code, e.g. "5". */
  output?: string;
}

export interface ReferenceEntry {
  /** Stable unique key within the reference (no spaces), e.g. "strlen". */
  id: string;
  /** Human-friendly name, e.g. "strlen()" or "Conditions: if / else". */
  name: string;
  categoryId: ReferenceCategoryId;
  /** One-line summary shown in lists and search results. */
  summary: string;
  /** PHP signature, rendered mono. Omit for language constructs. */
  signature?: string;
  /** Longer explanation shown on the detail view. */
  description?: string;
  /** One or more short examples. */
  examples: ReferenceExample[];
  /**
   * Extra searchable aliases/related terms not already in name/summary/
   * signature (lowercased at match time). Never the app's real secrets.
   */
  keywords?: string[];
  /** Optional bullet take-aways shown on the detail view. */
  notes?: string[];
}