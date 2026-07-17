# Phase 5 observation management verification

Status: accepted and published in `0021c6d`; uncommitted consistency-audit corrections pass focused and repository gates, while a fresh browser rerun is environment-blocked

Evidence date: 2026-07-16

Published baseline: `699d457a84d8f3fdc8ff5ae7f0b9d15c5ed0aa9c`

Published Phase 5 revision: `0021c6d8bc55b55734ac503676f0e36a30d392ee`

## Accepted scope

Phase 5 adds proportionate observation management without changing the suspicion formula or inventing new fox attributes:

- add and edit validate `fox_id`, `location`, `color`, `has_prey`, `suspicion_level`, and `time` before one atomic state transition;
- new technical IDs are immutable `obs_<uuid>` values created by an injected secure browser adapter;
- delete exposes one persistent undo action, reset explicitly restores the five starter records, and all derived report sections recalculate from the same accepted array;
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

The published regression suite contains 46 passing tests across 11 files. The repository gate passed formatting, lint, import boundaries, public Worklog safety/link checks, tests, typecheck, and the Vite production build:

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
- The Phase 4 CI history correction and its related documentation changes were published together with Phase 5 in `0021c6d`.

## Consistency audit follow-up

A fresh audit found that the repository status claims had not been updated after `0021c6d` reached both `main` and `origin/main`. It also reproduced two user-impacting defects: error-summary anchors changed the application route, and an open editor could be retargeted while retaining the previous observation draft. The audit additionally confirmed missing strict runtime validation for `has_prey`, unsafe CSS-selector interpolation of schema-valid IDs, incomplete mutation/persistence feedback, missing desktop sorting semantics, and focus gaps after undo and confirmation actions.

The uncommitted follow-up:

- validates all six draft fields defensively before acceptance, including runtime string and boolean types;
- keeps error-summary navigation inside the editor and safely resolves punctuation-heavy observation IDs;
- prevents background row/add actions from retargeting an open editor;
- implements default time-descending ledger sorting, sortable header buttons, stable ID tie-breaks, and `aria-sort`;
- restores focus after undo, deletion fallback, discard/reset cancellation, save, and starter reset;
- separates focus intents from schema-valid observation IDs, keeps editor naming valid for whitespace/punctuation IDs, and provides explicit undo dismissal;
- exposes persistence state on every destination and includes observation or scoring-policy memory-only failure in the atomic live message;
- classifies malformed storage versions as corrupt while reserving unsupported-version for future integer versions;
- adds component/adapter coverage for editor isolation, sorting and ID tie-breaks, reset with policy reload, invalid-storage visibility, failed-save memory state, strict envelope rejection, schema-valid unusual IDs, and focus recovery;
- adds the Phase 5 production-browser flow to CI and strengthens its undo focus/status assertions.

## Consistency-audit verification

The current host exposes the system default Node `18.19.1`/npm `9.2.0`, which cannot start the pinned Rolldown/Vitest toolchain. A compatible Node `24.18.0` runtime was available for fresh checks, but the npm CLI remained `9.2.0` rather than the repository-pinned npm `11.13.0`. This is useful working-tree evidence, not a substitute for the exact CI toolchain check.

```text
npm run test:run -- manage-observations mutations persistence
Test Files  3 passed (3)
Tests       33 passed (33)

npm run test:run
Test Files  11 passed (11)
Tests       68 passed (68)

npm run verify
Pass
```

`npm run test:e2e:manage-observations` rebuilt the production application successfully, then the sandbox rejected `listen 127.0.0.1:4173` with `EPERM`. No browser assertions ran and the two visual artifacts above remain the published `0021c6d` baseline rather than fresh screenshots of this follow-up. The new CI step will run this gate with the pinned toolchain in an environment that permits the preview server.

## Handoff

At the Phase 5 close, Phase 6 remained responsible for the final mobile card/table treatment, route/back protection for a dirty inline editor as it became a modal-grade surface, confirmation trapping, and broader keyboard, zoom, text-spacing, contrast-preference, reduced-motion, and assistive-technology evidence. Those implementation responsibilities are now closed in [Phase 6 accessibility evidence](accessibility-evidence.md); its native-screen-reader limitation remains an explicit release-environment check rather than a completed local pass. Phase 7 remains responsible for the public Vercel deployment. Phase 5 itself was committed and pushed in `0021c6d`, with its consistency hardening later published in `df434c9`.
