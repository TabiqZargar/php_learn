"use client";

import type { LessonReference, ProgramHint } from "@/lib/learning/types";
import type { EvaluationResult } from "@/lib/practice/evaluation";
import { FEEDBACK_GUIDANCE } from "@/lib/practice/feedback";
import { HintPanel } from "./HintPanel";
import { LessonReferences } from "./LessonReferences";

interface FeedbackPanelProps {
  /** Latest Check Solution result; null before the first check or after Reset. */
  evaluation: EvaluationResult | null;
  hints: ProgramHint[];
  revealedCount: number;
  onRevealHint: () => void;
  references: LessonReference[];
  onOpenLesson?: (lessonSlug: string) => void;
}

/**
 * Status-based feedback + progressive hints + related lessons, stacked
 * below the output strip. Guidance is driven purely by the evaluation
 * status (no output matching, no AI diagnosis) and never auto-reveals
 * hints on a passing result.
 */
export function FeedbackPanel({
  evaluation,
  hints,
  revealedCount,
  onRevealHint,
  references,
  onOpenLesson,
}: FeedbackPanelProps) {
  const guidance = evaluation ? FEEDBACK_GUIDANCE[evaluation.status] : null;

  return (
    <div className="feedback-panel" aria-label="Feedback">
      {evaluation && guidance ? (
        <div className={`feedback-guidance ${evaluation.status === "passed" ? "is-pass" : "is-help"}`}>
          <h3 className="feedback-heading">{guidance.heading}</h3>
          <p className="feedback-body">{guidance.body}</p>
        </div>
      ) : null}

      <HintPanel
        hints={hints}
        revealedCount={revealedCount}
        onReveal={onRevealHint}
      />

      {evaluation ? (
        <LessonReferences references={references} onOpenLesson={onOpenLesson} />
      ) : null}
    </div>
  );
}