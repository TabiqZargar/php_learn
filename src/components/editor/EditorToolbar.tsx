"use client";

import { XpButton } from "@/components/ui/XpButton";

interface EditorToolbarProps {
  onCopy: () => void;
  copied: boolean;
}

/** Small button strip above the code editor. */
export function EditorToolbar({ onCopy, copied }: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      {copied ? (
        <span className="editor-toast" role="status">
          Copied
        </span>
      ) : null}
      <XpButton onClick={onCopy} aria-label="Copy the current code to the clipboard">
        Copy
      </XpButton>
    </div>
  );
}