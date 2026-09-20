import type { ReactNode } from "react";

/** XP-style section heading with a horizontal divider rule. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="xp-section-heading">
      <span>{children}</span>
    </h3>
  );
}