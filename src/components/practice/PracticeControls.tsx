import { XpButton } from "@/components/ui/XpButton";

interface PracticeControlsProps {
  onRun: () => void;
  onCheck: () => void;
  onReset: () => void;
  canReset: boolean;
  /** Disables all actions while a run request is in flight. */
  running?: boolean;
  /** Disables all actions while a check request is in flight. */
  checking?: boolean;
  /**
   * Label for the reset button. Stateful programs use "Reset Editor" so it
   * stays visually distinct from the session's Reset Session action.
   */
  resetLabel?: string;
  /** Disables Run/Check (e.g. stateful programs with no active session). */
  sessionReady?: boolean;
}

/**
 * Action row under the editor. Reset restores defaults, Run exercises the
 * code with the panel inputs, Check Solution grades the code against the
 * program's hidden test cases on the server.
 */
export function PracticeControls({
  onRun,
  onCheck,
  onReset,
  canReset,
  running = false,
  checking = false,
  resetLabel = "Reset",
  sessionReady = true,
}: PracticeControlsProps) {
  const busy = running || checking;
  const actionsReady = busy || !sessionReady;

  return (
    <div className="practice-controls">
      <XpButton
        onClick={onReset}
        disabled={!canReset || busy}
        aria-label="Reset to starter code and default input"
      >
        {resetLabel}
      </XpButton>
      <XpButton
        onClick={onCheck}
        disabled={actionsReady}
        aria-label="Check the current code against the program's test cases"
      >
        {checking ? "Checking…" : <>&#10003; Check Solution</>}
      </XpButton>
      <XpButton
        primary
        onClick={onRun}
        disabled={actionsReady}
        aria-label={
          running
            ? "Running the current code against the current input"
            : "Run the current code against the current input"
        }
      >
        {running ? "Running…" : <>&#9654; Run</>}
      </XpButton>
    </div>
  );
}