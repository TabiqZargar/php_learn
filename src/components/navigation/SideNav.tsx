import type { ReactNode } from "react";

interface SideNavItemProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export function SideNavItem({
  label,
  selected = false,
  disabled = false,
  onSelect,
}: SideNavItemProps) {
  if (disabled) {
    return (
      <span className="side-pane-item is-disabled" aria-disabled="true">
        <span className="side-pane-dot" aria-hidden="true" />
        {label}
      </span>
    );
  }
  const classes = ["side-pane-item", selected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="side-pane-dot" aria-hidden="true" />
      {label}
    </button>
  );
}

interface SideNavProps {
  title: string;
  children: ReactNode;
}

/** Blue XP-style task pane used as the main window's left rail. */
export function SideNav({ title, children }: SideNavProps) {
  return (
    <nav className="side-pane" aria-label={title}>
      <div className="side-pane-title">{title}</div>
      {children}
    </nav>
  );
}