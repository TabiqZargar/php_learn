interface CodeBlockProps {
  code: string;
  output?: string;
  outputLabel?: string;
  label?: string;
}

/**
 * Read-only code display with a classic editor look: a title strip,
 * preserved indentation, and horizontal scrolling for long lines.
 * Execution is intentionally NOT available in this phase.
 */
export function CodeBlock({ code, output, outputLabel = "Output", label = "example.php" }: CodeBlockProps) {
  const trimmed = code.trim();
  return (
    <figure className="code-block">
      <figcaption className="code-block-title">
        <span>{label}</span>
        <span className="code-block-lang" aria-hidden="true">
          php
        </span>
      </figcaption>
      <pre className="code-block-body">
        <code>{trimmed}</code>
      </pre>
      {output !== undefined ? (
        <div className="code-block-output">
          <div className="code-block-title">
            <span>{outputLabel}</span>
          </div>
          <pre className="code-block-body">
            <code>{output.trim()}</code>
          </pre>
        </div>
      ) : null}
    </figure>
  );
}