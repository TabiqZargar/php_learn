import type { ReactNode } from "react";
import type { WindowId } from "../desktop/types";

interface StartEntry {
  id?: WindowId;
  label: string;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

interface StartMenuProps {
  onOpen: (id: WindowId) => void;
  onClose: () => void;
  entries: StartEntry[];
}

/**
 * Windows-XP-inspired start menu. Main entries open real windows; the
 * Settings / Help placeholders are disabled until those features exist.
 * A transparent backdrop closes the menu when clicking anywhere outside.
 */
export function StartMenu({ onOpen, onClose, entries }: StartMenuProps) {
  const mainEntries = entries.filter((entry) => !entry.disabled);
  const disabledEntries = entries.filter((entry) => entry.disabled);

  return (
    <>
      <div className="start-menu-backdrop" onMouseDown={onClose} onTouchStart={onClose} aria-hidden="true" />
      <div className="start-menu" role="menu" aria-label="Start menu">
        <header className="start-menu-head">
          <span className="start-menu-user-avatar" aria-hidden="true">
            P
          </span>
          <div>
            <div className="start-menu-user-name">PHP Academy</div>
            <div className="start-menu-user-sub">Learning Edition</div>
          </div>
        </header>

        <div className="start-menu-body">
          <div className="start-menu-group-title">php-learning</div>
          {mainEntries.map((entry) => (
            <button
              key={entry.label}
              type="button"
              role="menuitem"
              className="start-menu-item"
              onClick={() => {
                if (entry.id) {
                  onOpen(entry.id);
                }
                onClose();
              }}
            >
              {entry.icon}
              {entry.label}
            </button>
          ))}

          <div className="start-menu-separator" role="separator" />

          {disabledEntries.map((entry) => (
            <button
              key={entry.label}
              type="button"
              role="menuitem"
              className="start-menu-item is-disabled"
              disabled
              aria-disabled="true"
              title={entry.hint ?? "Coming in a later phase"}
            >
              {entry.icon}
              {entry.label}
            </button>
          ))}
        </div>

        <footer className="start-menu-foot">PHP Academy — Phase 1 shell</footer>
      </div>
    </>
  );
}