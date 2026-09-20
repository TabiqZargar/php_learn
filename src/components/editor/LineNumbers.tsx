interface LineNumbersProps {
  /** Number of gutter rows to render. */
  lines: number;
}

/** Left-hand gutter with monotonically increasing line numbers. */
export function LineNumbers({ lines }: LineNumbersProps) {
  return (
    <div className="editor-gutter" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => index + 1).map((number) => (
        <div key={number} className="editor-line-no">
          {number}
        </div>
      ))}
    </div>
  );
}