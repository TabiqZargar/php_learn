import type { Program } from "@/lib/learning/types";

/** Left pane: the problem statement and the concepts it exercises. */
export function PracticeProblem({ program }: { program: Program }) {
  return (
    <section className="practice-pane" aria-label="Problem">
      <h2 className="practice-pane-title">Problem</h2>
      <p className="practice-text">{program.problemStatement}</p>
      <h3 className="practice-pane-sub">Concepts used</h3>
      <ul className="practice-concepts">
        {program.concepts.map((concept) => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>
    </section>
  );
}