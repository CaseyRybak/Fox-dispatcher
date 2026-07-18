# Current implementation documentation audit

> Historical snapshot. The current post-audit behavior and fresh verification
> are recorded in
> [2026-07-18 audit remediation](2026-07-18-audit-remediation.md).

Date: 2026-07-17

Scope: current `main` implementation after Phase 8 and the post-release Summary, identity, color, terminology, and observation-management refinements.

## Audit boundary

The audit compares the current application source and executable tests with the documents that describe present behavior:

- `README.md`;
- root and bounded-context `AGENTS.md` maps;
- `ARCHITECTURE.md`;
- the product and interface specifications;
- Decisions 0001-0003.

Completed execution plans and dated phase evidence remain historical records. They can describe a screen, ID strategy, or release revision that was true in that phase and later superseded. They are not silently rewritten as current product documentation.

## Reconciled findings

| Area | Implementation source | Documentation result |
|---|---|---|
| Summary composition | `SummaryPage.tsx` shows leader/co-leaders, unique foxes, leading location, calculation, filters, ranking, and weight controls | Removed the obsolete promise of visible location-activity and recent-observation blocks; architecture still records those values as internal view-model data |
| Scoring explanation | Exact rational values drive comparison; the UI displays decimal tenths and marks repeating values as rounded | README, product contract, interface specification, and Decision 0001 now distinguish exact comparison from decimal presentation |
| Scope labels | Summary says `Показано лис: X из Y`; the full Parameters ledger says `Всего наблюдений: X` | Product and interface specifications now describe both labels, their different units, and the ledger's full-data scope |
| Terminology | Ranking and table use `подозрительность`; the editor keeps the explicit label `Оценка подозрительности` | Removed stale current-screen references to a generic `Оценка` column or ranking value |
| Destination naming | Navigation and title use `Параметры`; the page `h1` is `Наблюдения` | Product, interface, architecture, and README now document the distinction explicitly |
| Fox identity | Manual input accepts a name, reuses an existing identity, or allocates the first free `fox_NNN`; observations use the first free `obs_NNN` | Current product, architecture, repository map, and README describe name-based identity and deterministic allocation |
| Fox color | Existing foxes keep the color of their first active observation and receive a non-blocking notice | Current product, architecture, repository map, and README describe one-color-per-fox enforcement |
| Import and recovery | Phase 8 import/export and corrupt/future storage recovery are implemented | Decision 0002 no longer presents the shipped behavior as optional future work |
| README image | Production build opened at 1440 px with starter state | README now embeds `output/playwright/readme/summary-1440px.png` instead of the Phase 3 screenshot |

## Browser evidence

The current production build was opened in a fresh headless Chromium context at `1440 × 1000`. The Summary heading loaded, the document title was `Сводка - Лисий диспетчер`, the full page measured 2339 px high, and the browser emitted no console or page errors.

Artifact: [current README Summary screenshot](../../output/playwright/readme/summary-1440px.png)

## Verification

Commands use the repository-pinned Node `24.17.0` and npm `11.13.0`:

```bash
npm run build
npm run verify
```

The final command is the shared gate for formatting, lint, architecture boundaries, public content, Worklog links, tests, TypeScript, production build, and deployment policy.

Fresh result on the audited worktree:

- `npm run verify` — passed;
- Vitest — 16 files passed, 118 tests passed;
- production browser capture — Summary loaded with zero console and page errors.
