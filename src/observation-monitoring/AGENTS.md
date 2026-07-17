# Observation Monitoring domain map

`observation-monitoring` is the single Fox Dispatcher bounded context. It turns validated observation records into an exact, explainable suspicion report and user-facing observation summaries.

## Current slice

Phase 3 is published on `main` in `9834af5`; its consistency hardening was published in `1b2bb24`, and the final focus and runner-guard corrections were published with Phase 4 in `699d457`. One report scope connects filters, ranking, selected-fox evidence, location activity, recent observations, and the read-only observation ledger. Production-browser evidence covers keyboard selection, policy recalculation, every filter type, combined scope, deterministic chip focus, the zero state, cross-route scope, and 320 px reflow.

Phase 4 is complete and published in `699d457`. Phase 5 was published in `0021c6d`, with consistency hardening in `df434c9`: application commands validate and mutate one authoritative observation set; browser adapters generate secure IDs and persist a strict version-1 envelope; the Observations UI adds editing, deletion, undo, starter reset, status, deterministic sorting, focus recovery, and live feedback. Phase 6 is complete and published in `579b146`: the ledger switches to sortable mobile field cards, editor and reset flows use native modal dialogs, and focused accessibility/browser gates cover the reviewer journey. Phase 7 is complete: application/deployment policy revision `170ee1d` passed the recorded public Vercel reviewer journey; the protected-preview and mobile-coverage boundaries are explicit in the [release evidence](../../docs/verification/release-evidence.md). Phase 8 was published and deployed in `89c0f49`: atomic import/export and raw corrupt/future-version recovery passed focused, production-browser, axe, and 320 px checks.

## Entry points

- `domain/observation.ts` — observation values and pure observation-set counts.
- `domain/scoring-policy.ts` — validated integer prey-weight policy from 0 through 100 in steps of 5.
- `domain/suspicion-report.ts` — pure exact report aggregation, ordering, and decimal half-up display rounding.
- `application/create-observation-set-overview.ts` — read-only view model consumed by the shell.
- `application/create-summary-view-model.ts` — presentation-ready scope, ranking, metrics, contributions, selected-fox evidence, location activity, recent observations, and policy-announcement copy.
- `application/report-scope.ts` — deterministic fox, location, color, and prey filtering plus full-dataset filter options.
- `application/public-worklog.ts` — public checkpoint and evidence values shared across the adapter/UI boundary.
- `application/observation-management.ts` — atomic add/edit/delete/undo/reset behavior and the six-field editor contract.
- `application/dashboard-state-store.ts` — outbound persistence result and state types.
- `application/observation-transfer.ts` — import preview/result, file boundary, and export port types.
- `adapters/browser-dashboard-state/browser-dashboard-state.ts` — strict version-1 local-storage envelope and recovery classification.
- `adapters/json-observation-transfer/json-observation-transfer.ts` — 2 MiB UTF-8 parser, strict Zod preview, deterministic JSON artifact, and browser download adapter.
- `adapters/observation-id/browser-observation-id-generator.ts` — production `obs_<uuid>` generator.
- `adapters/public-worklog/public-worklog.ts` — strict 5-7 checkpoint Zod parser and immutable bundled source.
- `adapters/starter-data/starter-observations.ts` — Zod boundary for the bundled starter JSON.
- `ui/ApplicationShell.tsx` — navigation and destination composition.
- `ui/summary/SummaryPage.tsx` — scope controls, leader outcome, selectable ranking, contribution ledger, evidence strip, synchronized prey-weight controls, locations, and recent observations.
- `ui/observations/ObservationsPage.tsx`, `ObservationEditor.tsx`, and `ObservationImportDialog.tsx` — editable ledger/cards, validated modal forms, import preview, export actions, delete/undo/reset, storage recovery, status, and focus recovery.
- `ui/ai-worklog/WorklogPage.tsx` — semantic public timeline separating AI contribution, human decision, result, verification, and evidence.

## Context links

- [Product contract](../../docs/product-specs/fox-dispatcher.md)
- [Interface contract](../../docs/design-docs/interface.md)
- [Architecture](../../ARCHITECTURE.md)
- [Completed execution plan](../../docs/exec-plans/completed/2026-07-16-fox-dispatcher-implementation.md)

## Verification map

- Adapter tests prove the bundled fixture contains the exact five starter records and four fox identities.
- Scoring tests prove exact starter arithmetic, policy boundaries, half-up rounding, deterministic tie-breaks, and input-order invariance.
- Component tests prove the 80/20 result, immediate preview, one committed live announcement, exact input, and reset behavior.
- Report-scope and component tests prove the North Clearing 3-of-5/2-fox selection, combined filters, explicit fox selection, fallback, zero results, reset behavior, atomic announcements, and deterministic chip-removal focus.
- The repository `npm run verify` entry point collects formatting, lint, tests, typecheck, and production build evidence.
- [Phase 2 verification evidence](../../docs/verification/phase-2-explainable-ranking.md) records the production-preview and 320 px browser results.
- [Phase 3 evidence](../../docs/verification/phase-3-evidence-and-activity.md) records focused tests, the full gate, reproducible production-browser flow, console result, and desktop/mobile visual artifacts.
- Worklog schema/component tests, `check:public-content`, `check:worklog-links`, and `test:e2e:worklog` prove Phase 4 public safety, traceability, navigation, focus, and 320 px reflow.
- [Phase 4 evidence](../../docs/verification/phase-4-ai-worklog-and-readme.md) records the exact acceptance results and limitations.
- `npm run test:run -- manage-observations mutations persistence` proves add/edit validation, immutable IDs, report recalculation, unique-fox updates, undo/dismissal, reset, strict restore, unusual-ID safety, and memory-only failure behavior.
- `test:e2e:manage-observations` proves the exact `obs_005 -> 10 -> fox_004 = 8.0` journey, delete focus recovery, undo, reload, 320 px reflow, and zero browser errors.
- [Phase 5 evidence](../../docs/verification/phase-5-observation-management.md) records Phase 5 acceptance and its original Phase 6 handoff; the mobile-table and dialog work is now closed by the Phase 6 evidence below.
- `npm run test:a11y` scans Summary, desktop/mobile Observations, both dialogs, and AI Worklog against targeted axe WCAG tags; `npm run test:e2e:responsive-keyboard` covers five viewports, keyboard focus, reflow, text spacing, reduced motion, forced colors, and the Chromium accessibility tree.
- [Phase 6 accessibility evidence](../../docs/verification/accessibility-evidence.md) records the exact results and the native-screen-reader environment limitation.
- [Phase 7 release evidence](../../docs/verification/release-evidence.md) records the public URL, tested revision, headers, local-only request boundary, persistence journey, and production screenshots.
- `npm run test:run -- import-export import-recovery recovery` proves the Phase 8 byte/schema boundary, preview/replacement, round-trip export, full-data scope, exact raw storage preservation, focus, and persistence.
- `npm run test:e2e:import-recovery` proves invalid-input atomicity, accepted import reload, real browser download, future-version recovery, four zero-violation axe scans, no external requests, and 320 px reflow. [Phase 8 evidence](../../docs/verification/phase-8-import-export-recovery.md) records the result and screenshots.
