interface TaskbarButtonProps {
  label: string;
  active: boolean;
  onActivate: () => void;
}

/** One running-application button in the taskbar. */
export function TaskbarButton({ label, active, onActivate }: TaskbarButtonProps) {
  return (
    <button
      type="button"
      className={`taskbar-button ${active ? "is-active" : ""}`}
      onClick={onActivate}
      aria-label={label}
      aria-pressed={active}
    >
      <span className="taskbar-button-label">{label}</span>
    </button>
  );
}