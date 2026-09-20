import type { PracticeInput as PracticeInputModel } from "@/lib/practice/types";

interface PracticeInputFieldProps {
  input: PracticeInputModel;
  value: string;
  onChange: (value: string) => void;
}

/** Labeled text/number field for the practice Input panel. */
export function PracticeInputField({ input, value, onChange }: PracticeInputFieldProps) {
  return (
    <label className="practice-input">
      <span className="practice-input-label">{input.label}</span>
      <input
        className="xp-input"
        type={input.type === "number" ? "number" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={input.label}
        step={input.type === "number" ? "1" : undefined}
        inputMode={input.type === "number" ? "numeric" : undefined}
      />
      {input.description ? (
        <span className="practice-input-hint">{input.description}</span>
      ) : null}
    </label>
  );
}