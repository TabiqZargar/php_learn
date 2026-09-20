import type { CSSProperties, ReactNode } from "react";
import { WindowControls } from "./WindowControls";

interface WindowProps {
  title: string;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  style?: CSSProperties;
  icon?: ReactNode;
  menuBar?: ReactNode;
  statusBar?: ReactNode;
  onActivate: () => void;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Reusable retro window: title bar, minimize/maximize/close controls,
 * an optional menu bar, a client area and an optional status bar.
 *
 * Positioning and maximized/minimized behavior are handled via the window
 * manager; this component only renders a single window.
 */
export function Window({
  title,
  isActive,
  isMinimized,
  isMaximized,
  style,
  icon,
  menuBar,
  statusBar,
  onActivate,
  onMinimize,
  onMaximizeToggle,
  onClose,
  children,
}: WindowProps) {
  const classes = [
    "window",
    isActive ? "is-active" : "is-inactive",
    isMinimized ? "is-minimized" : "",
    isMaximized ? "is-maximized" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      style={style}
      aria-label={title}
      onMouseDownCapture={onActivate}
      onTouchStart={onActivate}
    >
      <header className="window-titlebar">
        <span className="inline-flex" aria-hidden="true">
          {icon}
        </span>
        <span className="window-title">{title}</span>
        <WindowControls
          isMaximized={isMaximized}
          onMinimize={onMinimize}
          onMaximizeToggle={onMaximizeToggle}
          onClose={onClose}
        />
      </header>
      {menuBar}
      <div className="window-client">
        <div className="window-bg">{children}</div>
      </div>
      {statusBar}
    </section>
  );
}