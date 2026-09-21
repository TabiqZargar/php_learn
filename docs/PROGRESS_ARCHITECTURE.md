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
}
```

Stored under the key `php-academy-progress:v1`.

- `LessonProgress`: `{ completed, completedAt? }`
- `ProgramProgress`: `{ completed, completedAt?, bestPassed, bestTotal,
  lastStatus?, lastPassed?, lastTotal?, lastCheckedAt?, maxHintsRevealed }`

Only progress metadata is persisted. **Source code, program output, inputs,
expected outputs, diagnostics, and per-run artifacts are never stored.**

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

## What each consumer shows

- **LessonView** — Mark Complete / "✓ Completed" toggle (`aria-pressed`).
- **Sidebar lesson list** — completed lessons get a checkmark and an
  accessible "(…, completed)" label (the checkmark is not the only cue).
- **Sidebar program list** — metadata only for programs with test cases:
  `Completed`, `Best: X/Y tests`, or `Not attempted`.
- **ProgressSummary** — lessons `X / LESSONS.length` and practice programs
  `X / PROGRAMS.filter(p => p.testCases)`, both derived from the actual
  curriculum, plus the confirm-gated reset.

## Boundary (out of scope)

No accounts, no API routes, no server storage, no sync, no gamification. When
the app moves to a backend, the repository interface is the seam: implement a
`ProgressRepository` backed by an API/database and keep the same service rules
and versioned state shape.