"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import type { WindowId, WindowState } from "./types";
import { WINDOW_TITLES } from "./types";
import { DesktopIcon } from "./DesktopIcon";
import { Window } from "../windows/Window";
import { AcademyWindow } from "../learning/AcademyWindow";
import { ProgramsWindow } from "../learning/ProgramsWindow";
import { PracticeWindow } from "../practice/PracticeWindow";
import { PlaceholderContent } from "../windows/PlaceholderContent";
import { MenuBar } from "../navigation/MenuBar";
import { StatusBar } from "../ui/StatusBar";
import { Taskbar } from "../taskbar/Taskbar";
import type { StartMenuEntry } from "../taskbar/Taskbar";
import {
  AcademyIcon,
  ProgramsIcon,
  ReferenceIcon,
  ComputerIcon,
} from "../icons/AppIcons";

const INITIAL_WINDOWS: WindowState[] = [
  { id: "academy", title: WINDOW_TITLES.academy, minimized: false, maximized: false },
];

const DEFAULT_STYLES: Record<WindowId, CSSProperties> = {
  academy: {
    width: "min(94vw, 840px)",
    height: "min(calc(100vh - 60px), 560px)",
    left: "max(6px, calc(50% - min(420px, 47vw)))",
    top: "6px",
  },
  programs: {
    width: "min(92vw, 720px)",
    height: "min(calc(100vh - 60px), 500px)",
    left: "max(6px, calc(50% - min(360px, 46vw)))",
    top: "max(6px, calc(8vh))",
  },
  reference: {
    width: "min(84vw, 420px)",
    height: "min(56vh, 300px)",
    left: "max(6px, calc(58% - 40px))",
    top: "max(6px, calc(24vh))",
  },
  computer: {
    width: "min(84vw, 400px)",
    height: "min(52vh, 280px)",
    left: "max(6px, calc(42% - 40px))",
    top: "max(6px, calc(40vh))",
  },
  practice: {
    width: "min(96vw, 1000px)",
    height: "min(calc(100vh - 40px), 640px)",
    left: "max(4px, calc(50% - min(500px, 48vw)))",
    top: "max(4px, calc(4vh))",
  },
};

const TITLEBAR_ICONS: Record<WindowId, React.ReactNode> = {
  academy: <AcademyIcon size={16} />,
  programs: <ProgramsIcon size={16} />,
  reference: <ReferenceIcon size={16} />,
  computer: <ComputerIcon size={16} />,
  practice: <ProgramsIcon size={16} />,
};

export function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
  const [activeWindowId, setActiveWindowId] = useState<string | null>("academy");
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const openWindow = useCallback((id: WindowId) => {
    setStartMenuOpen(false);
    setWindows((current) => {
      const existing = current.find((win) => win.id === id);
      if (existing) {
        return current.map((win) =>
          win.id === id ? { ...win, minimized: false } : win,
        );
      }
      return [
        ...current,
        { id, title: WINDOW_TITLES[id], minimized: false, maximized: false },
      ];
    });
    setActiveWindowId(id);
  }, []);

  const openPractice = useCallback((programSlug: string) => {
    setStartMenuOpen(false);
    setWindows((current) => {
      const existing = current.find((win) => win.id === "practice");
      if (existing) {
        return current.map((win) =>
          win.id === "practice"
            ? { ...win, minimized: false, payload: { programSlug } }
            : win,
        );
      }
      return [
        ...current,
        {
          id: "practice",
          title: WINDOW_TITLES.practice,
          minimized: false,
          maximized: false,
          payload: { programSlug },
        },
      ];
    });
    setActiveWindowId("practice");
  }, []);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows((current) => current.filter((win) => win.id !== id));
    setActiveWindowId((current) => {
      if (current !== id) return current;
      return null;
    });
  }, []);

  const minimizeWindow = useCallback((id: WindowId) => {
    setWindows((current) =>
      current.map((win) => (win.id === id ? { ...win, minimized: true } : win)),
    );
    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  const toggleMaximized = useCallback((id: WindowId) => {
    setActiveWindowId(id);
    setWindows((current) =>
      current.map((win) =>
        win.id === id ? { ...win, maximized: !win.maximized } : win,
      ),
    );
  }, []);

  const activateWindow = useCallback((id: WindowId) => {
    setActiveWindowId(id);
    setWindows((current) =>
      current.map((win) =>
        win.id === id ? { ...win, minimized: false } : win,
      ),
    );
  }, []);

  // Render the active window on top by giving it a higher z-index.
  const renderedWindows = windows.map((win, index) => ({
    ...win,
    zIndex: 10 + index + (win.id === activeWindowId ? windows.length : 0),
  }));

  const renderContent = (win: WindowState) => {
    switch (win.id) {
      case "academy":
        return <AcademyWindow onOpenPractice={(program) => openPractice(program.slug)} />;
      case "programs":
        return <ProgramsWindow onOpenPractice={(program) => openPractice(program.slug)} />;
      case "practice":
        return (
          <PracticeWindow
            key={win.payload?.programSlug ?? "none"}
            programSlug={win.payload?.programSlug}
          />
        );
      case "reference":
        return (
          <PlaceholderContent
            icon={<ReferenceIcon size={44} />}
            heading="PHP Reference"
            description="Syntax and function reference"
            note="The reference section arrives in a later phase. Cheat sheets, function signatures and quick examples will appear here."
          />
        );
      case "computer":
        return (
          <PlaceholderContent
            icon={<ComputerIcon size={44} />}
            heading="My Computer"
            description="Your PHP learning workspace"
            note="Filesystem and workspace browsing arrive in a later phase. For now this window is a placeholder."
            items={["C: PHP Learning Drive", "H: HTTP Server (planned)"]}
          />
        );
    }
  };

  const startMenuEntries: StartMenuEntry[] = [
    { id: "academy", label: "PHP Academy", icon: <AcademyIcon size={30} /> },
    { id: "programs", label: "Programs", icon: <ProgramsIcon size={30} /> },
    { id: "reference", label: "PHP Reference", icon: <ReferenceIcon size={30} /> },
    {
      label: "Settings",
      icon: <ComputerIcon size={30} />,
      disabled: true,
      hint: "Settings arrive in a later phase",
    },
    {
      label: "Help",
      icon: <ReferenceIcon size={30} />,
      disabled: true,
      hint: "Help arrives in a later phase",
    },
  ];

  const desktopIcons: Array<{
    id: WindowId;
    label: string;
    icon: React.ReactNode;
    onOpen: () => void;
  }> = [
    {
      id: "academy",
      label: "PHP Academy",
      icon: <AcademyIcon />,
      onOpen: () => openWindow("academy"),
    },
    {
      id: "programs",
      label: "Programs",
      icon: <ProgramsIcon />,
      onOpen: () => openWindow("programs"),
    },
    {
      id: "reference",
      label: "Reference",
      icon: <ReferenceIcon />,
      onOpen: () => openWindow("reference"),
    },
    {
      id: "computer",
      label: "My Computer",
      icon: <ComputerIcon />,
      onOpen: () => openWindow("computer"),
    },
  ];

  return (
    <div className="desktop-shell">
      <div className="desktop-wallpaper" aria-hidden="true" />

      <div className="desktop-area">
        <div className="desktop-icons" role="list" aria-label="Desktop icons">
          {desktopIcons.map((icon) => (
            <div key={icon.id} role="listitem">
              <DesktopIcon
                label={icon.label}
                icon={icon.icon}
                selected={selectedIcon === icon.id}
                onSelect={() => setSelectedIcon(icon.id)}
                onActivate={icon.onOpen}
              />
            </div>
          ))}
        </div>

        <div className="window-layer">
          {renderedWindows.map((win) => (
            <Window
              key={win.id}
              title={win.title}
              icon={TITLEBAR_ICONS[win.id]}
              isActive={activeWindowId === win.id}
              isMinimized={win.minimized}
              isMaximized={win.maximized}
              style={{ ...DEFAULT_STYLES[win.id], zIndex: win.zIndex }}
              menuBar={win.id === "academy" ? <MenuBar /> : undefined}
              statusBar={
                win.id === "academy" ? (
                  <StatusBar left="Ready" right="PHP Academy — Phase 3" />
                ) : win.id === "practice" ? (
                  <StatusBar left="PHP Practice" right="Execution: not connected" />
                ) : undefined
              }
              onActivate={() => activateWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximizeToggle={() => toggleMaximized(win.id)}
              onClose={() => closeWindow(win.id)}
            >
              {renderContent(win)}
            </Window>
          ))}
        </div>
      </div>

      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        startMenuEntries={startMenuEntries}
        onToggleStartMenu={() => setStartMenuOpen((open) => !open)}
        onOpenFromStartMenu={openWindow}
        onCloseStartMenu={() => setStartMenuOpen(false)}
        onActivateWindow={activateWindow}
      />
    </div>
  );
}