import { XpButton } from "@/components/ui/XpButton";

interface PracticeControlsProps {
  onRun: () => void;
  onReset: () => void;
  canReset: boolean;
}

/** Action row under the editor: Reset restores defaults, Run collects and runs. */
export function PracticeControls({ onRun, onReset, canReset }: PracticeControlsProps) {
  return (
    <div className="practice-controls">
      <XpButton
        onClick={onReset}
        disabled={!canReset}
        aria-label="Reset to starter code and default input"
      >
        Reset
      </XpButton>
      <XpButton primary onClick={onRun} aria-label="Run the current code against the current input">
        <>&#9654; Run</>
      </XpButton>
    </div>
  );
}