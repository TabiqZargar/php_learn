"use client";

import { useState } from "react";
import { PROGRAMS, getProgramBySlug } from "@/content";
import type { Program } from "@/lib/learning/types";
import { previousIndex, nextIndex } from "@/lib/learning/navigation";
import { SideNav } from "@/components/navigation/SideNav";
import { ProgramList } from "./ProgramList";
import { ProgramView } from "./ProgramView";

interface ProgramsWindowProps {
  /** Opens the practice window for a program in the desktop manager. */
  onOpenPractice?: (program: Program) => void;
}

/**
 * The standalone Programs window: a program library browsable
 * independently from the academy. Reuses the shared list + views.
 */
export function ProgramsWindow({ onOpenPractice }: ProgramsWindowProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(PROGRAMS[0].slug);
  const program = getProgramBySlug(selectedSlug);

  const programIndex = program ? PROGRAMS.findIndex((p) => p.id === program.id) : -1;
  const prevProgramIndex =
    programIndex >= 0 ? previousIndex(programIndex, PROGRAMS.length) : undefined;
  const nextProgramIndex =
    programIndex >= 0 ? nextIndex(programIndex, PROGRAMS.length) : undefined;
  const prevProgram: Program | undefined =
    prevProgramIndex !== undefined ? PROGRAMS[prevProgramIndex] : undefined;
  const nextProgram: Program | undefined =
    nextProgramIndex !== undefined ? PROGRAMS[nextProgramIndex] : undefined;

  return (
    <div className="academy-layout">
      <SideNav title="Programs">
        <ProgramList programs={PROGRAMS} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
      </SideNav>
      <main className="academy-content" id="program-library-view">
        {program ? (
          <ProgramView
            program={program}
            index={programIndex}
            total={PROGRAMS.length}
            prevLabel={prevProgram?.title}
            nextLabel={nextProgram?.title}
            onPrev={prevProgram ? () => setSelectedSlug(prevProgram.slug) : undefined}
            onNext={nextProgram ? () => setSelectedSlug(nextProgram.slug) : undefined}
            onOpenPractice={onOpenPractice}
          />
        ) : null}
      </main>
    </div>
  );
}