import type { Lesson } from "@/lib/learning/types";
import { SideNavItem } from "@/components/navigation/SideNav";

interface LessonListProps {
  lessons: Lesson[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

/** Reusable list of lesson entries for the XP side pane. */
export function LessonList({ lessons, selectedSlug, onSelect }: LessonListProps) {
  return (
    <>
      {lessons.map((lesson) => (
        <SideNavItem
          key={lesson.id}
          label={lesson.title}
          selected={lesson.slug === selectedSlug}
          onSelect={() => onSelect(lesson.slug)}
        />
      ))}
    </>
  );
}