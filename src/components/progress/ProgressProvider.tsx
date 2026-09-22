"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { EvaluationResult } from "@/lib/practice/evaluation";
import type { ProgressState, ProgramProgress, ResumeInfo } from "@/lib/progress/types";
import { createEmptyProgressState } from "@/lib/progress/repository.ts";
import type { ProgressRepository } from "@/lib/progress/repository.ts";
import { localStorageProgressRepository } from "@/lib/progress/localStorageRepository.ts";
import { LESSONS, PROGRAMS, getLessonBySlug, getProgramBySlug } from "@/content";
import {
  getLessonProgress,
  getProgramProgress,
  getSummary,
  isResumeTargetKnown,
  markLessonComplete,
  recordEvaluation,
  recordHintReveal,
  resetProgress,
  setResume,
} from "@/lib/progress/service.ts";

const EMPTY_STATE = createEmptyProgressState();

const LESSON_SLUGS = LESSONS.map((lesson) => lesson.slug);
const PROGRAM_SLUGS = PROGRAMS.map((program) => program.slug);

/** A resume that resolved against the content registry and is safe to show. */
export interface ResolvedResume {
  type: ResumeInfo["type"];
  slug: string;
  updatedAt: string;
  title: string;
  /** true when the target has already been completed (controls "Review"). */
  completed: boolean;
}

interface ProgressContextValue {
  /** True once persisted progress has been loaded (after mount). */
  hydrated: boolean;
  isLessonCompleted: (slug: string) => boolean;
  toggleLessonCompleted: (slug: string) => void;
  recordEvaluationResult: (programSlug: string, result: EvaluationResult) => void;
  /** Persists the highest hint level reached (idempotent, never decreases). */
  recordHintRevealed: (programSlug: string, revealedCount: number) => void;
  getProgramProgress: (slug: string) => ProgramProgress | undefined;
  /** Records the last opened learning location (validated against content). */
  recordResume: (type: ResumeInfo["type"], slug: string) => void;
  /** Last opened learning location as persisted, unvalidated. */
  resume: ResumeInfo | undefined;
  /**
   * The resume resolved against the curriculum (title + completion flag),
   * or null when there is nothing to resume or the stored slug is unknown.
   */
  resumeTarget: ResolvedResume | null;
  lessonsCompleted: number;
  programsCompleted: number;
  /** Persist an empty state (only wired to an explicit user action). */
  resetAllProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  /** Injectable for tests; defaults to the localStorage-backed repository. */
  repository?: ProgressRepository;
}

/**
 * Makes anonymous learning progress available to the whole app.
 *
 * Progress is rendered as an empty state during SSR and the first client
 * paint, then hydrated from the repository in an effect — so server and
 * client markup always match. Mutations flow through the pure service
 * rules and are persisted best-effort through the repository.
 */
export function ProgressProvider({ children, repository }: ProgressProviderProps) {
  const [state, setState] = useState<ProgressState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const repoRef = useRef<ProgressRepository | null>(null);
  const stateRef = useRef<ProgressState>(EMPTY_STATE);

  useEffect(() => {
    const repo = repository ?? localStorageProgressRepository();
    repoRef.current = repo;
    // Hydrate after paint so server and client markup stay identical; the
    // first paint always renders the empty state.
    const task = window.setTimeout(() => {
      const stored = repo.load();
      stateRef.current = stored;
      setState(stored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(task);
  }, [repository]);

  const apply = useCallback((next: (prev: ProgressState) => ProgressState) => {
    const updated = next(stateRef.current);
    stateRef.current = updated;
    setState(updated);
    repoRef.current?.save(updated);
  }, []);

  const summary = useMemo(() => getSummary(state), [state]);

  const resumeTarget = useMemo<ResolvedResume | null>(() => {
    const resume = state.resume;
    if (!resume) return null;
    if (resume.type === "lesson") {
      const lesson = getLessonBySlug(resume.slug);
      if (!lesson) return null;
      return {
        type: resume.type,
        slug: resume.slug,
        updatedAt: resume.updatedAt,
        title: lesson.title,
        completed: state.lessons[resume.slug]?.completed === true,
      };
    }
    const program = getProgramBySlug(resume.slug);
    if (!program) return null;
    return {
      type: resume.type,
      slug: resume.slug,
      updatedAt: resume.updatedAt,
      title: program.title,
      completed: state.programs[resume.slug]?.completed === true,
    };
  }, [state.lessons, state.programs, state.resume]);

  const value = useMemo<ProgressContextValue>(() => {
    const stateNow = () => stateRef.current;
    return {
      hydrated,
      isLessonCompleted: (slug) => getLessonProgress(stateNow(), slug)?.completed === true,
      toggleLessonCompleted: (slug) => {
        const completed = getLessonProgress(stateNow(), slug)?.completed === true;
        apply((prev) => markLessonComplete(prev, slug, !completed));
      },
      recordEvaluationResult: (programSlug, result) => {
        apply((prev) => recordEvaluation(prev, programSlug, result));
      },
      recordHintRevealed: (programSlug, revealedCount) => {
        apply((prev) => recordHintReveal(prev, programSlug, revealedCount));
      },
      recordResume: (type, slug) => {
        if (!isResumeTargetKnown({ type, slug, updatedAt: "" }, LESSON_SLUGS, PROGRAM_SLUGS)) {
          return;
        }
        apply((prev) => setResume(prev, type, slug));
      },
      getProgramProgress: (slug) => getProgramProgress(stateNow(), slug),
      resume: state.resume,
      resumeTarget,
      lessonsCompleted: summary.lessonsCompleted,
      programsCompleted: summary.programsCompleted,
      resetAllProgress: () => apply(() => resetProgress()),
    };
  }, [apply, hydrated, resumeTarget, state.resume, summary]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}