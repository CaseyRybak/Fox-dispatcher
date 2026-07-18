# Audit remediation

## Intent

Close the confirmed behavior, accessibility, browser-runner, release-reporting,
and current-documentation gaps without reducing the codebase or changing the
approved AI Worklog cards and text.

## Acceptance evidence

- Summary filters recalculate the report while Parameters always exposes the
  complete accepted observation ledger, CRUD context, and fox color profiles
  without displaying or controlling Summary-filter state.
- User-facing formulas use `=` everywhere. Rounded display values are explained
  in text; exact fractions remain the internal source for ranking and ties.
- A real hash-route change focuses its `h1`, including a return to the route
  that was active on initial load; initial load itself does not move focus.
- Keyboard range changes preview immediately and produce one stabilized polite
  result announcement without requiring blur or duplicating it on blur.
- Observation ID is a sortable desktop column and a matching mobile sort option.
- A failed preview child or occupied fixed port cannot produce a passing browser
  gate against an unrelated server.
- The existing six AI Worklog cards, their copy, and their link-free UI are
  unchanged. Current documentation reports six cards and does not promise
  evidence links in the rendered timeline.
- Focused tests, `npm run verify`, all local browser gates, accessibility gates,
  dependency audits, and revision-pinned release checks pass.

## Context and domain map

`observation-monitoring` remains the only bounded context. Authoritative
observations and scoring policy stay in `App`; the filtered observation scope is
derived only for Summary. Exact scoring remains in the domain, presentation
formatting in the application/UI, browser startup in `scripts/`, and durable
current product facts in the product/interface/architecture documents.

## Decisions

- Do not reduce production line count, split large modules for size, or change
  the existing dependency architecture in this outcome.
- Keep the current AI Worklog UI, six approved checkpoints, and all checkpoint
  text unchanged. Evidence remains validated repository data, not rendered UI.
- Use `=` for every visible calculation, including values rounded to one decimal.
  State rounding in adjacent prose rather than with `≈`.
- Keep `Параметры` as the destination label and `Наблюдения` as its visible `h1`.
- Treat the product and interface specifications as the current behavior source;
  preserve historical evidence as historical and add a dated follow-up.

## Execution slices

### Slice 1: Full ledger outside report scope

- Files and interfaces: `src/app/App.tsx`, `ObservationsPage.tsx`, Summary and
  management component/browser tests.
- Add regression examples for an active location filter followed by Parameters,
  editing a filtered-out record, and reusing a filtered-out fox color profile.
- Derive a full overview for Parameters and a filtered scope for Summary.
- Verification: focused Summary/management tests and phase 3/5 browser flows.

### Slice 2: Display math and interaction accessibility

- Files and interfaces: `create-summary-view-model.ts`, `SummaryPage.tsx`,
  `App.tsx`, navigation/Summary tests, responsive-keyboard browser flow.
- Require `=` in exact and repeating-fraction formula examples and remove `≈`
  from all user-facing copy/specification assertions.
- Focus every real destination change while exempting initial load.
- Debounce keyboard range commits into one live announcement.
- Verification: focused Summary/navigation tests, axe, responsive-keyboard.

### Slice 3: Observation sort contract

- Files and interfaces: `ObservationsPage.tsx`, management tests and responsive
  browser flow.
- Add `id` to desktop sortable headers and mobile sort options with correct
  `aria-sort` and stable ID tie-break behavior.
- Verification: focused management tests and responsive browser gate.

### Slice 4: Browser and release evidence integrity

- Files and interfaces: `run-phase-1-browser-smoke.mjs`, runner regression test,
  `phase-7-release-smoke.js`.
- Allocate an owned available port, bind readiness to the spawned preview child,
  fail if that child exits, and terminate only the owned process.
- Return the measured Worklog checkpoint count instead of a literal seven.
- Verification: runner regression, all local browser programs, revision-pinned
  release smoke.

### Slice 5: Current documentation reconciliation

- Files and interfaces: README, product/interface specifications, architecture,
  repository/domain maps, Decision 0003, and a new dated verification follow-up.
- Document full-ledger behavior, `=` display convention, six link-free rendered
  Worklog cards, current axe scan count, current deployment revision/integration,
  and the location of source observations.
- Do not rewrite historical phase evidence as if it were produced by this change.
- Verification: formatting, public-content, Worklog-link, deployment, and link
  checks through `npm run verify`.

## Integration evidence

Run focused tests after each slice, then `npm run verify`, every repository
browser gate, both dependency audits, desktop/mobile visual inspection, and the
revision-pinned production check after publication. Record exact commands,
results, screenshots, remaining native-screen-reader limitation, and revision in
a dated verification follow-up.

## Resulting repository artifacts

- corrected full-ledger/report-scope behavior and regression evidence;
- consistent `=` formula presentation with exact internal ranking preserved;
- route-focus, live-announcement, and observation-sort corrections;
- browser runner and release-count integrity fixes;
- reconciled current documentation with unchanged AI Worklog UI and copy;
- completed plan and dated verification evidence.

## Completion

Completed locally on 2026-07-18. All implementation slices and local
verification gates passed. Exact results and the external publication boundary
are recorded in
[the dated remediation evidence](../../verification/2026-07-18-audit-remediation.md).
