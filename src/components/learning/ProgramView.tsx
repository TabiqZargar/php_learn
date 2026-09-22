"use client";

import { useEffect, useRef } from "react";
import type { Program } from "@/lib/learning/types";
import { CodeBlock } from "./CodeBlock";
import { SectionHeading } from "./SectionHeading";
import { PagerNav } from "./PagerNav";
import { XpButton } from "@/components/ui/XpButton";

interface ProgramViewProps {
  program: Program;
  index: number;
  total: number;
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  /** When provided, a Practice entry opens for supported programs. */
  onOpenPractice?: (program: Program) => void;
}

/** Renders one program: problem, concepts, code, output, explanation. */
export function ProgramView({
  program,
  index,
  total,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  onOpenPractice,
}: ProgramViewProps) {
  // Focus moves to the program heading when navigation switches programs
  // (skipped on the first render so page load stays unassertive).
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [program.slug]);

  return (
    <article>
      <header className="view-header">
        <p className="view-kicker">
          Program {index + 1} of {total} &middot; {program.category} &middot;{" "}
          {program.difficulty}
        </p>
        <h1 ref={headingRef} tabIndex={-1}>
          {program.title}
        </h1>
        <p className="lead">{program.description}</p>
      </header>

      <SectionHeading>Problem</SectionHeading>
      <p className="lesson-explanation">{program.problemStatement}</p>

      <SectionHeading>Concepts</SectionHeading>
      <ul className="lesson-notes">
        {program.concepts.map((concept) => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>

      <SectionHeading>PHP Code</SectionHeading>
      <CodeBlock
        code={program.code}
        output={program.expectedOutput}
        outputLabel="Expected Output"
        label={`${program.slug}.php`}
      />

      <SectionHeading>Explanation</SectionHeading>
      <p className="lesson-explanation">{program.explanation}</p>

      {program.notes && program.notes.length > 0 ? (
        <>
          <SectionHeading>Notes</SectionHeading>
          <ul className="lesson-notes">
            {program.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="program-actions">
        {onOpenPractice && program.practice ? (
          <div className="program-actions-row">
            <XpButton
              primary
              onClick={() => onOpenPractice(program)}
              aria-label={`Open ${program.title} in practice mode`}
            >
              Practice
            </XpButton>
            <span className="practice-hint-text">
              Edit starter code, set the inputs, and run a simulated check.
            </span>
          </div>
        ) : (
          <XpButton
            disabled
            title="Practice mode arrives for this program in a later phase."
          >
            Practice (coming soon)
          </XpButton>
        )}
      </div>

      <PagerNav
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        onPrev={onPrev}
        onNext={onNext}
      />
    </article>
  );
}