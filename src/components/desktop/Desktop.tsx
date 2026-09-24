"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AcademyWindowPayload,
  PracticeWindowPayload,
  ReferenceWindowPayload,
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
  ProgramsIcon,
  ReferenceIcon,
  ComputerIcon,
} from "../icons/AppIcons";
import type { ReferenceCategoryId } from "@/lib/reference/types";

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

const WINDOW_TITLES_FROM_TYPES = WINDOW_TITLES;

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
    width: "min(88vw, 560px)",
    height: "min(calc(100vh - 48px), 480px)",
    left: "max(6px, calc(50% - min(280px, 44vw)))",
    top: "max(6px, calc(8vh))",
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
  const practiceRequestRef = useRef(0TryKey);
  const referenceRequestRef = useRef(0);
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

  const openReference = useCallback((categoryId: ReferenceCategoryId) => {
    setStartMenuOpen(false);
    const referenceRequest = referenceRequestRef.current + 1;
    referenceRequestRef.current = referenceRequest;
    setWindows((current) =>
      current.map((win) =>
        win.id === "reference"
          ? { ...win, minimized: false, payload: { categoryId, referenceRequest } }
          : win,
      ),
    );
    setActiveWindowId("reference");
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
            initialLessonRequest={payload?.lessonRequest}
            onOpenPractice={(program) => openPractice(program.slug)}
            onOpenReference={(categoryId) => openReference(categoryId)}
          />
        );
      }
      case "programs":
        return (
          <ProgramsWindow
            onOpenPractice={(program) => openPractice(program.slug)}
            onOpenReference={(categoryId) => openReference(categoryId)}
          />
        );
      case "practice": {
        const payload = win.payload as PracticeWindowPayload | undefined;
        return (
          <PracticeWindow
            key={payload ? `practice-${payload.programSlug}` : "static"}
            initialProgramSlug={payload?.programSlug}
            onOpenLesson={openLesson}
            onOpenReference={(categoryId) => openReference(categoryId)}
          />
        );
      }
      case "reference": {
        const payload = win.payload as ReferenceWindowPayload | undefined;
        return (
          <ReferenceWindow
            key={payload ? `reference-${payload.categoryId}` : "static"}
            categoryId={payload?.categoryId}
            request={payload?.referenceRequest}
          />
        );
      }
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
                onActivate={() => openAppWindow(icon.id)}
              />
            </div>
          ))}
        </div>

        <div className="windows">
          {windows.map((win) => (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              isActive={activeWindowId === win.id}
              isMinimized={win.minimized}
              isMaximized={win.maximized}
              style={DEFAULT_STYLES[win.id]}
              icon={WINDOW_TITLES_FROM_TYPES[win.id] ? <AcademyIcon size={16} /> : undefined}
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
        onActivateWindow={activateWindow}
      />
    </div>
  );
}
