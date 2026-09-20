import type { ReactNode } from "react";

interface SideNavItemProps {
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export function SideNavItem({ label, disabled = false, onSelect }: SideNavItemProps) {
  if (disabled) {
    return (
      <span className="side-pane-item is-disabled" aria-disabled="true">
        <span className="side-pane-dot" aria-hidden="true" />
        {label}
      </span>
    );
  }
  return (
    <button type="button" className="side-pane-item" onClick={onSelect}>
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