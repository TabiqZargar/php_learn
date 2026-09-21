import type { PracticeInput, PracticeResult } from "@/lib/practice/types";
import type { EvaluationResult, EvaluationStatus, TestCaseResult } from "@/lib/practice/evaluation";

interface PracticeOutputProps {
  result: PracticeResult | null;
  evaluation: EvaluationResult | null;
}

/**
 * Bottom strip that renders the latest action. The region is marked live
 * so screen readers announce output changes. Everything shown is ALWAYS
 * faithful to what the server reported — never fabricated. Run results and
 * evaluation results are mutually exclusive: whichever was triggered last
 * replaces the other.
 */
export function PracticeOutput({ result, evaluation }: PracticeOutputProps) {
  return (
    <section
      className={evaluation ? "practice-output has-evaluation" : "practice-output"}
      aria-label="Output"
    >
      <div className="practice-output-title">OUTPUT</div>
      <div className="practice-output-body" role="status">
        {evaluation ? (
          <EvaluationBody evaluation={evaluation} />
        ) : (
          <RunResultBody result={result} />
        )}
      </div>
    </section>
  );
}

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  passed: "Passed",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  syntax_error: "Syntax Error",
  timeout: "Timeout",
  output_limit: "Output Limit",
  runtime_unavailable: "Not Available",
  execution_disabled: "Execution Disabled",
};

function statusClass(status: EvaluationStatus): string {
  switch (status) {
    case "passed":
      return "pass";
    case "wrong_answer":
    case "runtime_error":
    case "syntax_error":
      return "fail";
    default:
      return "warn";
  }
}

function formatInputs(inputs: PracticeInput[]): string {
  return inputs.map((input) => `${input.name} = ${input.value}`).join(", ");
}

function displayOutput(output: string | undefined): string {
  return output && output.length > 0 ? output : "(nothing printed)";
}

function EvaluationBody({ evaluation }: { evaluation: EvaluationResult }) {
  const allPassed = evaluation.status === "passed";

  return (
    <div
      className={`practice-result ${allPassed ? "is-success" : "is-neutral"}`}
    >
      <p className="eval-summary-title">Solution Check</p>
      <p className={`eval-summary ${allPassed ? "pass" : "fail"}`}>
        {allPassed ? "\u2713" : "\u2717"} {evaluation.passed} / {evaluation.total} tests
        passed
      </p>
      {allPassed ? (
        <p className="eval-verdict">All test cases passed.</p>
      ) : (
        <p className="eval-verdict">Stopped after the first failing test.</p>
      )}

      {evaluation.testResults.length === 0 && evaluation.message ? (
        evaluation.message
          .split("\n")
          .filter(Boolean)
          .map((line) => <p key={line}>{line}</p>)
      ) : (
        <div className="eval-cases">
          {evaluation.testResults.map((test) => (
            <TestCaseRow key={test.testCaseId} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCaseRow({ test }: { test: TestCaseResult }) {
  const passed = test.status === "passed";

  return (
    <div className={`eval-case ${passed ? "is-pass" : "is-fail"}`}>
      <div className="eval-case-header">
        <span>{test.testCaseName}</span>
        <span className={`eval-case-status ${statusClass(test.status)}`}>
          {passed ? "\u2713 " : "\u2717 "}
          {STATUS_LABELS[test.status]}
          {typeof test.executionTimeMs === "number"
            ? ` (${test.executionTimeMs} ms)`
            : ""}
        </span>
      </div>
      <p className="eval-input-line">{formatInputs(test.inputs)}</p>

      {!passed ? (
        <>
          {test.status === "wrong_answer" ? (
            <>
              <p className="eval-label">Expected output</p>
              <pre className="eval-block expected">{test.expectedOutput}</pre>
              <p className="eval-label">Your output</p>
              <pre className="eval-block actual">{displayOutput(test.actualOutput)}</pre>
            </>
          ) : null}

          {test.diagnostic ? (
            <>
              <p className="eval-label">Diagnostic</p>
              <pre className="eval-block diagnostic">{test.diagnostic}</pre>
            </>
          ) : null}

          {test.message ? <p className="eval-case-message">{test.message}</p> : null}
        </>
      ) : null}
    </div>
  );
}

function RunResultBody({ result }: { result: PracticeResult | null }) {
  if (!result) {
    return (
      <p className="practice-output-hint">
        Press <strong>Run</strong> to exercise your code with the inputs above, or{" "}
        <strong>Check Solution</strong> to grade it against the program&apos;s test
        cases.
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