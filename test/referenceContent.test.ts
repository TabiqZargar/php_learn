import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { REFERENCE_ENTRIES } from "../src/content/reference/index.ts";
import {
  REFERENCE_CATEGORIES,
  getReferenceCategoryLabel,
} from "../src/content/reference/categories.ts";
import { getRelatedCurriculumForCategory } from "../src/content/reference/lessonLinks.ts";
import { LESSONS, PROGRAMS, getLessonBySlug, getProgramBySlug } from "../src/content/index.ts";
import { countReferenceMatches, searchReference } from "../src/lib/reference/search.ts";

const CATEGORY_IDS = REFERENCE_CATEGORIES.map((category) => category.id);
const ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

describe("reference categories", () => {
  test("the fixed category list is complete and uniquely labelled", () => {
    assert.equal(REFERENCE_CATEGORIES.length, 13);
    assert.equal(new Set(CATEGORY_IDS).size, REFERENCE_CATEGORIES.length);
    assert.equal(
      new Set(REFERENCE_CATEGORIES.map((category) => category.label)).size,
      REFERENCE_CATEGORIES.length,
    );
  });

  test("every category has a label and a description", () => {
    for (const category of REFERENCE_CATEGORIES) {
      assert.ok(category.label.trim().length > 0, `${category.id} missing label`);
      assert.ok(
        category.description.trim().length > 0,
        `${category.id} missing description`,
      );
      assert.equal(getReferenceCategoryLabel(category.id), category.label);
    }
  });

  test("every category has at least one entry", () => {
    for (const id of CATEGORY_IDS) {
      const count = REFERENCE_ENTRIES.filter((entry) => entry.categoryId === id).length;
      assert.ok(count > 0, `${id} has no entries`);
    }
  });
});

describe("reference entries", () => {
  test("every entry belongs to a declared category", () => {
    for (const entry of REFERENCE_ENTRIES) {
      assert.ok(
        CATEGORY_IDS.includes(entry.categoryId),
        `${entry.id} has unknown category "${entry.categoryId}"`,
      );
    }
  });

  test("entry ids are unique, lowercase and ASCII", () => {
    const ids = REFERENCE_ENTRIES.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate reference entry id");
    for (const id of ids) {
      assert.match(id, ID_PATTERN, `entry id "${id}" is not lowercase ASCII`);
    }
  });

  test("every entry has a name, a summary and at least one example", () => {
    for (const entry of REFERENCE_ENTRIES) {
      assert.ok(entry.name.trim().length > 0, `${entry.id} missing name`);
      assert.ok(entry.summary.trim().length > 0, `${entry.id} missing summary`);
      assert.ok(entry.examples.length > 0, `${entry.id} has no examples`);
    }
  });

  test("every example is a complete PHP snippet", () => {
    for (const entry of REFERENCE_ENTRIES) {
      for (const [index, example] of entry.examples.entries()) {
        const label = `${entry.id} example ${index + 1}`;
        assert.match(example.code, /^<\?php/, `${label} does not open with <?php`);
        // A trailing // comment after the last statement is the common case, so
        // comments are dropped before deciding whether a snippet ends cleanly.
        const body = example.code
          .replace(/^<\?php/, "")
          .replace(/\?>\s*$/, "")
          .replace(/\/\/[^\n]*/g, "")
          .trim();
        assert.ok(body.length > 0, `${label} has no statements`);
        assert.match(body, /[;}]$/, `${label} does not end a statement`);
      }
    }
  });

  test("notes and keywords, when present, are non-empty strings", () => {
    for (const entry of REFERENCE_ENTRIES) {
      for (const note of entry.notes ?? []) {
        assert.ok(note.trim().length > 0, `${entry.id} has an empty note`);
      }
      for (const keyword of entry.keywords ?? []) {
        assert.ok(keyword.trim().length > 0, `${entry.id} has an empty keyword`);
      }
    }
  });
});

describe("reference search", () => {
  test("an empty query matches nothing so the UI can fall back to the category", () => {
    assert.equal(searchReference(REFERENCE_ENTRIES, "   ", getReferenceCategoryLabel).length, 0);
    assert.equal(countReferenceMatches(REFERENCE_ENTRIES, "", getReferenceCategoryLabel), 0);
  });

  test("matching is case-insensitive and trims the query", () => {
    const lower = searchReference(REFERENCE_ENTRIES, "strlen", getReferenceCategoryLabel);
    const upper = searchReference(REFERENCE_ENTRIES, "  STRLEN  ", getReferenceCategoryLabel);
    assert.deepEqual(upper, lower);
    assert.ok(lower.length > 0);
  });

  test("every token must match, and each match is a real entry", () => {
    const results = searchReference(
      REFERENCE_ENTRIES,
      "array foreach",
      getReferenceCategoryLabel,
    );
    assert.ok(results.length > 0);
    for (const entry of results) {
      const haystack = [entry.name, entry.summary, entry.description ?? ""]
        .join(" ")
        .toLowerCase();
      assert.ok(haystack.includes("array"), `${entry.id} matched without "array"`);
      assert.ok(haystack.includes("foreach"), `${entry.id} matched without "foreach"`);
    }
  });

  test("a query with no match returns nothing", () => {
    assert.deepEqual(
      searchReference(REFERENCE_ENTRIES, "zzzznotaphptoken", getReferenceCategoryLabel),
      [],
    );
  });

  test("counting matches agrees with the result length", () => {
    for (const query of ["count", "session", "my", "cookie", "nope-nope"]) {
      assert.equal(
        countReferenceMatches(REFERENCE_ENTRIES, query, getReferenceCategoryLabel),
        searchReference(REFERENCE_ENTRIES, query, getReferenceCategoryLabel).length,
      );
    }
  });

  test("the category label is searchable", () => {
    const results = searchReference(REFERENCE_ENTRIES, "cookies", getReferenceCategoryLabel);
    assert.ok(results.length > 0);
    assert.ok(
      results.every((entry) => entry.categoryId === "sessions-and-cookies"),
      "category label matched an entry from another category",
    );
  });
});

describe("reference curriculum links", () => {
  test("every category links slugs that exist in the learning content", () => {
    for (const category of REFERENCE_CATEGORIES) {
      const related = getRelatedCurriculumForCategory(category.id);
      for (const slug of related.lessons) {
        assert.ok(getLessonBySlug(slug), `${category.id} -> unknown lesson "${slug}"`);
      }
      for (const slug of related.programs) {
        assert.ok(getProgramBySlug(slug), `${category.id} -> unknown program "${slug}"`);
      }
    }
  });

  test("every category links at least one lesson or program", () => {
    for (const category of REFERENCE_CATEGORIES) {
      const related = getRelatedCurriculumForCategory(category.id);
      assert.ok(
        related.lessons.length + related.programs.length > 0,
        `${category.id} links no curriculum`,
      );
    }
  });

  test("linked slugs are not repeated inside a category", () => {
    for (const category of REFERENCE_CATEGORIES) {
      const related = getRelatedCurriculumForCategory(category.id);
      assert.equal(new Set(related.lessons).size, related.lessons.length);
      assert.equal(new Set(related.programs).size, related.programs.length);
    }
  });

  test("every lesson and program reachable from a category is linked", () => {
    const linked = new Set<string>();
    for (const category of REFERENCE_CATEGORIES) {
      const related = getRelatedCurriculumForCategory(category.id);
      for (const slug of [...related.lessons, ...related.programs]) linked.add(slug);
    }
    for (const lesson of LESSONS) {
      if (linked.has(lesson.slug)) {
        assert.equal(
          REFERENCE_CATEGORIES.filter((category) =>
            getRelatedCurriculumForCategory(category.id).lessons.includes(lesson.slug),
          ).length,
          1,
          `${lesson.slug} is linked from more than one category`,
        );
      }
    }
    for (const program of PROGRAMS) {
      if (linked.has(program.slug)) {
        assert.equal(
          REFERENCE_CATEGORIES.filter((category) =>
            getRelatedCurriculumForCategory(category.id).programs.includes(program.slug),
          ).length,
          1,
          `${program.slug} is linked from more than one category`,
        );
      }
    }
  });
});
