"use client";

import { FIRST_LESSON } from "@/content";
import type { ResumeInfo } from "@/lib/progress/types";
import { useProgress } from "@/components/progress/ProgressProvider";
import { XpButton } from "@/components/ui/XpButton";

export interface ContinueTarget {
  type: ResumeInfo["type"];
  slug: string;
}

interface ContinueLearningProps {
  /** Opens the resume target (lesson in the Academy, program practice...). */
  onContinue: (target: ContinueTarget) => void;
}

/**
 * Compact "Continue Learning" card: resumes the last opened learning
 * location, or offers to start the curriculum when nothing is stored.
 * Renders nothing until progress has hydrated to keep SSR/client markup
 * identical. A completed target is still shown (with a "Review" action),
 * never skipped by an auto-redirect.
 */
export function ContinueLearning({ onContinue }: ContinueLearningProps) {
  const { hydrated, resumeTarget } = useProgress();

  if (!hydrated) return null;

  if (!resumeTarget) {
    return (
      <section className="resume-card" aria-label="Continue learning">
        <span className="resume-card-kind">PHP Basics</span>
        <span className="resume-card-title">Begin with {FIRST_LESSON.title}</span>
        <span className="resume-card-actions">
          <XpButton
            primary
            className="resume-card-button"
            onClick={() => onContinue({ type: "lesson", slug: FIRST_LESSON.slug })}
          >
            Start Learning
          </XpButton>
        </span>
      </section>
    );
  }

  const kindLabel = resumeTarget.type === "lesson" ? "Lesson" : "Program";
  const actionLabel = resumeTarget.completed
    ? "Review"
    : resumeTarget.type === "lesson"
      ? "Continue"
      : "Practice";

  return (
    <section
      className={`resume-card ${resumeTarget.completed ? "is-complete" : ""}`}
      aria-label="Continue learning"
    >
      <span className="resume-card-kind">
        {resumeTarget.completed ? "\u2713 Completed" : kindLabel}
      </span>
      <span className="resume-card-title">{resumeTarget.title}</span>
      <span className="resume-card-actions">
        <XpButton
          primary
          className="resume-card-button"
          onClick={() =>
            onContinue({ type: resumeTarget.type, slug: resumeTarget.slug })
          }
        >
          {actionLabel}
        </XpButton>
      </span>
    </section>
  );
}