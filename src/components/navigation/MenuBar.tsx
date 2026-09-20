/**
 * Visual-shell menu bar for the PHP Academy window (File / View / Help).
 * The entries are intentionally non-interactive placeholders for now.
 */
const MENU_LABELS = ["File", "View", "Help"] as const;

export function MenuBar() {
  return (
    <div
      className="menu-bar"
      role="menubar"
      aria-label="Application menu (coming soon)"
      aria-disabled="true"
    >
      {MENU_LABELS.map((label) => (
        <span key={label} className="menu-bar-label" role="menuitem" aria-disabled="true">
          {label}
        </span>
      ))}
    </div>
  );
}