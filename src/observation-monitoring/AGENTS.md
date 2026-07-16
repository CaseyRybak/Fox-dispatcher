# Observation Monitoring domain map

`observation-monitoring` is the single Fox Dispatcher bounded context. It turns validated observation records into an exact, explainable suspicion report and user-facing observation summaries.

## Current slice

Phase 3 is published on `main` in `9834af5`; its consistency hardening was published concurrently during the final audit in `1b2bb24`, with final focus and runner-guard corrections still in the working tree. One report scope connects filters, ranking, selected-fox evidence, location activity, recent observations, and the read-only observation ledger. Production-browser evidence covers keyboard selection, policy recalculation, every filter type, combined scope, deterministic chip focus, the zero state, cross-route scope, and 320 px reflow.

Phase 4 is complete and does not change domain calculations. Six structured public-safe checkpoints flow from a Zod adapter through the composition root to the Worklog timeline; the reviewer README and repository checks explain and protect the public artifact. Phase 5 is the next pending slice and owns proportionate observation mutation, undo, starter reset, and simple persistence. Phase 6 closes targeted responsive/accessibility evidence, Phase 7 deploys the MOX submission, and Phase 8 import/export plus advanced recovery are optional stretch work.

## Entry points

- `domain/observation.ts` — observation values and pure observation-set counts.
- `domain/scoring-policy.ts` — validated integer prey-weight policy from 0 through 100 in steps of 5.
- `domain/suspicion-report.ts` — pure exact report aggregation, ordering, and decimal half-up display rounding.
- `application/create-observation-set-overview.ts` — read-only view model consumed by the shell.
- `application/create-summary-view-model.ts` — presentation-ready scope, ranking, metrics, contributions, selected-fox evidence, location activity, recent observations, and policy-announcement copy.
- `application/report-scope.ts` — deterministic fox, location, color, and prey filtering plus full-dataset filter options.
- `application/public-worklog.ts` — public checkpoint and evidence values shared across the adapter/UI boundary.
- `adapters/public-worklog/public-worklog.ts` — strict 5-7 checkpoint Zod parser and immutable bundled source.
- `adapters/starter-data/starter-observations.ts` — Zod boundary for the bundled assignment JSON.
- `ui/ApplicationShell.tsx` — navigation and destination composition.
- `ui/summary/SummaryPage.tsx` — scope controls, leader outcome, selectable ranking, contribution ledger, evidence strip, synchronized prey-weight controls, locations, and recent observations.
- `ui/observations/ObservationsPage.tsx` — read-only table projected from the same active report scope.
- `ui/ai-worklog/WorklogPage.tsx` — semantic public timeline separating AI contribution, human decision, result, verification, and evidence.

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
- Worklog schema/component tests, `check:public-content`, `check:worklog-links`, and `test:e2e:worklog` prove Phase 4 public safety, traceability, navigation, focus, and 320 px reflow.
- [Phase 4 evidence](../../docs/verification/phase-4-ai-worklog-and-readme.md) records the exact acceptance results and limitations.
