"use client";

import { useState } from "react";
import { SideNav, SideNavItem } from "../navigation/SideNav";
import { XpButton } from "../ui/XpButton";
import { ProgramsIcon, ReferenceIcon } from "../icons/AppIcons";

interface AcademyContentProps {
  onOpenPrograms: () => void;
  onOpenReference: () => void;
}

const TOPICS = [
  "PHP Syntax",
  "Variables",
  "Data Types",
  "Conditions",
  "Loops",
  "Functions",
  "Arrays",
  "Strings",
  "Sessions",
  "Cookies",
  "Files",
  "MySQL",
];

/**
 * Main PHP Academy window content. A visual shell only: no lessons, editor
 * or execution logic is wired up in this phase.
 */
export function AcademyContent({ onOpenPrograms, onOpenReference }: AcademyContentProps) {
  const [learningNote, setLearningNote] = useState(false);

  return (
    <div className="academy-layout">
      <SideNav title="PHP Learning">
        <SideNavItem label="Basics" disabled />
        <SideNavItem label="Programs" onSelect={onOpenPrograms} />
        <SideNavItem label="Reference" onSelect={onOpenReference} />
      </SideNav>

      <div className="academy-content">
        <h1>Welcome to PHP Academy</h1>
        <p className="lead">Learn PHP one concept at a time.</p>

        <XpButton
          primary
          onClick={() => setLearningNote(true)}
          aria-describedby={learningNote ? "learning-note" : undefined}
        >
          Start Learning
        </XpButton>
        {learningNote && (
          <p id="learning-note" role="status" className="text-[12px] text-[#7a5b00] mt-2 mb-0">
            Lessons arrive in a later phase — this button is visual only for now.
          </p>
        )}

        <div className="card">
          <ProgramsIcon size={40} />
          <div className="card-text">
            <h3>Programs</h3>
            <p>12 guided PHP exercises.</p>
          </div>
        </div>

        <div className="card">
          <ReferenceIcon size={40} />
          <div className="card-text">
            <h3>Reference</h3>
            <p>PHP syntax reference and cheat sheets.</p>
          </div>
        </div>

        <h3 style={{ margin: "18px 0 6px", fontSize: 13, color: "#152a4e" }}>
          Topics you will cover
        </h3>
        <ul className="topics-list">
          {TOPICS.map((topic) => (
            <li key={topic}>
              <span
                className="code-chip"
                aria-hidden="true"
                style={{ padding: "0 4px", fontSize: 11 }}
              >
                &lt;?php
              </span>
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}