# Observation Monitoring domain map

`observation-monitoring` is the single Fox Dispatcher bounded context. It turns validated observation records into an exact, explainable suspicion report and user-facing observation summaries.

## Current slice

Phase 2 provides exact fraction scoring, deterministic tie-breaks, report aggregation, the Summary view model, and a responsive interactive ranking. The default 80/20 policy produces `fox_001` at 7.8; a committed 70/30 policy produces `fox_003` at 7.9. Mutation, persistence, filtering, import, and recovery arrive in their planned slices.

## Entry points

- `domain/observation.ts` — observation values and pure observation-set counts.
- `domain/scoring-policy.ts` — validated integer prey-weight policy from 0 through 100 in steps of 5.
- `domain/suspicion-report.ts` — pure exact report aggregation, ordering, and decimal half-up display rounding.
- `application/create-observation-set-overview.ts` — read-only view model consumed by the shell.
- `application/create-summary-view-model.ts` — presentation-ready ranking, metrics, contributions, and live-announcement copy.
- `adapters/starter-data/starter-observations.ts` — Zod boundary for the bundled assignment JSON.
- `ui/ApplicationShell.tsx` — navigation and destination composition.
- `ui/summary/SummaryPage.tsx` — leader outcome, ranked rows, contribution ledger, and synchronized prey-weight controls.
- `ui/observations/ObservationsPage.tsx` — read-only observation table.
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
- The repository `npm run verify` entry point collects formatting, lint, tests, typecheck, and production build evidence.
- [Phase 2 verification evidence](../../docs/verification/phase-2-explainable-ranking.md) records the production-preview and 320 px browser results.
