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
}: ProgramViewProps) {
  return (
    <article>
      <header className="view-header">
        <p className="view-kicker">
          Program {index + 1} of {total} &middot; {program.category} &middot;{" "}
          {program.difficulty}
        </p>
        <h1>{program.title}</h1>
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
        <XpButton disabled title="Running PHP is not available yet — planned for a future phase.">
          Run (coming soon)
        </XpButton>
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