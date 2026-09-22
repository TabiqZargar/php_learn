"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { getProgramBySlug } from "@/content";
import type { Program } from "@/lib/learning/types";
import type { PracticeConfig, PracticeResult } from "@/lib/practice/types";
import type { EvaluationResult } from "@/lib/practice/evaluation";
import { checkPracticeSolution, createStatefulSession, destroyStatefulSession, executeStatefulPractice } from "@/lib/practice/clientApi";
import { practiceRunner } from "@/lib/practice/runner";
import { hintReducer, INITIAL_HINT_STATE } from "@/lib/practice/hintState";
import { useProgress } from "@/components/progress/ProgressProvider";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { FeedbackPanel } from "./FeedbackPanel";
import { PracticeControls } from "./PracticeControls";
import { PracticeInputField } from "./PracticeInput";
import { PracticeOutput } from "./PracticeOutput";
import { PracticeProblem } from "./PracticeProblem";
import { StatefulSessionBar } from "./StatefulSessionBar";

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
  const {
    recordEvaluationResult,
    recordHintRevealed,
    recordResume,
    getProgramProgress,
    hydrated,
  } = useProgress();
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

  // Stateful practice session lifecycle (Phase 9A). A session must be
  // started before requests can run; it owns the isolated PHP workspace.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // The provider recreates these on every recompute; effects read them
  // through refs so keying on the functions themselves cannot loop.
  const eventFnsRef = useRef({ recordResume, recordHintRevealed, getProgramProgress });
  useEffect(() => {
    eventFnsRef.current = { recordResume, recordHintRevealed, getProgramProgress };
  });

  // Focus the window heading on open (keyed remount per program), so
  // keyboard users land on the program rather than the page-level chrome.
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Opening the practice window is a meaningful program open: it becomes
  // the resume target (a hidden render never does this — only this mount).
  useEffect(() => {
    if (program) eventFnsRef.current.recordResume("program", program.slug);
  }, [program]);

  // Restore the persisted hint reveal level once progress has loaded. The
  // reducer clamps to the program's hint count, so a stale/larger persisted
  // value is never over-revealed.
  useEffect(() => {
    if (!hydrated || !program) return;
    const persisted = eventFnsRef.current.getProgramProgress(program.slug)?.maxHintsRevealed ?? 0;
    dispatchHint({
      type: "hydrate",
      revealedCount: persisted,
      totalHints: program.hints?.length ?? 0,
    });
  }, [hydrated, program]);

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

  const isStateful = practice.execution === "stateful";

  const handleStartSession = async () => {
    if (isRunning || isChecking || startingSession) return;
    setSessionNotice(null);
    setStartingSession(true);
    try {
      const created = await createStatefulSession(program.slug);
      if (!created) {
        setSessionNotice("Could not start a practice session. Try again.");
        return;
      }
      setSessionId(created.sessionId);
      setSessionActive(true);
      setResult(null);
      setEvaluation(null);
    } finally {
      setStartingSession(false);
    }
  };

  const handleResetSession = async () => {
    if (!sessionId) return;
    await destroyStatefulSession(sessionId);
    setSessionId(null);
    setSessionActive(false);
    setSessionNotice(null);
    setResult(null);
    setEvaluation(null);
  };

  const handleRun = async () => {
    if (isRunning || isChecking) return;
    if (isStateful && !sessionId) {
      setSessionNotice("Start a practice session before running a request.");
      return;
    }
    setResult(null);
    setEvaluation(null);
    setIsRunning(true);
    try {
      const runResult = isStateful
        ? await executeStatefulPractice(sessionId ?? "", program.slug, code, inputValues)
        : await practiceRunner.run(code, currentInputs);
      if (
        isStateful &&
        (runResult.status === "session_expired" || runResult.status === "session_not_found")
      ) {
        setSessionId(null);
        setSessionActive(false);
        setSessionNotice(runResult.message ?? "The practice session is no longer available.");
      }
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
      recordEvaluationResult(program.slug, checked);
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

  const handleRevealHint = () => {
    const totalHints = program.hints?.length ?? 0;
    const revealedCount = Math.min(hintState.revealedCount + 1, totalHints);
    dispatchHint({ type: "reveal", totalHints });
    recordHintRevealed(program.slug, revealedCount);
  };

  return (
    <div className="practice-window">
      <header className="practice-header">
        <h1 ref={headingRef} tabIndex={-1}>
          {program.title}
        </h1>
        <p className="practice-header-sub">
          Practice &middot; {program.difficulty} &middot; {program.category}
          {isStateful ? " &middot; Execution: Stateful PHP" : ""}
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
          {isStateful ? (
            <StatefulSessionBar
              active={sessionActive}
              starting={startingSession}
              notice={sessionNotice}
              onStart={handleStartSession}
              onReset={handleResetSession}
            />
          ) : null}
          <PracticeControls
            onRun={handleRun}
            onCheck={handleCheck}
            onReset={handleReset}
            canReset={codeChanged || inputsChanged}
            running={isRunning}
            checking={isChecking}
            resetLabel={isStateful ? "Reset Editor" : "Reset"}
            sessionReady={!isStateful || sessionActive}
          />
        </div>
      </div>

      <PracticeOutput
        result={result}
        evaluation={evaluation}
        programProgress={getProgramProgress(program.slug)}
      />

      <FeedbackPanel
        evaluation={evaluation}
        hints={program.hints ?? []}
        revealedCount={hintState.revealedCount}
        onRevealHint={handleRevealHint}
        references={program.lessonReferences ?? []}
        onOpenLesson={onOpenLesson}
      />
    </div>
  );
}