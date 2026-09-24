import type { ReferenceEntry } from "./types";

/** Lowercased haystack built once per entry for fast repeated matching. */
interface MatchableEntry {
  entry: ReferenceEntry;
  haystack: string;
  categoryLabel: string;
}

/**
 * Build the search haystack for an entry: name, summary, signature,
 * description, keywords, notes and the owning category label. Everything is
 * lowercased so lookups are case-insensitive; all occurrences are matched.
 */
function toMatchable(
  entries: readonly ReferenceEntry[],
  categoryLabel: (categoryId: ReferenceEntry["categoryId"]) => string,
): MatchableEntry[] {
  return entries.map((entry) => ({
    entry,
    categoryLabel: categoryLabel(entry.categoryId).toLowerCase(),
    haystack: [
      entry.name,
      entry.summary,
      entry.signature,
      entry.description,
      ...(entry.keywords ?? []),
      ...(entry.notes ?? []),
    ]
      .filter((value): value is string => typeof value === "string")
      .join("\n")
      .toLowerCase(),
  }));
}

/**
 * Lightweight, dependency-free client search over the reference entries.
 * A query matches when every whitespace-separated token appears somewhere
 * in the entry's name, summary, signature, description, keywords, notes or
 * category label. Results keep the reference's authored order so the UI
 * stays deterministic. An empty/whitespace query returns no results.
 */
export function searchReference(
  entries: readonly ReferenceEntry[],
  query: string,
  categoryLabel: (categoryId: ReferenceEntry["categoryId"]) => string,
): ReferenceEntry[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const index = toMatchable(entries, categoryLabel);
  return index
    .filter((match) => tokens.every((token) => match.haystack.includes(token)))
    .map((match) => match.entry);
}

/** Count entries matching the query (used by tests and the UI result header). */
export function countReferenceMatches(
  entries: readonly ReferenceEntry[],
  query: string,
  categoryLabel: (categoryId: ReferenceEntry["categoryId"]) => string,
): number {
  return searchReference(entries, query, categoryLabel).length;
}