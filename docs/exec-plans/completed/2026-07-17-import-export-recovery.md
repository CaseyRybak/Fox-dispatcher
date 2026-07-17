# Import, export, and storage recovery

Status: complete on 2026-07-17; verified locally and not yet published to Vercel

## Intent

Execute the approved [Phase 8 specification](../../specs/completed/2026-07-17-import-export-recovery.md) without weakening the released local-first, explainable report.

## Acceptance evidence

- Oversize, malformed, and schema-invalid JSON cannot mutate accepted observations.
- Valid paste/file input produces exact preview facts and replaces only after explicit confirmation.
- Replacement resets filters, preserves policy, persists, and recalculates all views.
- Export contains the full authoritative array in the documented deterministic artifact.
- Corrupt and future-version storage remains intact and inspectable until explicit recovery.
- Import, export, and recovery work by keyboard at desktop and 320 px with no browser errors or external requests.

## Context and domain map

`observation-monitoring` remains the only bounded context. The domain observation values do not change. Application interfaces describe import results, preview facts, export requests, and recovery metadata. Adapters own JSON/Zod, UTF-8, Blob/object URL, file decoding, and localStorage. The app composition root accepts replacement and persistence; UI owns only draft/dialog interaction state.

## Decisions

- Reuse `observationArraySchema`; do not duplicate field validation in React.
- Keep parse and serialization deterministic and side-effect-free before browser download.
- Use native dialogs and existing status/focus conventions.
- Preserve scoring policy and reset filters on accepted whole-dataset replacement.
- Treat explicit starter reset as the only storage-recovery action in this slice; raw text remains selectable without a clipboard API dependency.
- Add no package dependency.

## Execution slices

### Slice 1: Atomic import and export boundaries

- Files and interfaces: `application/observation-transfer.ts`, `adapters/json-observation-transfer/`, `adapters/observation-schema.ts`.
- Write failing tests for byte limits, malformed JSON, paths, strict fields, duplicates, empty input, preview, round-trip, artifact metadata, and browser cleanup.
- Implement parser/serializer and browser file/download adapters through application types.
- Verification: `npm run test:run -- import-export` passes with current neighboring schema tests.

### Slice 2: Explicit storage recovery

- Files and interfaces: `application/dashboard-state-store.ts`, browser state adapter and persistence tests, bootstrap state.
- Write failing tests proving corrupt/future results include exact raw values and remain unmodified.
- Surface recovery metadata without enabling autosave; resolve only after explicit clear/reset.
- Verification: `npm run test:run -- persistence recovery` passes.

### Slice 3: Accessible data-management interface

- Files and interfaces: `App.tsx`, `ApplicationShell.tsx`, `ObservationsPage.tsx`, new `ObservationImportDialog.tsx`, styles, component tests.
- Add data actions, native import dialog, errors/preview, explicit replacement, deterministic export, and recovery panel.
- Preserve dialog draft and return focus; reset filters on replacement and announce one result.
- Verification: `npm run test:run -- import-recovery manage-observations accessibility` passes.

### Slice 4: Browser and repository acceptance

- Files and interfaces: Phase 8 browser script, package scripts, verification evidence, README, architecture, AGENTS maps.
- Exercise invalid/valid import, persistence reload, full export, future-version recovery, desktop/320 px, headers/request boundary, and console.
- Run full repository gate and inspect screenshots.
- Verification: `npm run test:e2e:import-recovery` and `npm run verify` pass.

## Integration evidence

[Phase 8 evidence](../../verification/phase-8-import-export-recovery.md) records the focused/full commands, browser result, screenshots, download behavior, recovery behavior, console/request results, and remaining release boundary.

## Resulting repository artifacts

- validated JSON import boundary and deterministic export adapter;
- accessible whole-dataset replacement and full-data download UI;
- explicit corrupt/future storage recovery surface;
- focused and browser regression evidence;
- completed Phase 8 plan and updated repository maps.
