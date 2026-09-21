"use client";

import { useMemo } from "react";
import { LESSONS, PROGRAMS } from "@/content";
import { useProgress } from "./ProgressProvider";

/**
 * Compact XP-style progress readout for the sidebar. Counts are derived
 * from the actual curriculum (LESSONS and the programs that have test
 * cases), never hardcoded. Reset is deliberately small and confirm-gated.
 */
export function ProgressSummary() {
  const { hydrated, lessonsCompleted, programsCompleted, resetAllProgress } = useProgress();

  const practiceProgramCount = useMemo(
    () => PROGRAMS.filter((program) => (program.testCases?.length ?? 0) > 0).length,
    [],
  );

  const handleReset = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Reset all learning progress? This cannot be undone.")) {
      resetAllProgress();
    }
  };

  return (
    <div className="progress-summary">
      <div className="progress-summary-title">Progress</div>
      <dl className="progress-summary-list">
        <div className="progress-summary-row">
          <dt>Lessons</dt>
          <dd>{hydrated ? `${lessonsCompleted} / ${LESSONS.length}` : "\u2013"}</dd>
        </div>
        <div className="progress-summary-row">
          <dt>Practice Programs</dt>
          <dd>{hydrated ? `${programsCompleted} / ${practiceProgramCount}` : "\u2013"}</dd>
        </div>
      </dl>
      <button type="button" className="progress-reset" onClick={handleReset}>
        Reset progress
      </button>
    </div>
  );
}