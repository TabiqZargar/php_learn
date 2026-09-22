# Learning Progress Architecture

Anonymous learning progress is stored **only in the user's browser** via
`localStorage`. Nothing is sent to a server, and no identity is involved.

## Layering

```
ProgressProvider / useProgress (React context)
   → ProgressService (pure functions, src/lib/progress/service.ts)
   → ProgressRepository (interface, src/lib/progress/repository.ts)
   → LocalStorageProgressRepository (src/lib/progress/localStorageRepository.ts)
```

- Components only ever talk to `useProgress()`. They never read or write
  `localStorage` directly.
- `service.ts` is 100% pure: every mutation maps a `ProgressState` to a new
  `ProgressState`. This keeps the completion rules unit-testable with no DOM.
- The repository interface is the persistence boundary. A future
  database-backed implementation can replace the localStorage one without
  touching components.

## Data model

`src/lib/progress/types.ts` — a single versioned snapshot:

```ts
ProgressState {
  version: 1
  lessons:  Record<lessonSlug, LessonProgress>
  programs: Record<programSlug, ProgramProgress>
  resume?: { type: "lesson" | "program"; slug: string; updatedAt: ISO string }
}
```

Stored under the key `php-academy-progress:v1`.

- `LessonProgress`: `{ completed, completedAt? }`
- `ProgramProgress`: `{ completed, completedAt?, bestPassed, bestTotal,
  lastStatus?, lastPassed?, lastTotal?, lastCheckedAt?, maxHintsRevealed }`
- `resume` is the single last-opened learning location, kept *separate* from
  the completion records so "finished X" and "opened Y" never collide.

Only progress metadata is persisted. **Source code, program output, inputs,
expected outputs, diagnostics, and per-run artifacts are never stored.** The
resume entry holds only `type`, `slug`, `updatedAt` — nothing else.

### Resume & the version scheme

`resume` is an **optional, additive** field, so adding it did **not** bump the
stored shape: Phase 7 payloads (no `resume` key) still load as a supported
version-1 state and keep every completion record. The version stays `1`; a
future breaking change still lives behind a deliberate bump and explicit
migration.

Two layers validate a resume on its way in:

1. **Structural (repository)** — `normalizeProgressState` keeps a resume only
   when `type` is `lesson`/`program`, `slug` is a non-empty string, and
   `updatedAt` parses as a timestamp. Anything else (or a resume that is not an
   object at all) is silently dropped, so malformed storage never crashes.
2. **Registry (provider)** — `recordResume(type, slug)` ignores calls whose
   slug does not exist in `LESSONS`/`PROGRAMS` (via the pure
   `isResumeTargetKnown`), and `resumeTarget` (the resolved value consumed by
   UI) returns `null` when the stored slug is unknown. Unknown or removed
   content therefore fails gracefully instead of rendering a dead link.

## Storage & hydration

- `localStorageProgressRepository` guards `window`/`localStorage` and never
  throws: missing storage, malformed JSON, and unsupported versions all fall
  back to a clean empty state via the single `createEmptyProgressState()`
  factory.
- Versioning is explicit: `version` is validated on load; anything other than
  version 1 restarts clean rather than being guessed at. A future migration
  lives behind a deliberate bump, not automatic reconstruction.
- Progress renders as an *empty* state during SSR and the first client paint,
  then hydrates in an effect after mount — so server and client markup always
  match. Before hydration the summary shows a dash; lists show no marks.
- Reset is a real persistence action (`clear`-like): it is only exposed
  behind an explicit, confirm-gated user action in the sidebar summary.

## Completion rules (service.ts)

| Action | Rule |
| --- | --- |
| Lesson complete | Set manually by "Mark Complete" in a lesson; `completedAt` written **once**, on the first transition into the completed state |
| Lesson incomplete | Removes completed and its timestamp; re-completing writes a new timestamp |
| Program complete | Only when Check Solution returns a **full pass** (`status === "passed"` and `passed === total > 0`); never from Run |
| Completed program | Stays completed forever; later failures update `last*` but never clear it or its `completedAt` |
| `bestPassed` / `bestTotal` | Running maximum, never regresses; `bestTotal` travels with the best run |
| `lastStatus/lastPassed/lastTotal/lastCheckedAt` | Always reflect the newest Check outcome, timestamped at update time |
| `maxHintsRevealed` | Highest hint level reached; never decreases |
| Run / editor Reset | Never touches progress |
| Resume | Set by the last **meaningful open/navigation**: lesson or program selection and prev/next nav in the Academy, opening the practice window, and related-lesson opens from practice. **Not** recorded by hidden renders, desktop window open/close, Run, Reset, or hint reveals. The latest target replaces the previous one; completion records are untouched |

## Resume behavior (end to end)

- **Recording** — `AcademyWindow` records on lesson/program selection
  (`recordResume`) and prev/next navigation; `PracticeWindow` records its
  program on mount (which also covers opening practice from the standalone
  Programs window); a related-lessons click remounts the Academy on the
  lesson and records it. Nothing is recorded on window open/close, Run,
  Reset, or hint reveal.
- **Continue Learning** — the sidebar card (`ContinueLearning.tsx`) resolves
  the resume against the curriculum and shows the title, kind, and an action:
  *Continue* (lesson), *Practice* (program), or *Review* when the target is
  already completed. With no resume it offers *Start Learning*, beginning at
  the first lesson. A completed target is still shown — there is never an
  automatic redirect to it.
- **Hint restoration** — on opening a practice window (after progress has
  hydrated) the local hint reducer is restored to the persisted
  `maxHintsRevealed`, clamped to the program's hint count by the pure
  `hydrate` reducer action (e.g. a persisted `3` for a 2-hint program settles
  at its full reveal, `99` at the count). The window never reveals beyond the
  persisted level on its own; the editor-session Reset still sets the local
  level to `0` without persisting.
- **Attempt states** — the sidebar program list reads straight from the
  persisted `ProgramProgress`: `Not attempted`, `Best: X/Y tests`, or
  `Completed` plus `Best: X/Y tests`. Programs without test cases are marked
  *View only* and never counted as incomplete. The result panel shows the
  latest Check outcome, the running Best readout, and "✓ Program completed"
  on a full pass.

## Navigation

Lesson and program prev/next order comes from the content registry
(`LESSONS` / `PROGRAMS`), not hardcoded links. Pure helpers in
`src/lib/learning/navigation.ts` (`previousIndex` / `nextIndex`) return
`undefined` at the first/last item so the Previous (first) and Next (last)
controls render disabled; both `AcademyWindow` and `ProgramsWindow` use them.
Navigating also updates the resume target and preserves completion state.

## What each consumer shows

- **LessonView** — Mark Complete / "✓ Completed" toggle (`aria-pressed`).
- **Sidebar lesson list** — completed lessons get a checkmark and an
  accessible "(…, completed)" label (the checkmark is not the only cue).
- **Sidebar program list** — metadata for programs with test cases:
  `Completed` + `Best: X/Y tests`, `Best: X/Y tests`, or `Not attempted`;
  view-only programs show `View only`.
- **ProgressSummary** — lessons `X / LESSONS.length` and practice programs
  `X / PROGRAMS.filter(p => p.testCases)`, both derived from the actual
  curriculum, plus the confirm-gated reset.
- **ContinueLearning** — the sidebar resume card; hidden until hydration,
  then the resume target or the *Start Learning* fallback.
- **Practice result panel** — "Solution Check" / "Solution Complete", the
  per-run `X / Y tests passed`, the running `Best: X / Y tests`, "✓ Program
  completed" on a full pass, and the per-case expected/actual/diagnostic
  listing.

## Boundary (out of scope)

No accounts, no API routes, no server storage, no sync, no gamification. When
the app moves to a backend, the repository interface is the seam: implement a
`ProgressRepository` backed by an API/database and keep the same service rules
and versioned state shape.