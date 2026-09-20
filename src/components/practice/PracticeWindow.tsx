"use client";

import { useEffect, useRef, useState } from "react";
import { getProgramBySlug } from "@/content";
import type { Program } from "@/lib/learning/types";
import type { PracticeConfig, PracticeResult } from "@/lib/practice/types";
import { practiceRunner } from "@/lib/practice/runner";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { PracticeControls } from "./PracticeControls";
import { PracticeInputField } from "./PracticeInput";
import { PracticeOutput } from "./PracticeOutput";
import { PracticeProblem } from "./PracticeProblem";

interface PracticeWindowProps {
  programSlug?: string;
}

function defaultInputValues(config: PracticeConfig | undefined): Record<string, string> {
  const values: Record<string, string> = {};
  config?.inputs.forEach((input) => {
    values[input.name] = input.value;
  });
  return values;
}

/**
 * The PHP Practice window. Local-only state: editable code, editable
 * inputs, and the last run result. Run always routes through the
 * practiceRunner abstraction — never through fake inline logic. Mounting
 * is keyed by program slug in the window manager, so state starts fresh
 * for every program.
 */
export function PracticeWindow({ programSlug }: PracticeWindowProps) {
  const program: Program | undefined = getProgramBySlug(programSlug ?? null);
  const practice = program?.practice;

  const [code, setCode] = useState(practice?.starterCode ?? "");
  const [inputValues, setInputValues] = useState<Record<string, string>>(() =>
    defaultInputValues(practice),
  );
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  if (!program || !practice) {
    return (
      <div className="practice-window">
        <div className="practice-pane practice-unavailable">
          <p>Practice is not available for this program yet.</p>
        </div>
      </div>
    );
  }

  const currentInputs = practice.inputs.map((input) => ({
    ...input,
    value: inputValues[input.name] ?? input.value,
  }));

  const handleRun = () => {
    setResult(practiceRunner.run(code, currentInputs));
  };

  const handleReset = () => {
    setCode(practice.starterCode);
    setInputValues(defaultInputValues(practice));
    setResult(null);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    });
  };

  const codeChanged = code !== practice.starterCode;
  const inputsChanged = practice.inputs.some(
    (input) => inputValues[input.name] !== input.value,
  );

  return (
    <div className="practice-window">
      <header className="practice-header">
        <h1>{program.title}</h1>
        <p className="practice-header-sub">
          Practice &middot; {program.difficulty} &middot; {program.category}
        </p>
      </header>

      <div className="practice-grid">
        <div className="practice-left">
          <PracticeProblem program={program} />
          <section className="practice-pane" aria-label="Input">
            <h2 className="practice-pane-title">Input</h2>
            {practice.inputs.map((input) => (
              <PracticeInputField
                key={input.name}
                input={input}
                value={inputValues[input.name] ?? ""}
                onChange={(value) =>
                  setInputValues((values) => ({ ...values, [input.name]: value }))
                }
              />
            ))}
          </section>
        </div>

        <div className="practice-right">
          <div className="practice-code-head">
            <label className="practice-code-label" htmlFor="practice-editor">
              PHP Code
            </label>
            <EditorToolbar onCopy={handleCopy} copied={copied} />
          </div>
          <CodeEditor
            id="practice-editor"
            value={code}
            onChange={setCode}
            label={`PHP code editor for ${program.title}`}
          />
          <PracticeControls
            onRun={handleRun}
            onReset={handleReset}
            canReset={codeChanged || inputsChanged}
          />
        </div>
      </div>

      <PracticeOutput result={result} />
    </div>
  );
}