import type { ReactNode } from "react";
import type { WindowId, WindowState } from "../desktop/types";
import { StartButton } from "./StartButton";
import { StartMenu } from "./StartMenu";
import { TaskbarButton } from "./TaskbarButton";
import { SystemTray } from "./SystemTray";

export interface StartMenuEntry {
  id?: WindowId;
  label: string;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

interface TaskbarProps {
  windows: WindowState[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  startMenuEntries: StartMenuEntry[];
  onToggleStartMenu: () => void;
  onOpenFromStartMenu: (id: WindowId) => void;
  onCloseStartMenu: () => void;
  onActivateWindow: (id: WindowId) => void;
}

export function Taskbar({
  windows,
  activeWindowId,
  startMenuOpen,
  startMenuEntries,
  onToggleStartMenu,
  onOpenFromStartMenu,
  onCloseStartMenu,
  onActivateWindow,
}: TaskbarProps) {
  return (
    <footer className="taskbar">
      <StartButton open={startMenuOpen} onToggle={onToggleStartMenu} />

      <div className="taskbar-apps" role="toolbar" aria-label="Running applications">
        {windows.map((win) => (
          <TaskbarButton
            key={win.id}
            label={win.title}
            active={activeWindowId === win.id}
            onActivate={() => onActivateWindow(win.id)}
          />
        ))}
      </div>

      <SystemTray />

      {startMenuOpen && (
        <StartMenu
          entries={startMenuEntries}
          onOpen={onOpenFromStartMenu}
          onClose={onCloseStartMenu}
        />
      )}
    </footer>
  );
}