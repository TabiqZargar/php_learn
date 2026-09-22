"use client";

import type { Program } from "@/lib/learning/types";
import { SideNavItem } from "@/components/navigation/SideNav";
import { useProgress } from "@/components/progress/ProgressProvider";

interface ProgramListProps {
  programs: Program[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

/**
 * Reusable list of program entries for the XP side pane. Programs with
 * test cases show their persisted progress; unchecked (view-only) programs
 * show no metadata.
 */
export function ProgramList({ programs, selectedSlug, onSelect }: ProgramListProps) {
  const { getProgramProgress } = useProgress();

  return (
    <>
      {programs.map((program) => {
        const progress = getProgramProgress(program.slug);
        const completed = progress?.completed === true;
        const best = progress?.bestPassed !== undefined ? progress.bestPassed : 0;
        const bestTotal = progress?.bestTotal ?? 0;
        const hasAttempt =
          progress?.lastStatus !== undefined &&
          (bestTotal > 0 || (progress.lastPassed ?? 0) > 0);

        const hasTestCases = (program.testCases?.length ?? 0) > 0;
        let meta: string | string[] | undefined;
        let ariaLabel: string | undefined;

        if (hasTestCases) {
          if (completed) {
            meta = ["Completed", `Best: ${best}/${bestTotal} tests`];
            ariaLabel = `${program.title}, completed, best ${best} of ${bestTotal} tests passed`;
          } else if (hasAttempt) {
            meta = `Best: ${best}/${bestTotal} tests`;
            ariaLabel = `${program.title}, best ${best} of ${bestTotal} tests passed`;
          } else {
            meta = "Not attempted";
            ariaLabel = `${program.title}, not attempted`;
          }
        } else {
          // View-only programs (no test cases yet) are clearly marked and
          // never counted as incomplete practice.
          meta = "View only";
          ariaLabel = `${program.title}, view only`;
        }

        return (
          <SideNavItem
            key={program.id}
            label={program.title}
            selected={program.slug === selectedSlug}
            complete={completed}
            meta={meta}
            ariaLabel={ariaLabel}
            onSelect={() => onSelect(program.slug)}
          />
        );
      })}
    </>
  );
}