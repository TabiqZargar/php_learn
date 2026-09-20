import type { ReactNode } from "react";

interface PlaceholderContentProps {
  icon: ReactNode;
  heading: string;
  description: string;
  note: string;
  items?: string[];
}

/**
 * Generic placeholder window body used by Programs, Reference and
 * My Computer until those features are implemented in a later phase.
 */
export function PlaceholderContent({
  icon,
  heading,
  description,
  note,
  items = [],
}: PlaceholderContentProps) {
  return (
    <div className="placeholder-window">
      <div className="placeholder-hero">
        {icon}
        <div>
          <h2>{heading}</h2>
          <p>{description}</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="placeholder-list">
          {items.map((item) => (
            <div key={item} className="placeholder-list-item">
              <span className="side-pane-dot" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      )}

      <p className="placeholder-note">{note}</p>
    </div>
  );
}