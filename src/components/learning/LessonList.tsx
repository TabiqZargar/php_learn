"use client";

import type { Lesson } from "@/lib/learning/types";
import { SideNavItem } from "@/components/navigation/SideNav";
import { useProgress } from "@/components/progress/ProgressProvider";

interface LessonListProps {
  lessons: Lesson[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

/** Reusable list of lesson entries for the XP side pane. */
export function LessonList({ lessons, selectedSlug, onSelect }: LessonListProps) {
  const { isLessonCompleted } = useProgress();

  return (
    <>
      {lessons.map((lesson) => {
        const completed = isLessonCompleted(lesson.slug);
        return (
          <SideNavItem
            key={lesson.id}
            label={lesson.title}
            selected={lesson.slug === selectedSlug}
            complete={completed}
            ariaLabel={completed ? `${lesson.title}, completed` : lesson.title}
            onSelect={() => onSelect(lesson.slug)}
          />
        );
      })}
    </>
  );
}