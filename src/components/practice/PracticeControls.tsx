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
}: PracticeControlsProps) {
  const busy = running || checking;

  return (
    <div className="practice-controls">
      <XpButton
        onClick={onReset}
        disabled={!canReset || busy}
        aria-label="Reset to starter code and default input"
      >
        Reset
      </XpButton>
      <XpButton
        onClick={onCheck}
        disabled={busy}
        aria-label="Check the current code against the program's test cases"
      >
        {checking ? "Checking…" : <>&#10003; Check Solution</>}
      </XpButton>
      <XpButton
        primary
        onClick={onRun}
        disabled={busy}
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