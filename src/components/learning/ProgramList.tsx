import type { Program } from "@/lib/learning/types";
import { SideNavItem } from "@/components/navigation/SideNav";

interface ProgramListProps {
  programs: Program[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

/** Reusable list of program entries for the XP side pane. */
export function ProgramList({ programs, selectedSlug, onSelect }: ProgramListProps) {
  return (
    <>
      {programs.map((program) => (
        <SideNavItem
          key={program.id}
          label={program.title}
          selected={program.slug === selectedSlug}
          onSelect={() => onSelect(program.slug)}
        />
      ))}
    </>
  );
}