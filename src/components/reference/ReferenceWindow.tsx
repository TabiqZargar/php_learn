"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ReferenceCategoryId, ReferenceEntry } from "@/lib/reference/types";
import {
  REFERENCE_CATEGORIES,
  getReferenceCategoryLabel,
} from "@/content/reference/categories";
import { REFERENCE_ENTRIES } from "@/content/reference";
import { getRelatedCurriculumForCategory } from "@/content/reference/lessonLinks";
import { getLessonBySlug, getProgramBySlug } from "@/content";
import { searchReference } from "@/lib/reference/search";
import { ReferenceIcon } from "@/components/icons/AppIcons";

export interface ReferenceWindowProps {
  /** Opens a related lesson in the Academy window. */
  onOpenLesson?: (lessonSlug: string) => void;
  /** Opens a related practice program in the practice window. */
  onOpenProgram?: (programSlug: string) => void;
}

const EMPTY_QUERY = "";
const COPY_RESET_MS = 1600;

/**
 * The PHP Reference window: a category sidebar, a client-side search box and a
 * read-only detail view for one entry. Examples are never run here — they are
 * authored snippets shown verbatim, with an optional output line beneath, so
 * the reference stays a read-only companion to the practice window.
 *
 * Copying is the only action an example offers, and it copies the code only
 * (never the output). It degrades gracefully: if the clipboard API is missing
 * or rejects, a short status line explains that instead of failing silently.
 * The detail view also lists the lessons and programs that cover the entry's
 * category, which the desktop wires to its own lesson/practice windows.
 */
export function ReferenceWindow({
  onOpenLesson,
  onOpenProgram,
}: ReferenceWindowProps) {
  const [query, setQuery] = useState(EMPTY_QUERY);
  const [activeCategoryId, setActiveCategoryId] = useState<ReferenceCategoryId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async (code: string) => {
    setCopyStatus(null);
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyStatus("Copy is unavailable in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setCopyStatus("Copied to clipboard.");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedCode(null), COPY_RESET_MS);
    } catch {
      setCopyStatus("Copy failed. Select the code and copy it manually.");
    }
  };

  const trimmedQuery = query.trim();
  const filtered = useMemo(() => {
    if (trimmedQuery.length === 0) {
      return activeCategoryId === null
        ? REFERENCE_ENTRIES
        : REFERENCE_ENTRIES.filter((entry) => entry.categoryId === activeCategoryId);
    }
    return searchReference(REFERENCE_ENTRIES, trimmedQuery, getReferenceCategoryLabel);
  }, [trimmedQuery, activeCategoryId]);

  const selectedEntry =
    selectedId === null
      ? null
      : (filtered.find((entry) => entry.id === selectedId) ?? null);

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const first = filtered[0];
      if (first) setSelectedId(first.id);
    }
  };

  const onSelectCategory = (next: ReferenceCategoryId | null) => {
    setActiveCategoryId(next);
    setSelectedId(null);
    searchRef.current?.focus();
  };

  return (
    <div className="reference-body">
      <aside className="reference-side">
        <p className="reference-side-title">
          <ReferenceIcon size={14} />
          <span>Categories</span>
        </p>
        <ul className="reference-categories">
          <li>
            <button
              type="button"
              className={[
                "reference-category-button",
                activeCategoryId === null ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={activeCategoryId === null}
              onClick={() => onSelectCategory(null)}
            >
              All categories
            </button>
          </li>
          {REFERENCE_CATEGORIES.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                className={[
                  "reference-category-button",
                  activeCategoryId === category.id ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={activeCategoryId === category.id}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="reference-main">
        <div className="reference-search-row">
          <label htmlFor="reference-search" className="reference-search-label">
            Search PHP Reference
          </label>
          <input
            ref={searchRef}
            id="reference-search"
            className="reference-search-input"
            type="search"
            value={query}
            placeholder="e.g. foreach, strlen, count"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
            onKeyDown={onSearchKeyDown}
          />
          <p className="reference-result-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="reference-empty">
            {trimmedQuery.length > 0
              ? `No entries match "${trimmedQuery}".`
              : "No entries in this category yet."}
          </p>
        ) : (
          <ul className="reference-list">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={[
                    "reference-item",
                    selectedId === entry.id ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={selectedId === entry.id}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className="reference-item-name">{entry.name}</span>
                  <span className="reference-item-summary">{entry.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="reference-copy-status" role="status">
          {copyStatus}
        </p>

        {selectedEntry ? (
          <ReferenceDetail
            entry={selectedEntry}
            copiedCode={copiedCode}
            onCopy={handleCopy}
            onOpenLesson={onOpenLesson}
            onOpenProgram={onOpenProgram}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReferenceDetail({
  entry,
  copiedCode,
  onCopy,
  onOpenLesson,
  onOpenProgram,
}: {
  entry: ReferenceEntry;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  onOpenLesson?: (lessonSlug: string) => void;
  onOpenProgram?: (programSlug: string) => void;
}) {
  const related = getRelatedCurriculumForCategory(entry.categoryId);
  const relatedLessons = related.lessons
    .map((slug) => getLessonBySlug(slug))
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined);
  const relatedPrograms = related.programs
    .map((slug) => getProgramBySlug(slug))
    .filter((program): program is NonNullable<typeof program> => program !== undefined);

  return (
    <article className="reference-detail">
      <h2 className="reference-detail-name">{entry.name}</h2>
      <p className="reference-detail-category">
        {getReferenceCategoryLabel(entry.categoryId)}
      </p>
      {entry.summary ? <p className="reference-detail-summary">{entry.summary}</p> : null}
      {entry.signature ? (
        <pre className="reference-detail-signature">
          <code>{entry.signature}</code>
        </pre>
      ) : null}
      {entry.description ? (
        <p className="reference-detail-description">{entry.description}</p>
      ) : null}
      {entry.examples.map((example, index) => (
        <figure className="reference-example" key={index}>
          <figcaption className="reference-example-head">
            <span>Example {index + 1}</span>
            <button
              type="button"
              className="reference-copy-button xp-button"
              onClick={() => onCopy(example.code)}
            >
              {copiedCode === example.code ? "Copied" : "Copy"}
            </button>
          </figcaption>
          <pre className="reference-example-code">
            <code>{example.code}</code>
          </pre>
          {example.output !== undefined ? (
            <p className="reference-example-output">
              <span className="reference-output-label">Output &middot;</span>{" "}
              {example.output}
            </p>
          ) : null}
        </figure>
      ))}
      {entry.notes && entry.notes.length > 0 ? (
        <section className="reference-notes" aria-label="Notes">
          <h3 className="reference-notes-heading">Notes</h3>
          <ul className="reference-notes-list">
            {entry.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {relatedLessons.length > 0 || relatedPrograms.length > 0 ? (
        <section className="reference-related" aria-label="Related curriculum">
          <h3 className="reference-related-heading">Learn this in the Academy</h3>
          <ul className="reference-related-list">
            {relatedLessons.map((lesson) => (
              <li key={`lesson-${lesson.slug}`}>
                <button
                  type="button"
                  className="reference-related-button"
                  disabled={!onOpenLesson}
                  onClick={() => onOpenLesson?.(lesson.slug)}
                >
                  <span className="reference-related-kind">Lesson</span>
                  <span className="reference-related-title">{lesson.title}</span>
                </button>
              </li>
            ))}
            {relatedPrograms.map((program) => (
              <li key={`program-${program.slug}`}>
                <button
                  type="button"
                  className="reference-related-button"
                  disabled={!onOpenProgram || !program.practice}
                  onClick={() => onOpenProgram?.(program.slug)}
                >
                  <span className="reference-related-kind">Program</span>
                  <span className="reference-related-title">{program.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {entry.keywords && entry.keywords.length > 0 ? (
        <p className="reference-keywords">
          <span className="reference-keywords-label">Keywords</span>{" "}
          {entry.keywords.map((keyword) => (
            <span key={keyword} className="reference-keyword">
              {keyword}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
