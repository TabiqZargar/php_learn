interface WindowControlsProps {
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onClose: () => void;
}

const glyphStyle = {
  display: "block",
} as const;

function MinimizeGlyph() {
  return (
    <svg width="10" height="9" viewBox="0 0 10 9" style={glyphStyle} aria-hidden="true">
      <rect x={1} y={6.4} width={8} height={2} rx={0.4} fill="currentColor" />
    </svg>
  );
}

function MaximizeGlyph() {
  return (
    <svg width="10" height="9" viewBox="0 0 10 9" style={glyphStyle} aria-hidden="true">
      <rect x={1.4} y={1} width={7.4} height={7} fill="currentColor" opacity="0.35" />
      <path
        d="M1.4 1.6 h7 v6.8 h-7 z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M1.4 1 h7.4 v0.9 h-7.4 z" fill="currentColor" />
    </svg>
  );
}

function RestoreGlyph() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" style={glyphStyle} aria-hidden="true">
      <rect x={3.4} y={3} width={6.6} height={5.4} fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M3.4 3 H7.6 V1 H1 V5.8 H3.4 Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={glyphStyle} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M1.4 1.4 L8.6 8.6" />
        <path d="M8.6 1.4 L1.4 8.6" />
      </g>
    </svg>
  );
}

export function WindowControls({
  isMaximized,
  onMinimize,
  onMaximizeToggle,
  onClose,
}: WindowControlsProps) {
  return (
    <div className="window-controls">
      <button
        type="button"
        className="window-control"
        onClick={onMinimize}
        aria-label="Minimize"
        title="Minimize"
      >
        <MinimizeGlyph />
      </button>
      <button
        type="button"
        className="window-control"
        onClick={onMaximizeToggle}
        aria-label={isMaximized ? "Restore down" : "Maximize"}
        title={isMaximized ? "Restore down" : "Maximize"}
      >
        {isMaximized ? <RestoreGlyph /> : <MaximizeGlyph />}
      </button>
      <button
        type="button"
        className="window-control"
        onClick={onClose}
        aria-label="Close"
        title="Close"
      >
        <CloseGlyph />
      </button>
    </div>
  );
}