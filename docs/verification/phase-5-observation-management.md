# Phase 5 observation management verification

Status: accepted in the working tree; uncommitted and unpushed

Evidence date: 2026-07-16

Published baseline: `699d457a84d8f3fdc8ff5ae7f0b9d15c5ed0aa9c`

## Accepted scope

Phase 5 adds proportionate observation management without changing the suspicion formula or inventing new fox attributes:

- add and edit validate `fox_id`, `location`, `color`, `has_prey`, `suspicion_level`, and `time` before one atomic state transition;
- new technical IDs are immutable `obs_<uuid>` values created by an injected secure browser adapter;
- delete exposes one persistent undo action, reset explicitly restores the five assignment records, and all derived report sections recalculate from the same accepted array;
- observations and scoring policy persist locally in the strict `fox-dispatcher.dashboard` version-1 envelope;
- invalid or unavailable storage never replaces accepted in-memory data silently; the interface reports memory-only operation and offers explicit starter recovery;
- filters remain derived and unsaved; JSON import/export, raw-value recovery, and future-version tooling remain optional Phase 8 work.

## TDD and focused evidence

The initial focused run failed because neither the mutation commands nor persistence adapter existed. After implementation:

```text
npm run test -- manage-observations mutations persistence --run
Test Files  3 passed (3)
Tests       11 passed (11)
```

The tests prove normalized add, fixed ID injection, invalid/collision/generator failure, immutable edit, delete position, undo, exact starter reset, missing/valid/corrupt/unsupported/unavailable storage, failed saves, report recalculation, unique-fox updates, editor focus, generated IDs, and reload restoration.

The full regression suite contains 46 passing tests across 11 files. The repository gate passes formatting, lint, import boundaries, public Worklog safety/link checks, tests, typecheck, and the Vite production build:

```text
npm run verify
Pass
```

## Production-browser evidence

`npm run test:e2e:manage-observations` builds the production application and drives the repository-local official Playwright CLI through the real reviewer path. The accepted result is:

```json
{
  "consoleErrors": 0,
  "leader": "fox_004",
  "persistedSuspicion": 10,
  "score": "8.0",
  "viewport": 320
}
```

The flow proves:

- editing `obs_005.suspicion_level` from 3 to 10 makes `fox_004` the leader with displayed index `8,0`;
- save returns focus to `Изменить obs_005`;
- deleting the only `fox_004` observation reduces unique foxes from 4 to 3 and moves focus to the logical neighbor;
- one-step undo restores the deleted observation;
- reload restores the edited value 10 from local storage;
- the Observations route and stacked editor create no document-level overflow at 320 px;
- no console or page errors occur.

Visual artifacts:

- [Observation management, 1440 px](../../output/playwright/phase-5/observation-management-1440px.png)
- [Observation editor, 320 px](../../output/playwright/phase-5/observation-editor-320px.png)

## Architecture and safety review

- UI imports only application values and callbacks; browser storage and secure crypto remain concrete adapters composed in `app`.
- The domain scoring calculation is unchanged. Observation count, location, color, and time still add no hidden suspicion points.
- The persistence boundary uses strict objects, unique observation IDs, field limits, a policy step of 5, and a UTC timestamp. It performs no network request.
- Accepted state remains usable when storage access or save fails. Invalid stored values are not overwritten until the user explicitly restores the starter set.
- The pre-existing Phase 4 CI history correction and related documentation changes remain separate working-tree changes and were preserved.

## Handoff

Phase 6 remains responsible for the final mobile card/table treatment and the broader keyboard, zoom, text-spacing, contrast-preference, reduced-motion, and assistive-technology evidence. Phase 7 remains responsible for the public Vercel deployment. No commit or push was performed for Phase 5.
