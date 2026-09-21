"use client";

import type { LessonReference } from "@/lib/learning/types";

interface LessonReferencesProps {
  references: LessonReference[];
  /** Opens the referenced lesson in the Academy window. */
  onOpenLesson?: (lessonSlug: string) => void;
}

/**
 * Compact "Related Lessons" section shown after an evaluation. Each button
 * is keyboard-accessible and opens the matching lesson in the Academy via
 * the desktop manager.
 */
export function LessonReferences({ references, onOpenLesson }: LessonReferencesProps) {
  if (references.length === 0) return null;

  return (
    <section className="related-lessons" aria-label="Related lessons">
      <h2>Related Lessons</h2>
      <ul className="related-lessons-list">
        {references.map((reference) => (
          <li key={reference.lessonSlug}>
            <button
              type="button"
              className="related-lesson-button"
              onClick={() => onOpenLesson?.(reference.lessonSlug)}
            >
              {reference.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}