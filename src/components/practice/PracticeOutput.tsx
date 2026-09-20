import type { PracticeResult } from "@/lib/practice/types";

interface PracticeOutputProps {
  result: PracticeResult | null;
}

/**
 * Bottom strip that renders the latest run result. The region is marked
 * live so screen readers announce output changes. Output is ALWAYS
 * faithful to what the runner reported — never fabricated.
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

  switch (result.status) {
    case "success":
      return (
        <div className="practice-result is-success">
          {result.stdout ? (
            <pre className="practice-stdout">{result.stdout}</pre>
          ) : (
            <p className="practice-output-empty">Program produced no output.</p>
          )}
          <p className="practice-result-meta">
            Completed in {result.executionTimeMs ?? "?"} ms
            {typeof result.exitCode === "number"
              ? ` · exit code ${result.exitCode}`
              : ""}
          </p>
        </div>
      );

    case "syntax_error":
    case "runtime_error":
    case "invalid_request":
      return (
        <div className="practice-result is-error">
          {result.stderr ? <pre className="practice-stderr">{result.stderr}</pre> : null}
          {!result.stderr && result.stdout ? (
            <pre className="practice-stderr">{result.stdout}</pre>
          ) : null}
          {result.message ? <p>{result.message}</p> : null}
          {typeof result.exitCode === "number" ? (
            <p className="practice-result-meta">Exit code {result.exitCode}</p>
          ) : null}
        </div>
      );

    case "timeout":
      return (
        <div className="practice-result is-timeout">
          <p>{result.message ?? "The program timed out."}</p>
          {result.stdout ? <pre className="practice-stdout">{result.stdout}</pre> : null}
        </div>
      );

    case "output_limit":
      return (
        <div className="practice-result is-output-limit">
          <p>
            {result.message ?? "The program produced too much output and was stopped."}
          </p>
          {result.stdout ? <pre className="practice-stdout">{result.stdout}</pre> : null}
        </div>
      );

    case "runtime_unavailable":
    case "execution_disabled":
    case "not_implemented":
      return (
        <div className="practice-result is-neutral">
          {(result.message ?? "Execution is not available.")
            .split("\n")
            .filter(Boolean)
            .map((line) => (
              <p key={line}>{line}</p>
            ))}
        </div>
      );

    default:
      return <p className="practice-result is-neutral">Status: {result.status}</p>;
  }
}