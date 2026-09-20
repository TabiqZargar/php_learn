import { FIRST_LESSON, FIRST_PROGRAM } from "@/content";
import { XpButton } from "@/components/ui/XpButton";

interface CourseHomeProps {
  onStartLessons: () => void;
  onBrowsePrograms: () => void;
}

/** Welcome view shown from the Learning Home side-pane entry. */
export function CourseHome({ onStartLessons, onBrowsePrograms }: CourseHomeProps) {
  return (
    <article>
      <header className="view-header">
        <p className="view-kicker">PHP Academy · Welcome</p>
        <h1>Learn PHP the classic way</h1>
        <p className="lead">
          Eight focused lessons take you from your first echo statement to
          writing your own functions. Twelve practice programs then put those
          skills to work with real, runnable samples.
        </p>
      </header>

      <div className="home-actions">
        <XpButton primary onClick={onStartLessons}>
          Start with {FIRST_LESSON.title}
        </XpButton>
        <XpButton onClick={onBrowsePrograms}>
          Browse the {FIRST_PROGRAM.title} program
        </XpButton>
      </div>

      <div className="home-columns">
        <section className="card home-card">
          <div className="card-text">
            <h3>Curriculum</h3>
            <p>
              Introduction, Syntax, Variables, Data Types, Operators,
              Conditionals, Loops, and Functions — each with explanations, code
              samples, and expected output.
            </p>
          </div>
        </section>
        <section className="card home-card">
          <div className="card-text">
            <h3>Practice programs</h3>
            <p>
              From number puzzles to sessions, cookies, files, and MySQL. Every
              program shows its problem, key concepts, PHP code, expected
              output, and a plain-language explanation.
            </p>
          </div>
        </section>
      </div>

      <ul className="topics-list">
        {[
          "Server-side scripting",
          "Variables and types",
          "Conditions and loops",
          "Functions",
          "Sessions and cookies",
          "Files and databases",
        ].map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
    </article>
  );
}