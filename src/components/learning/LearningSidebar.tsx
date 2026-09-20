"use client";

import { useMemo, useState } from "react";
import type { Lesson, Program } from "@/lib/learning/types";
import { SideNav, SideNavItem } from "@/components/navigation/SideNav";
import { LessonList } from "./LessonList";
import { ProgramList } from "./ProgramList";

interface LearningSidebarProps {
  lessons: Lesson[];
  programs: Program[];
  activeView: "home" | "lesson" | "program";
  selectedSlug: string | null;
  onHome: () => void;
  onSelectLesson: (slug: string) => void;
  onSelectProgram: (slug: string) => void;
}

export function LearningSidebar({
  lessons,
  programs,
  activeView,
  selectedSlug,
  onHome,
  onSelectLesson,
  onSelectProgram,
}: LearningSidebarProps) {
  const [query, setQuery] = useState("");

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q),
    );
  }, [lessons, query]);

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(
      (program) =>
        program.title.toLowerCase().includes(q) ||
        program.description.toLowerCase().includes(q),
    );
  }, [programs, query]);

  return (
    <SideNav title="PHP Academy">
      <input
        type="search"
        className="xp-input"
        placeholder="Search lessons & programs"
        aria-label="Search lessons and programs"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <SideNavItem
        label="Learning Home"
        selected={activeView === "home"}
        onSelect={onHome}
      />
      <span className="side-pane-group">PHP Basics</span>
      <LessonList
        lessons={filteredLessons}
        selectedSlug={activeView === "lesson" ? selectedSlug : null}
        onSelect={onSelectLesson}
      />
      <span className="side-pane-group">Programs</span>
      <ProgramList
        programs={filteredPrograms}
        selectedSlug={activeView === "program" ? selectedSlug : null}
        onSelect={onSelectProgram}
      />
    </SideNav>
  );
}