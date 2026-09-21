"use client";

import { useState } from "react";
import { FIRST_LESSON, LESSONS, PROGRAMS, getLessonBySlug, getProgramBySlug } from "@/content";
import type { Lesson, Program } from "@/lib/learning/types";
import { LearningSidebar } from "./LearningSidebar";
import { LessonView } from "./LessonView";
import { ProgramView } from "./ProgramView";
import { CourseHome } from "./CourseHome";

type ActiveView = "home" | "lesson" | "program";

interface AcademyWindowProps {
  /** Opens the practice window for a program in the desktop manager. */
  onOpenPractice?: (program: Program) => void;
  /**
   * When present, the Academy opens directly on this lesson instead of the
   * first lesson. The desktop manager keys this component by lesson request,
   * so a related-lessons click remounts it with a fresh value.
   */
  initialLessonSlug?: string;
}

/**
 * The PHP Academy window: XP side-pane navigation over the lesson and
 * program content, with a white reading pane. State is local only.
 */
export function AcademyWindow({ onOpenPractice, initialLessonSlug }: AcademyWindowProps) {
  const [activeView, setActiveView] = useState<ActiveView>("lesson");
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialLessonSlug ?? FIRST_LESSON.slug,
  );

  const lesson = activeView === "lesson" ? getLessonBySlug(selectedSlug) : undefined;
  const program = activeView === "program" ? getProgramBySlug(selectedSlug) : undefined;

  const lessonIndex = lesson ? LESSONS.findIndex((l) => l.id === lesson.id) : -1;
  const programIndex = program ? PROGRAMS.findIndex((p) => p.id === program.id) : -1;

  const navigate = (nextView: ActiveView, nextSlug: string) => {
    setActiveView(nextView);
    setSelectedSlug(nextSlug);
  };

  const selectLesson = (slug: string) => navigate("lesson", slug);
  const selectProgram = (slug: string) => navigate("program", slug);

  const prevLesson: Lesson | undefined = lessonIndex > 0 ? LESSONS[lessonIndex - 1] : undefined;
  const nextLesson: Lesson | undefined =
    lessonIndex >= 0 && lessonIndex < LESSONS.length - 1 ? LESSONS[lessonIndex + 1] : undefined;
  const prevProgram: Program | undefined =
    programIndex > 0 ? PROGRAMS[programIndex - 1] : undefined;
  const nextProgram: Program | undefined =
    programIndex >= 0 && programIndex < PROGRAMS.length - 1
      ? PROGRAMS[programIndex + 1]
      : undefined;

  return (
    <div className="academy-layout">
      <LearningSidebar
        lessons={LESSONS}
        programs={PROGRAMS}
        activeView={activeView}
        selectedSlug={selectedSlug}
        onHome={() => setActiveView("home")}
        onSelectLesson={selectLesson}
        onSelectProgram={selectProgram}
      />
      <main className="academy-content" id="academy-view">
        {activeView === "home" || (!lesson && !program) ? (
          <CourseHome
            onStartLessons={() => selectLesson(FIRST_LESSON.slug)}
            onBrowsePrograms={() => selectProgram(PROGRAMS[0].slug)}
          />
        ) : activeView === "lesson" && lesson ? (
          <LessonView
            lesson={lesson}
            index={lessonIndex}
            total={LESSONS.length}
            prevLabel={prevLesson?.title}
            nextLabel={nextLesson?.title}
            onPrev={prevLesson ? () => selectLesson(prevLesson.slug) : undefined}
            onNext={nextLesson ? () => selectLesson(nextLesson.slug) : undefined}
          />
        ) : program ? (
          <ProgramView
            program={program}
            index={programIndex}
            total={PROGRAMS.length}
            prevLabel={prevProgram?.title}
            nextLabel={nextProgram?.title}
            onPrev={prevProgram ? () => selectProgram(prevProgram.slug) : undefined}
            onNext={nextProgram ? () => selectProgram(nextProgram.slug) : undefined}
            onOpenPractice={onOpenPractice}
          />
        ) : null}
      </main>
    </div>
  );
}