"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ReferenceCategoryId, ReferenceEntry } from "@/lib/reference/types";
import { getReferenceCategoryLabel } from "@/content/reference/categories";
import { REFERENCE_CATEGORIES } from "@/content/reference/categories";
import { REFERENCE_ENTRIES } from "@/content/reference";
import { searchReference } from "@/lib/reference/search";
import { ReferenceIcon } from "@/components/icons/AppIcons";

export interface ReferenceWindowProps {
  /** Category to show on open (deep link from a lesson or program). */
  categoryId?: ReferenceCategoryId;
  /** Bumped when a related lesson/program deep-links here again. */
  request?: number;
}

const EMPTY_QUERY = "";

/**
 * Small "copy example" affordance: copying only the code (never the output),
 * showing a temporary "Copied" state)Skip a window that uses the same
 * read-only code rendering as the rest of the sandbox. Copy failures degrade
 * gracefully — see ReferenceDetail's use of navigator.clipboard.
 */
export function ReferenceWindow({ categoryId, request }: ReferenceWindowProps) {
  const [query, setQuery] = useState(EMPTY_QUERY);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Deep link: an outside click (lesson/program → PHP Reference) sets the
  // category and bumps `request`, remounting this window so repeated clicks on
  // the same entry still re-open it cleanly — same contract the academy window
  // uses for lessons.
  const [activeCategoryId, setActiveCategoryId] = useState<ReferenceCategoryId | null>(
    categoryId ?? null,
  );

  const handleCopy = async (code: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyFailed(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyFailed(true);
    }
  };

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (trimmedQuery.length === 0) {
      return activeCategoryId === null
        ? REFERENCE_ENTRIES
        : REFERENCE_ENTRIES.filter((e) => e.categoryId === activeCategoryId);
    }
    return searchReference(REFERENCE_ENTRIES, trimmedQuery, getReferenceCategoryLabel);
  }, [trimmedQuery, activeCategoryId]);

  const categories = REFERENCE_CATEGORIES;

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntry =
    selectedId === null
      ? null
      : (filtered.find((e) => e.id === selectedId) ?? null);

  return (
    <div className="reference-body">
      <aside className="reference-side">
        <p className="reference-section-label">Categories</p>
        <ul className="reference-categories">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                className={[
                  "reference-category-button",
                  activeCategoryId === cat.id ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={activeCategoryId === cat.id}
                aria-current={activeCategoryId === cat.id ? "true" : undefined}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.label}
              </button>
            </li>
          ))}
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
              onClick={() => setActiveCategoryId(null)}
            >
              All categories
            </button>
          </li>
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
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            placeholder="e.g. foreach, strlen, count"
            aria-label="Search PHP Reference"
          />
        </div>

        <p className="reference-result-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </p>

        {filtered.length === 0 ? (
          <p className="reference-empty">
            {trimmedQuery.length > 0
              ? `No entries match "${query.trim()}".`
              : "Pick a category to see its entries."}
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

        {selectedEntry ? (
          <ReferenceDetail
            entry={selectedEntry}
            copied={copied}
            onCopy={handleCopy}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReferenceDetail({
  entry,
  copied,
  onCopy,
}: {
  entry: ReferenceEntry;
  copied: boolean;
  onCopy: (code: string) => void;
}) {
  return (
    <article className="reference-detail">
      <h2 className="reference-detail-name">{entry.name}</h2>
      {entry.summary ? <p className="reference-detail-summary">{entry.summary}</p> : null}
      {entry.signature ? (
        <pre className="reference-detail-signature">
          <code>{entry.signature}</code>
        </pre>
      ) : null}
      {entry.description ? (
        <p className="reference-detail-description">{entry.description}</p>
      ) : null}
      {entry.examples.map((example, i) => (
        <figure className="reference-example" key={i}>
          <figcaption className="reference-example-head">
            <span>Example {i + 1}</span>
            <button
              type="button"
              className="reference-copy-button xp-button"
              onClick={() => onCopy(example.code)}
            >
              {copied ? "Copied" : "Copy"}
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
      {entry.keywords && entry.keywords.length > 0 ? (
        <p className="reference-keywords">
          <span className="reference-keywords-label">Keywords</span>{" "}
          {entry.keywords.map((k) => (
            <span key={k} className="reference-keyword">
              {k}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
