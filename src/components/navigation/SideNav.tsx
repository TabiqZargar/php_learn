import type { ReactNode } from "react";

interface SideNavItemProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** Shows a completion checkmark (never the only completion cue). */
  complete?: boolean;
  /** Optional secondary line (e.g. "Best: 3/5 tests"). */
  meta?: string;
  /** Accessible name; derived from label/meta when omitted. */
  ariaLabel?: string;
  onSelect?: () => void;
}

export function SideNavItem({
  label,
  selected = false,
  disabled = false,
  complete = false,
  meta,
  ariaLabel,
  onSelect,
}: SideNavItemProps) {
  const accessibleLabel =
    ariaLabel ??
    `${label}${complete ? ", complete" : ""}${meta ? `, ${meta}` : ""}`;

  const content = (
    <>
      <span className="side-pane-dot" aria-hidden="true" />
      <span className="side-pane-label-wrap">
        <span className="side-pane-label-row">
          {complete ? (
            <span className="side-pane-check" aria-hidden="true">
              &#10003;
            </span>
          ) : null}
          {label}
        </span>
        {meta ? <span className="side-pane-meta">{meta}</span> : null}
      </span>
    </>
  );

  if (disabled) {
    return (
      <span className="side-pane-item is-disabled" aria-disabled="true" aria-label={accessibleLabel}>
        {content}
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
      aria-label={accessibleLabel}
      onClick={onSelect}
    >
      {content}
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