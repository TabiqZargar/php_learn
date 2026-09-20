import { StartFlagIcon } from "../icons/AppIcons";

interface StartButtonProps {
  open: boolean;
  onToggle: () => void;
}

export function StartButton({ open, onToggle }: StartButtonProps) {
  return (
    <button
      type="button"
      className={`start-button ${open ? "is-open" : ""}`}
      onClick={onToggle}
      aria-label="Start"
      aria-expanded={open}
      aria-haspopup="menu"
    >
      <StartFlagIcon />
      start
    </button>
  );
}