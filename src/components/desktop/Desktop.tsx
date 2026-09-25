"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AcademyWindowPayload,
  PracticeWindowPayload,
  WindowId,
  WindowState,
} from "./types";
import { WINDOW_TITLES } from "./types";
import { DesktopIcon } from "./DesktopIcon";
import { Window } from "../windows/Window";
import { AcademyWindow } from "../learning/AcademyWindow";
import { ProgramsWindow } from "../learning/ProgramsWindow";
import { PracticeWindow } from "../practice/PracticeWindow";
import { ReferenceWindow } from "../reference/ReferenceWindow";
import { PlaceholderContent } from "../windows/PlaceholderContent";
import { MenuBar } from "../navigation/MenuBar";
import { StatusBar } from "../ui/StatusBar";
import { Taskbar } from "../taskbar/Taskbar";
import type { StartMenuEntry } from "../taskbar/Taskbar";
import {
  AcademyIcon,
  ComputerIcon,
  ProgramsIcon,
  ReferenceIcon,
} from "../icons/AppIcons";

interface WindowStateWithId extends WindowState {
  id: WindowId;
}

const startMenuEntries: StartMenuEntry[] = [
  { id: "academy", label: "PHP Academy", icon: <AcademyIcon size={16} /> },
  { id: "programs", label: "Programs", icon: <ProgramsIcon size={16} /> },
  { id: "reference", label: "PHP Reference", icon: <ReferenceIcon size={16} /> },
  { id: "computer", label: "My Computer", icon: <ComputerIcon size={16} /> },
  { id: "practice", label: "PHP Practice", icon: <ProgramsIcon size={16} /> },
];

const WINDOW_ICONS: Record<WindowId, ReactNode> = {
  academy: <AcademyIcon size={16} />,
  programs: <ProgramsIcon size={16} />,
  reference: <ReferenceIcon size={16} />,
  computer: <ComputerIcon size={16} />,
  practice: <ProgramsIcon size={16} />,
};

const DEFAULT_STYLES: Record<WindowId, CSSProperties> = {
  academy: {
    width: "min(94vw, 840px)",
    height: "min(calc(100vh - 48px), 560px)",
    left: "max(6px, calc(50% - min(420px, 47vw)))",
    top: "6px",
  },
  programs: {
    width: "min(92vw, 720px)",
    height: "min(calc(100vh - 48px), 460px)",
    left: "max(6px, calc(50% - min(360px, 46vw)))",
    top: "max(6px, calc(6vh))",
  },
  reference: {
    width: "min(94vw, 840px)",
    height: "min(calc(100vh - 48px), 600px)",
    left: "max(6px, calc(50% - min(420px, 47vw)))",
    top: "max(6px, calc(6vh))",
  },
  computer: {
    width: "min(84vw, 420px)",
    height: "min(52vh, 300px)",
    left: "max(6px, calc(46% - 40px))",
    top: "max(6px, calc(34vh))",
  },
  practice: {
    width: "min(94vw, 1000px)",
    height: "min(calc(100vh - 48px), 600px)",
    left: "max(6px, calc(50% - min(500px, 47vw)))",
    top: "max(6px, calc(6vh))",
  },
};

export function Desktop() {
  const [windows, setWindows] = useState<WindowStateWithId[]>([
    { id: "academy", title: WINDOW_TITLES.academy, minimized: false, maximized: false },
  ]);
  const [activeWindowId, setActiveWindowId] = useState<WindowId | null>("academy");
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const practiceRequestRef = useRef(0);
  const lessonRequestRef = useRef(0);

  const openAppWindow = useCallback((id: WindowId) => {
    setStartMenuOpen(false);
    setWindows((current) => {
      const existing = current.find((win) => win.id === id);
      if (existing) {
        return current.map((win) =>
          win.id === id
            ? { ...win, minimized: false, maximized: false }
            : win,
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
    const practiceRequest = practiceRequestRef.current + 1;
    practiceRequestRef.current = practiceRequest;
    setWindows((current) =>
      current.map((win) =>
        win.id === "practice"
          ? { ...win, minimized: false, payload: { programSlug, practiceRequest } }
          : win,
      ),
    );
    setActiveWindowId("practice");
  }, []);

  const openLesson = useCallback((lessonSlug: string) => {
    setStartMenuOpen(false);
    const lessonRequest = lessonRequestRef.current + 1;
    lessonRequestRef.current = lessonRequest;
    setWindows((current) =>
      current.map((win) =>
        win.id === "academy"
          ? { ...win, minimized: false, payload: { lessonSlug, lessonRequest } }
          : win,
      ),
    );
    setActiveWindowId("academy");
  }, []);

  const activateWindow = useCallback((id: WindowId) => {
    setActiveWindowId(id);
    setWindows((current) =>
      current.map((win) =>
        win.id === id ? { ...win, minimized: false } : win,
      ),
    );
  }, []);

  const renderContent = (win: WindowStateWithId) => {
    switch (win.id) {
      case "academy": {
        const payload = win.payload as AcademyWindowPayload | undefined;
        return (
          <AcademyWindow
            key={payload ? `lesson-${payload.lessonRequest}` : "static"}
            initialLessonSlug={payload?.lessonSlug}
            onOpenPractice={(program) => openPractice(program.slug)}
          />
        );
      }
      case "programs":
        return (
          <ProgramsWindow
            onOpenPractice={(program) => openPractice(program.slug)}
          />
        );
      case "practice": {
        const payload = win.payload as PracticeWindowPayload | undefined;
        return (
          <PracticeWindow
            key={payload ? `practice-${payload.programSlug}` : "static"}
            programSlug={payload?.programSlug}
            onOpenLesson={openLesson}
          />
        );
      }
      case "reference":
        return (
          <ReferenceWindow
            onOpenLesson={openLesson}
            onOpenProgram={(programSlug) => openPractice(programSlug)}
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

  return (
    <div className="desktop-shell">
      <div className="desktop-wallpaper" aria-hidden="true" />

      <div className="desktop-area">
        <div className="desktop-icons" role="list" aria-label="Desktop icons">
          {[
            {
              id: "academy",
              label: "PHP Academy",
              icon: <AcademyIcon size={40} />,
            },
            { id: "programs", label: "Programs", icon: <ProgramsIcon size={40} /> },
            {
              id: "reference",
              label: "PHP Reference",
              icon: <ReferenceIcon size={40} />,
            },
            { id: "computer", label: "My Computer", icon: <ComputerIcon size={40} /> },
          ].map((icon) => (
            <div key={icon.id} role="listitem">
              <DesktopIcon
                label={icon.label}
                icon={icon.icon}
                selected={selectedIcon === icon.id}
                onSelect={() => setSelectedIcon(icon.id)}
                onActivate={() => openAppWindow(icon.id as WindowId)}
              />
            </div>
          ))}
        </div>

        <div className="window-layer">
          {windows.map((win) => (
            <Window
              key={win.id}
              title={win.title}
              isActive={activeWindowId === win.id}
              isMinimized={win.minimized}
              isMaximized={win.maximized}
              style={DEFAULT_STYLES[win.id]}
              icon={WINDOW_ICONS[win.id]}
              onActivate={() => activateWindow(win.id)}
              onMinimize={() =>
                setWindows((current) =>
                  current.map((w) =>
                    w.id === win.id ? { ...w, minimized: true } : w,
                  ),
                )
              }
              onMaximizeToggle={() =>
                setWindows((current) =>
                  current.map((w) =>
                    w.id === win.id
                      ? { ...w, maximized: !w.maximized }
                      : w,
                  ),
                )
              }
              onClose={() =>
                setWindows((current) => current.filter((w) => w.id !== win.id))
              }
            >
              {win.minimized ? null : renderContent(win)}
            </Window>
          ))}
        </div>
      </div>

      <MenuBar />
      <StatusBar />

      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        startMenuEntries={startMenuEntries}
        onToggleStartMenu={() => setStartMenuOpen((open) => !open)}
        onOpenFromStartMenu={(id) => openAppWindow(id)}
        onCloseStartMenu={() => setStartMenuOpen(false)}
        onActivateWindow={activateWindow}
      />
    </div>
  );
}
