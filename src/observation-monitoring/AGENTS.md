# Observation Monitoring domain map

`observation-monitoring` is the single Fox Dispatcher bounded context. It turns validated observation records into an exact, explainable suspicion report and user-facing observation summaries.

## Current slice

Phase 3 is complete in the working tree. One report scope now connects filters, ranking, selected-fox evidence, location activity, recent observations, and the read-only observation ledger. Production-browser evidence covers keyboard selection, policy recalculation, every filter type, combined scope, deterministic chip focus, the zero state, cross-route scope, and 320 px reflow. Mutation, persistence, import, recovery, and final mobile sheets remain future slices.

## Entry points

- `domain/observation.ts` — observation values and pure observation-set counts.
- `domain/scoring-policy.ts` — validated integer prey-weight policy from 0 through 100 in steps of 5.
- `domain/suspicion-report.ts` — pure exact report aggregation, ordering, and decimal half-up display rounding.
- `application/create-observation-set-overview.ts` — read-only view model consumed by the shell.
- `application/create-summary-view-model.ts` — presentation-ready scope, ranking, metrics, contributions, selected-fox evidence, location activity, recent observations, and policy-announcement copy.
- `application/report-scope.ts` — deterministic fox, location, color, and prey filtering plus full-dataset filter options.
- `adapters/starter-data/starter-observations.ts` — Zod boundary for the bundled assignment JSON.
- `ui/ApplicationShell.tsx` — navigation and destination composition.
- `ui/summary/SummaryPage.tsx` — scope controls, leader outcome, selectable ranking, contribution ledger, evidence strip, synchronized prey-weight controls, locations, and recent observations.
- `ui/observations/ObservationsPage.tsx` — read-only table projected from the same active report scope.
- `ui/ai-worklog/WorklogPage.tsx` — public Worklog destination shell.

## Context links

- [Product contract](../../docs/product-specs/fox-dispatcher.md)
- [Interface contract](../../docs/design-docs/interface.md)
- [Architecture](../../ARCHITECTURE.md)
- [Active execution plan](../../docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md)

## Verification map

- Adapter tests prove the bundled fixture contains the exact five assignment records and four fox identities.
- Scoring tests prove exact starter arithmetic, policy boundaries, half-up rounding, deterministic tie-breaks, and input-order invariance.
- Component tests prove the 80/20 result, immediate preview, one committed live announcement, exact input, and reset behavior.
- Report-scope and component tests prove the North Clearing 3-of-5/2-fox selection, combined filters, explicit fox selection, fallback, zero results, reset behavior, atomic announcements, and deterministic chip-removal focus.
- The repository `npm run verify` entry point collects formatting, lint, tests, typecheck, and production build evidence.
- [Phase 2 verification evidence](../../docs/verification/phase-2-explainable-ranking.md) records the production-preview and 320 px browser results.
- [Phase 3 evidence](../../docs/verification/phase-3-evidence-and-activity.md) records focused tests, the full gate, reproducible production-browser flow, console result, and desktop/mobile visual artifacts.
