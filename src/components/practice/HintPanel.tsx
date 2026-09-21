"use client";

import type { ProgramHint } from "@/lib/learning/types";
import { XpButton } from "../ui/XpButton";

interface HintPanelProps {
  hints: ProgramHint[];
  revealedCount: number;
  /** Reveals exactly the next hidden hint. */
  onReveal: () => void;
}

/**
 * Progressive hint reveal for the practice window. Content is authored
 * program data; this component only reveals ONE hint per click and never
 * duplicates already-revealed hints. The list is live so assistive tech
 * announces each newly revealed hint.
 */
export function HintPanel({ hints, revealedCount, onReveal }: HintPanelProps) {
  if (hints.length === 0) return null;

  const revealed = hints.slice(0, revealedCount);

  return (
    <section className="hint-panel" aria-label="Hints">
      <h2 className="hint-panel-title">Need a hint?</h2>
      <p className="hint-panel-lead">
        Try it yourself first — then reveal one hint at a time.
      </p>

      {revealed.length > 0 ? (
        <div className="hint-list" aria-live="polite">
          {revealed.map((hint, index) => (
            <article className="hint-item" key={hint.id}>
              <h3 className="hint-heading">
                Hint {index + 1} &middot; {hint.title}
              </h3>
              <p className="hint-content">{hint.content}</p>
            </article>
          ))}
        </div>
      ) : null}

      {revealedCount < hints.length ? (
        <XpButton onClick={onReveal}>
          Show Hint {revealedCount + 1}
        </XpButton>
      ) : (
        <p className="hint-all-revealed">All hints revealed — try applying them to your code.</p>
      )}
    </section>
  );
}