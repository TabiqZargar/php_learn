import type { MouseEvent, ReactNode } from "react";

interface DesktopIconProps {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onActivate: () => void;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function DesktopIcon({
  label,
  icon,
  selected,
  onActivate,
  onSelect,
}: DesktopIconProps) {
  return (
    <button
      type="button"
      className={`desktop-icon ${selected ? "is-selected" : ""}`}
      onDoubleClick={onActivate}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      aria-label={`${label} (opens window)`}
    >
      {icon}
      <span className="desktop-icon-label">{label}</span>
    </button>
  );
}