"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { getProgramBySlug } from "@/content";
import type { Program } from "@/lib/learning/types";
import type { PracticeConfig, PracticeResult } from "@/lib/practice/types";
import type { EvaluationResult } from "@/lib/practice/evaluation";
import { checkPracticeSolution } from "@/lib/practice/clientApi";
import { practiceRunner } from "@/lib/practice/runner";
import { INITIAL_HINT_STATE, hintReducer } from "@/lib/practice/hintState";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { FeedbackPanel } from "./FeedbackPanel";
import { PracticeControls } from "./PracticeControls";
import { PracticeInputField } from "./PracticeInput";
import { PracticeOutput } from "./PracticeOutput";
import { PracticeProblem } from "./PracticeProblem";

interface PracticeWindowProps {
  programSlug?: string;
  /** Opens a lesson in the Academy window (wired by the desktop manager). */
  onOpenLesson?: (lessonSlug: string) => void;
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
export function PracticeWindow({ programSlug, onOpenLesson }: PracticeWindowProps) {
  const program: Program | undefined = getProgramBySlug(programSlug ?? null);
  const practice = program?.practice;

  const [code, setCode] = useState(practice?.starterCode ?? "");
  const [inputValues, setInputValues] = useState<Record<string, string>>(() =>
    defaultInputValues(practice),
  );
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [hintState, dispatchHint] = useReducer(hintReducer, INITIAL_HINT_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
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

  const handleRun = async () => {
    if (isRunning || isChecking) return;
    setResult(null);
    setEvaluation(null);
    setIsRunning(true);
    try {
      const runResult = await practiceRunner.run(code, currentInputs);
      setResult(runResult);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheck = async () => {
    if (isRunning || isChecking) return;
    setResult(null);
    setEvaluation(null);
    setIsChecking(true);
    try {
      const checked = await checkPracticeSolution(program.slug, code);
      setEvaluation(checked);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setCode(practice.starterCode);
    setInputValues(defaultInputValues(practice));
    setResult(null);
    setEvaluation(null);
    setCopied(false);
    dispatchHint({ type: "reset" });
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
            onCheck={handleCheck}
            onReset={handleReset}
            canReset={codeChanged || inputsChanged}
            running={isRunning}
            checking={isChecking}
          />
        </div>
      </div>

      <PracticeOutput result={result} evaluation={evaluation} />

      <FeedbackPanel
        evaluation={evaluation}
        hints={program.hints ?? []}
        revealedCount={hintState.revealedCount}
        onRevealHint={() =>
          dispatchHint({ type: "reveal", totalHints: program.hints?.length ?? 0 })
        }
        references={program.lessonReferences ?? []}
        onOpenLesson={onOpenLesson}
      />
    </div>
  );
}