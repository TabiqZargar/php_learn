"use client";

import { useEffect, useRef, useState } from "react";
import { FIRST_LESSON, LESSONS, PROGRAMS, getLessonBySlug, getProgramBySlug } from "@/content";
import type { Lesson, Program } from "@/lib/learning/types";
import { previousIndex, nextIndex } from "@/lib/learning/navigation";
import { useProgress } from "@/components/progress/ProgressProvider";
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
 * program content, with a white reading pane. State is local only; the
 * last meaningful open/navigation is recorded to progress as the resume
 * target so "Continue Learning" can jump back.
 */
export function AcademyWindow({ onOpenPractice, initialLessonSlug }: AcademyWindowProps) {
  const { recordResume } = useProgress();
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
    if (nextView === "lesson" || nextView === "program") {
      recordResume(nextView, nextSlug);
    }
  };

  const selectLesson = (slug: string) => navigate("lesson", slug);
  const selectProgram = (slug: string) => navigate("program", slug);

  const handleContinueLearning = (target: { type: "lesson" | "program"; slug: string }) => {
    if (target.type === "lesson") {
      selectLesson(target.slug);
      return;
    }
    const program = getProgramBySlug(target.slug);
    if (program && program.practice && onOpenPractice) {
      onOpenPractice(program);
    } else if (program) {
      navigate("program", program.slug);
    }
  };

  // A related-lesson click remounts this window on the requested lesson;
  // that counts as a meaningful open, so it becomes the resume target too.
  // recordResume is read through a ref because the provider recreates it on
  // recompute; keying effects on it would otherwise loop.
  const recordResumeRef = useRef(recordResume);
  useEffect(() => {
    recordResumeRef.current = recordResume;
  });
  useEffect(() => {
    if (initialLessonSlug) recordResumeRef.current("lesson", initialLessonSlug);
  }, [initialLessonSlug]);

  const prevLessonIndex = lessonIndex >= 0 ? previousIndex(lessonIndex, LESSONS.length) : undefined;
  const nextLessonIndex = lessonIndex >= 0 ? nextIndex(lessonIndex, LESSONS.length) : undefined;
  const prevProgramIndex =
    programIndex >= 0 ? previousIndex(programIndex, PROGRAMS.length) : undefined;
  const nextProgramIndex =
    programIndex >= 0 ? nextIndex(programIndex, PROGRAMS.length) : undefined;

  const prevLesson: Lesson | undefined =
    prevLessonIndex !== undefined ? LESSONS[prevLessonIndex] : undefined;
  const nextLesson: Lesson | undefined =
    nextLessonIndex !== undefined ? LESSONS[nextLessonIndex] : undefined;
  const prevProgram: Program | undefined =
    prevProgramIndex !== undefined ? PROGRAMS[prevProgramIndex] : undefined;
  const nextProgram: Program | undefined =
    nextProgramIndex !== undefined ? PROGRAMS[nextProgramIndex] : undefined;

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
        onContinueLearning={handleContinueLearning}
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