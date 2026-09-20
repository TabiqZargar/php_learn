import { XpButton } from "@/components/ui/XpButton";

interface PracticeControlsProps {
  onRun: () => void;
  onReset: () => void;
  canReset: boolean;
  /** Disables both actions while a run request is in flight. */
  running?: boolean;
}

/** Action row under the editor: Reset restores defaults, Run collects and runs. */
export function PracticeControls({
  onRun,
  onReset,
  canReset,
  running = false,
}: PracticeControlsProps) {
  return (
    <div className="practice-controls">
      <XpButton
        onClick={onReset}
        disabled={!canReset || running}
        aria-label="Reset to starter code and default input"
      >
        Reset
      </XpButton>
      <XpButton
        primary
        onClick={onRun}
        disabled={running}
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