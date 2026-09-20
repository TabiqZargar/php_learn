import type { Lesson } from "@/lib/learning/types";
import { CodeBlock } from "./CodeBlock";
import { PagerNav } from "./PagerNav";

interface LessonViewProps {
  lesson: Lesson;
  index: number;
  total: number;
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

/** Renders one lesson: header, sections with code samples, and prev/next. */
export function LessonView({
  lesson,
  index,
  total,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: LessonViewProps) {
  return (
    <article>
      <header className="view-header">
        <p className="view-kicker">
          Lesson {index + 1} of {total} &middot; {lesson.category} &middot; ~
          {lesson.estimatedMinutes} mins
        </p>
        <h1>{lesson.title}</h1>
        <p className="lead">{lesson.description}</p>
      </header>

      {lesson.sections.map((section) => (
        <section key={section.heading} className="lesson-section">
          <h2>{section.heading}</h2>
          {section.explanation ? (
            <p className="lesson-explanation">{section.explanation}</p>
          ) : null}
          {section.code ? (
            <CodeBlock
              code={section.code.code}
              output={section.code.output}
              outputLabel={section.code.outputLabel}
            />
          ) : null}
          {section.notes && section.notes.length > 0 ? (
            <ul className="lesson-notes">
              {section.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <PagerNav
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        onPrev={onPrev}
        onNext={onNext}
      />
    </article>
  );
}