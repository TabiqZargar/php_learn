"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { LineNumbers } from "./LineNumbers";

interface CodeEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Accessible name announced by assistive tech. */
  label?: string;
}

const TAB_SIZE = 4;

/**
 * Lightweight read/write code editor: a hidden sizing <pre> defines the
 * scroll area, a monospace <textarea> overlays it, and a gutter renders
 * line numbers. The outer container scrolls both in sync, so long lines
 * and long files never hide content. No Monaco / CodeMirror dependency.
 */
export function CodeEditor({ id, value, onChange, label = "PHP code editor" }: CodeEditorProps) {
  const generatedId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorId = id ?? generatedId;

  const endsWithNewline = value.endsWith("\n");
  const totalLines = value.split("\n").length + (endsWithNewline ? 1 : 0);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;
    event.preventDefault();

    const el = textareaRef.current;
    if (!el) return;

    if (event.shiftKey) {
      el.blur();
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(value.slice(0, start) + " ".repeat(TAB_SIZE) + value.slice(end));

    // Restore the caret just after the inserted indentation.
    window.requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + TAB_SIZE;
    });
  };

  return (
    <div className="editor">
      <div className="editor-scroll">
        <LineNumbers lines={totalLines} />
        <div className="editor-wrap">
          <pre className="editor-sizer" aria-hidden="true">
            {value}
            {endsWithNewline ? " " : ""}
          </pre>
          <textarea
            id={editorId}
            ref={textareaRef}
            className="editor-textarea"
            aria-label={label}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  );
}