import type { PracticeResult } from "@/lib/practice/types";

interface PracticeOutputProps {
  result: PracticeResult | null;
}

/**
 * Bottom strip that renders the latest run result. The region is marked
 * live so screen readers announce output changes. Results are ALWAYS
 * faithful: a not_implemented status shows a plain explanation and never
 * fabricated program output.
 */
export function PracticeOutput({ result }: PracticeOutputProps) {
  return (
    <section className="practice-output" aria-label="Output">
      <div className="practice-output-title">OUTPUT</div>
      <div className="practice-output-body" role="status">
        <ResultBody result={result} />
      </div>
    </section>
  );
}

function ResultBody({ result }: PracticeOutputProps) {
  if (!result) {
    return (
      <p className="practice-output-hint">
        Press <strong>Run</strong> to exercise your code with the inputs above.
      </p>
    );
  }

  const tone =
    result.status === "success"
      ? "is-success"
      : result.status === "error"
        ? "is-error"
        : result.status === "timeout"
          ? "is-timeout"
          : "is-neutral";

  if (result.status === "not_implemented") {
    return (
      <div className={`practice-result ${tone}`}>
        {(result.message ?? "").split("\n").filter(Boolean).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    );
  }

  if (result.stdout) {
    return (
      <div className={`practice-result ${tone}`}>
        <pre className="practice-stdout">{result.stdout}</pre>
        {result.message ? <p>{result.message}</p> : null}
      </div>
    );
  }

  if (result.message) {
    return <p className={`practice-result ${tone}`}>{result.message}</p>;
  }

  return <p className={`practice-result ${tone}`}>Status: {result.status}</p>;
}