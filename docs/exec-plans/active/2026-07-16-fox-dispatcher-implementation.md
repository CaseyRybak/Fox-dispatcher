# Fox Dispatcher: implementation outcome

Status: Phase 2 completed and verified in the working tree

Deployment target: Vercel

Current gate: Phase 3 waits for a direct command; Phase 1 and Phase 2 changes remain uncommitted and unpushed

Authority boundary: phases, commits, and pushes wait for separate direct user commands

## Intent

Build a small, polished, interactive "Fox Dispatcher" web application for the MOX AI-first Developer test assignment. A forest observer can inspect the current observation set, understand where activity is concentrated, see which fox leads the explainable suspicion ranking, change data or the scoring policy, and immediately see the report recalculate.

The product demonstrates four things together:

- a usable interactive interface rather than a static dashboard;
- deterministic and explainable data logic based only on fields in the assignment;
- an agent-first repository whose intent, decisions, plans, evidence, and worklog remain discoverable outside chat;
- a public Vercel deployment that a reviewer can open without local setup.

The primary reviewer journey should take less than one minute:

1. Open the application and see 5 observations, 4 unique foxes, the leading location, and the ranking leader.
2. Select `fox_001` and inspect the exact arithmetic behind its score.
3. Change prey influence from 20% to 30% and see `fox_003` become the leader.
4. Edit or add an observation and see every affected report section update.
5. Open the in-product AI Worklog and inspect real development checkpoints with evidence.

## Acceptance evidence

### Product contract

| ID | Acceptance statement | Required evidence |
|---|---|---|
| P-01 | The public product is interactive and usable without setup | A Vercel production URL completes the primary reviewer journey |
| D-01 | The first run contains exactly the 5 assignment observations | UI count, fixture test, and browser screenshot agree |
| D-02 | Observations can be added, edited, and removed | Browser flow demonstrates immediate report recalculation |
| D-03 | User state persists locally | Reload restores observations and scoring policy |
| D-04 | JSON import is atomic | Invalid import identifies the field and leaves current state unchanged |
| D-05 | Calculation and report ordering are deterministic | Exact rational tests cover `7.45 -> 7.5`, mathematical ties, equal times, tied locations, Unicode IDs, and input permutations |
| D-06 | Untrusted import and storage fail safely | Oversized raw input is rejected before parsing; corrupt or future-version storage stays recoverable and is not overwritten automatically |
| F-01 | The interface answers how many foxes were observed | Starter result is 4; CRUD updates the count |
| F-02 | The interface identifies the main activity location | Starter result is `Северная поляна`, 3 of 5 observations, 60% |
| F-03 | The interface names the exact scoring inputs | Only `suspicion_level` and `has_prey` contribute to the score |
| F-04 | The interface identifies and explains the ranking leader | Starter leader is `fox_001`, score 7.8, with visible contributions |
| F-05 | Changing a parameter changes the report | At 30% prey influence, `fox_003` leads with 7.9 |
| I-01 | Filters have a visible calculation scope | The report states `N из M наблюдений` and recalculates from that selection |
| I-02 | Result, ranking, locations, evidence, and raw observations form one path | Selecting a ranking row updates its evidence inspector without losing context |
| I-03 | Selection and focus survive dynamic updates predictably | Selected fox fallback, chip removal, dialogs, route changes, and persistent undo have browser focus/status assertions |
| W-01 | AI Worklog is available inside the product | Main navigation opens 5-7 real, public-safe checkpoints |
| W-02 | Worklog claims are traceable | Checkpoints link to a plan, decision, commit, test, or screenshot |
| A-01 | Domain logic is independent of React and storage | Import-boundary checks and unit tests enforce dependency direction |
| A-02 | The production browser boundary prevents observation egress | Tested CSP uses `connect-src 'none'`; deployed headers and browser requests match the allowlist |
| Q-01 | Completion claims have fresh evidence | Typecheck, lint, tests, build, accessibility, browser, and deployed smoke evidence are recorded |
| Q-02 | WCAG-facing manual claims are recorded | Keyboard, 320 px reflow, 200% zoom, text spacing, contrast preferences, and one screen-reader pass have a dated evidence artifact |

### Deterministic starter examples

With default weights `suspicion_level = 80%` and `has_prey = 20%`:

| Fox | Mean suspicion | Prey observations | Suspicion contribution | Prey contribution | Score |
|---|---:|---:|---:|---:|---:|
| `fox_001` | 8.5 | 1 of 2 | 6.8 | 1.0 | **7.8** |
| `fox_003` | 7.0 | 1 of 1 | 5.6 | 2.0 | **7.6** |
| `fox_002` | 5.0 | 0 of 1 | 4.0 | 0.0 | **4.0** |
| `fox_004` | 3.0 | 0 of 1 | 2.4 | 0.0 | **2.4** |

At 30% prey influence:

- `fox_003 = 7.90`;
- `fox_001 = 7.45`, displayed as 7.5;
- the report leader changes to `fox_003`.

If `obs_005.suspicion_level` changes from 3 to 10 under the default 80/20 policy, `fox_004` scores 8.0 and becomes the leader.

## Context and domain map

### Current repository state

Phase 0 materialized the repository map, product specification, interface specification, architecture, and three accepted decision records. The original Phase 0 documentation was committed and published at `cbaf165bda86ab629b30ed19f226d81af14ed35e` on `main`. Phase 1 adds the verified package/toolchain, bounded-context source tree, validated assignment fixture, responsive application shell, import-boundary enforcement, tests, CI, and browser evidence. Phase 2 adds exact scoring and ordering, an application Summary query, the leader/ranking/contribution interface, synchronized policy controls, and production-preview evidence. Phase 1 and Phase 2 remain uncommitted and unpushed. External Vercel project configuration remains a later outcome.

Relevant existing context:

- `docs/research/skills-audit.md` describes the audited planning, design, accessibility, React, review, and browser skills available to repository agents.
- `docs/legal/third-party-skills.md` records the provenance of installed third-party and adapted skills.
- `AGENTS.md` maps the durable product, design, architecture, decisions, and active plan.
- `ARCHITECTURE.md` maps the planned bounded context and verification layers.
- `docs/product-specs/fox-dispatcher.md` is the canonical product and scoring contract.
- `docs/design-docs/interface.md` is the canonical interface and accessibility contract.
- This active plan is the execution handoff and phase-status record.

### Planned bounded context

Use one bounded context: `observation-monitoring`.

```text
src/
├── app/                              composition, navigation, error boundary
├── observation-monitoring/
│   ├── domain/                       observations, scoring policy, report analytics
│   ├── application/                  commands, queries, reducer, outbound ports
│   ├── adapters/                     starter data, JSON boundary, local persistence
│   └── ui/                           overview, observations, AI Worklog
└── shared/
    └── ui/                           small reusable presentation primitives
```

Dependency direction:

```text
UI and adapters -> application -> domain
```

The domain consumes plain typed values and produces deterministic report values. It does not consume React, browser APIs, local storage, or UI components. Adapters parse untrusted shapes before passing them inward. React receives small view models rather than reproducing scoring calculations in components.

### Planned repository knowledge map

```text
AGENTS.md                              short repository map
ARCHITECTURE.md                        domain and dependency map
docs/
├── product-specs/fox-dispatcher.md    durable product and data contract
├── design-docs/interface.md           responsive UI and interaction specification
├── decisions/                         scoring, local-first, deployment decisions
├── exec-plans/active/                 executable work in progress
├── exec-plans/completed/              finished plans with evidence
├── ai-worklog/                        public structured checkpoints
└── verification/                      reproducible release evidence
```

Root and domain `AGENTS.md` files serve as concise maps to entry points and durable artifacts. Mechanical dependency checks and tests carry architecture invariants. Repository skills capture only demonstrated repeatable procedures; product intent, open work, and decisions remain in specifications and plans.

## Decisions

### 1. Scoring uses only explicit assignment fields

For fox `f` in the active observation selection:

```text
meanSuspicion(f) = mean(observation.suspicion_level)
preyRate(f)      = observations with has_prey=true / observations of f
preySignal(f)    = preyRate(f) * 10

score(f) =
  meanSuspicion(f) * (1 - preyWeight)
  + preySignal(f) * preyWeight
```

`preyWeightPercent` is one user-controlled integer value from 0 to 100, step 5, default 20. The formula uses `preyWeight = preyWeightPercent / 100`; the remaining weight belongs to `suspicion_level` automatically.

The score is an attention index, not a probability or a claim that the fox is dangerous. The interface explains that treating prey as a signal is a configurable observer policy. A 0% value produces the literal `suspicion_level`-only ranking.

Field semantics:

- `suspicion_level` and `has_prey` affect the score;
- `fox_id` groups records;
- `location` and `color` support description and filtering;
- `time` supports chronology and tie-breaking;
- observation count communicates evidence volume and never adds risk.

Sorting uses the unrounded score, then mean suspicion, latest observation time, and `fox_id`. The UI displays one decimal place.

Implementation stores weight as an integer percent and represents a score as the exact fraction:

```text
[sumSuspicion * (100 - weightPercent) + preyCount * 10 * weightPercent]
-----------------------------------------------------------------------
                       observationCount * 100
```

Score and mean ties use safe-integer cross multiplication; display uses decimal half-up rounding, so exact `7.45` renders as `7.5`. Equal-time observations use `id` ascending, and all final string tie-breaks use locale-independent UTF-16 ordinal order. Location rows use count descending then name ascending.

### 2. "Current" means the active data selection

The input includes time but no date. Copy uses `текущая выборка` and avoids unsupported claims about today, recency, or live forest state. Time does not receive a hidden risk weight.

### 3. Filters define the whole report scope

Search by `fox_id` and filters for location, color, and prey update metrics, ranking, location activity, evidence, and raw observations together. A persistent scope label states `Отчёт по N из M наблюдений`. Removable filter chips and `Сбросить всё` make the scope explicit.

The inspector selects the leader initially, preserves an explicit user selection while that fox remains in scope, and falls back to the current leader or an empty inspector when mutations or filters remove it. Automatic fallback announces status without moving focus.

### 4. Interface direction is a modern field ledger

The chosen design combines an observer's field journal with a restrained operations console:

- light mist canvas, paper-like surfaces, dark pine text, fox-orange result accent, survey-blue selection accent;
- one dominant leader result instead of a grid of equal KPI cards;
- a ranking connected to an evidence inspector;
- horizontal location bars with exact values;
- a signature evidence strip that places real observation markers by time and suspicion level without implying a geographic route;
- Onest for interface text, a restrained Unbounded accent for the product name, and tabular or monospace treatment for IDs and formulas;
- small radii, fine borders, limited shadows, functional motion, and reduced-motion support.

A geographic map is excluded because the data has location names but no coordinates. A dark security dashboard and a cartoon forest treatment are excluded because they weaken task clarity.

### 5. Information architecture has three destinations

`Сводка` contains:

- report scope and global filters;
- leader statement and exact reason;
- 4 unique foxes, 5 observations, leading location, latest observation;
- ranked fox list;
- selected fox calculation and evidence strip;
- prey influence control;
- location activity bars;
- recent observations.

`Наблюдения` contains:

- semantic desktop table and mobile observation cards;
- add, edit, delete, and undo flows;
- search and shared filters;
- JSON import, full-data export, and starter-data recovery.

`AI Worklog` contains 5-7 real checkpoints. Each checkpoint records the problem, AI contribution, human decision, resulting change, and verification evidence. A testing problem is included only after one is actually found.

### 6. Data management is local-first and atomic

Starter data is bundled with the application. A versioned local storage envelope holds observations, prey weight, and update time. JSON import follows parse -> validate -> preview -> confirm replacement. An invalid record leaves current state untouched. Export includes the full observation array, independent of filters.

Boundary validation covers a 2 MiB UTF-8 pre-parse limit, unique non-empty IDs, trimmed strings, strict booleans, integer suspicion from 0 through 10, real `HH:mm` time, bounded collection size, and a documented policy for unknown fields. The strict v1 storage envelope distinguishes missing, valid, corrupt, unsupported-version, and unavailable states. Corrupt or future-version raw values are not overwritten before an explicit recovery choice; save failure keeps accepted state in memory.

### 7. Stack and deployment

| Concern | Decision |
|---|---|
| Application | React, TypeScript, Vite |
| State | `useReducer` plus focused selectors; no external state library initially |
| Validation | Zod at JSON and persistence boundaries |
| Styling | CSS Modules and global design tokens |
| Visualisation | Semantic HTML, CSS, and small inspectable SVG; no chart library |
| Persistence | Versioned browser local storage |
| Unit and integration tests | Vitest and React Testing Library |
| Browser and accessibility tests | Playwright and axe |
| Static quality | TypeScript strict, ESLint, Prettier |
| CI | GitHub Actions |
| Deployment | **Vercel**, connected to the GitHub repository |

Vercel should use `npm ci` with repository-pinned Node/npm versions, run the repository build command, publish `dist`, provide a preview for the release-candidate SHA, and publish production from `main` only after explicit authorization. Vite is statically deployable; Phase 8 adds and tests the response-header configuration required by the CSP and privacy boundary. The initial navigation can use hashes, avoiding an unnecessary SPA fallback.

Production has no backend, runtime AI API, analytics, or remote font dependency. User observations remain in the browser.

### 8. Accessibility and responsive contract

The main journey works at 320 CSS pixels, 200% zoom, and by keyboard. The Russian document title, current hash destination, `h1`, focus, and back/forward behavior remain synchronized. Desktop ranking becomes mobile cards; the desktop detail inspector becomes a full-screen mobile sheet; filters become a mobile sheet with draft/apply/cancel behavior; the page does not acquire horizontal overflow.

Controls have visible labels and focus, dialogs manage and restore focus, sorted headers expose their state, validation errors connect to fields through a focused summary, every completed score change receives one concise polite announcement, undo has no automatic timeout, charts retain exact text alternatives, and color never carries meaning alone. Motion respects reduced-motion preferences.

### 9. Git and agent execution model

The implementation is divided into short independently verifiable slices. A slice can use an isolated worktree and focused agent context when execution is authorized. Review packages contain the changed scope and evidence rather than unrelated repository content. `main` remains releasable, and Vercel preview deployment becomes part of review after Git integration is configured.

Preparing the original plan did not itself authorize Git mutation. Phase 0 was subsequently recorded and published in the separately created commit `cbaf165bda86ab629b30ed19f226d81af14ed35e`; that historical fact does not authorize future commits or pushes. Further branch publication and Vercel deployment occur only in their authorized execution slices.

## Execution slices

Phases 0, 1, and 2 are complete. Phase 2 reconciled the scoring work with the approved contract, corrected the composition dependency, and passed the focused, full, and production-browser gates on 2026-07-16. Phases 3 through 8 remain pending and start only after a direct user command.

### Phase 0: Materialize the approved contract

Status: completed on 2026-07-16

Target outcome: another agent can understand the assignment, product policy, interface, architecture, and evidence requirements without chat history.

Files and interfaces:

- `AGENTS.md`: repository map and current plan entry point;
- `ARCHITECTURE.md`: bounded context, layers, and dependency direction;
- `docs/product-specs/fox-dispatcher.md`: field semantics, formula, states, and acceptance examples;
- `docs/design-docs/interface.md`: layout, responsive behavior, content hierarchy, tokens, interactions, and accessibility;
- `docs/decisions/0001-explainable-scoring.md`;
- `docs/decisions/0002-local-first-static-app.md`;
- `docs/decisions/0003-vercel-deployment.md`;
- this plan updated with Phase 0 decision notes.

Implementation steps:

1. Transfer the assignment facts and approved product decisions into durable documents without inventing new signals.
2. Record the formula and starter calculations as test-ready deterministic acceptance examples.
3. Record the chosen field-ledger UI and the rejected map-first alternative.
4. Record Vercel as the deployment target and Git integration as the release mechanism.
5. Cross-link the product, design, architecture, decisions, and active plan from the repository map.

Verification commands and expected evidence:

- `git diff --check` returns clean.
- focused `rg` checks independently find `fox_001` 7.8, `fox_003` 7.9, `Северная поляна` 3/5 and 60%, and Vercel in their canonical product/decision documents rather than matching this plan alone;
- local Markdown links resolve to existing paths;
- [Phase 0 contract audit](../../verification/phase-0-contract-audit.md) maps each normalized assignment-facing requirement to acceptance IDs and canonical artifacts, records the external-source boundary, and captures command results.

Estimated effort: 2-3 hours.

First checkpoint: exact formula, starter results, interface sections, and Vercel target are cross-linked and internally consistent.

Completion notes:

- `AGENTS.md` now provides the short repository and domain map.
- `ARCHITECTURE.md` records one `observation-monitoring` bounded context, the planned layers, ports, data flow, deployment topology, and verification layers.
- [Product specification](../../product-specs/fox-dispatcher.md) records the exact starter JSON, field semantics, scoring formula, filters, CRUD, import/export, persistence, states, AI Worklog, and acceptance scenarios.
- [Interface specification](../../design-docs/interface.md) records the field-ledger direction, exact information hierarchy, signature evidence strip, responsive behavior, copy, controls, states, and WCAG 2.2 AA verification matrix.
- [Decision 0001](../../decisions/0001-explainable-scoring.md) accepts the explainable 80/20 scoring policy and rejects unsupported repeat, location, color, and recency bonuses.
- [Decision 0002](../../decisions/0002-local-first-static-app.md) accepts the browser-only versioned persistence and atomic import boundary.
- [Decision 0003](../../decisions/0003-vercel-deployment.md) accepts Vercel Git integration, `dist` output, preview review, and production evidence.
- Boundary details resolved in Phase 0: unknown import fields are contract errors, filters start cleared in a new session, dataset reset and scoring reset are separate, and initial top-level destinations use hash addressing.
- The follow-up consistency audit resolved exact decimal arithmetic, equal-time/location order, selected-fox fallback, import size, storage version recovery, dependency wiring, focus/undo behavior, and the production header/release policy.
- Phase 0 itself produced documentation only. The original contract is present in published commit `cbaf165bda86ab629b30ed19f226d81af14ed35e`. Concurrent uncommitted Phase 1 scaffold/dependency/test files appeared during this audit and remain outside its reviewed change set; the Vercel connection is still untouched. This audit performs no commit or push.

### Phase 1: Deliver the walking skeleton

Status: completed and consistency-audited on 2026-07-16; no commit or push performed

Target outcome: the application boots locally and renders the unmodified starter dataset through the defined boundaries.

Files and interfaces:

- package and toolchain files, locked Node version, dependency lock;
- `src/app/` composition shell;
- `src/observation-monitoring/domain/observation.ts` data types;
- starter data adapter and boundary schema;
- initial navigation and responsive layout shell;
- CI workflow running the repository verification command.

Implementation steps:

1. Scaffold React, TypeScript, and Vite with pinned dependencies.
2. Establish aliases and `check:boundaries` from the architecture allow/deny matrix, including a fixture that proves a forbidden import fails.
3. Add the exact five starter observations as a validated adapter fixture.
4. Create accessible navigation for Summary, Observations, and AI Worklog.
5. Add `npm run verify` for format check, lint, typecheck, tests, and production build.

Verification commands:

- `npm run test -- navigation` checks the three links, `lang`, title, `aria-current`, destination `h1` focus, and back/forward behavior;
- `npm run check:boundaries` passes the allowed graph and its negative fixture;
- `npm run verify` runs the full Phase 1 gate.

Expected evidence: production build succeeds, a component test sees exactly 5 starter records and 4 unique fox IDs, navigation assertions pass, and the positive/negative boundary fixtures prove dependency enforcement.

Estimated effort: 2-3 hours.

Completion notes:

- Node `24.17.0`, npm `11.13.0`, exact application dependencies, and `package-lock.json` define the reproducible toolchain; Vercel-compatible `24.x`/`11.x` engines are explicit.
- The Zod starter adapter rejects malformed data before the application receives it; tests prove the exact five assignment records and four unique fox IDs.
- The responsive field-ledger shell exposes Summary, Observations, and AI Worklog through hash links. Route changes synchronize Russian document language, destination title, `aria-current`, focusable `h1`, and browser history.
- ESLint restrictions cover domain, application, adapter, UI, app-composition, browser-global, persistence, and shared directions. `npm run check:boundaries` checks production source, one allowed fixture, and thirteen forbidden fixtures.
- GitHub Actions uses the pinned Node version, `npm ci`, and the same `npm run verify` gate used locally.
- [Phase 1 verification evidence](../../verification/phase-1-walking-skeleton.md) records the final commands and desktop/mobile browser artifacts. Phase 2 behavior was not introduced in that reviewed snapshot.
- The follow-up [Phase 1 consistency audit](../../verification/phase-1-consistency-audit.md) fixed the skip-link/hash collision, expanded the boundary matrix to one allowed and thirteen forbidden fixtures, corrected muted-text contrast, and bundled runtime license notices.
- During that audit, later-slice scoring files appeared outside the Phase 1 review scope. The subsequently authorized Phase 2 reconciled and verified that work; the Phase 1 screenshots remain historical evidence for the walking skeleton.

### Phase 2: Make the explainable ranking interactive

Status: completed on 2026-07-16; no commit or push performed

Target outcome: the Summary screen identifies the correct leader, explains the arithmetic, and changes leader when prey influence changes.

Files and interfaces:

- pure domain scoring and aggregation functions;
- scoring policy value and deterministic ranking result;
- application query/view model for Summary;
- leader panel, ranking, contribution breakdown, and prey-weight control;
- unit and component tests for starter examples and edge cases.

Implementation steps:

1. Write focused tests for 80/20, exact `7.45 -> 7.5`, 70/30, 0/100, 100/0, empty input, one observation, mathematical fractional ties, equal times, Unicode IDs, tied locations, and input order invariance.
2. Implement exact fraction comparison and pure report calculation until the tests pass; floating display values never determine ordering.
3. Render the dominant leader result and ranked rows.
4. Render exact contribution values and scoring-policy explanation.
5. Add the live prey-weight control, reset to 20%, and concise score-change announcement.

Verification commands:

- `npm run test -- scoring` confirms exact domain examples.
- `npm run test -- summary` confirms `fox_001` at 20%, `fox_003` at 30%, and one final polite status for both leader-changing and leader-preserving weight changes.
- `npm run verify` remains clean.

Estimated effort: 3-4 hours.

Completion notes:

- `scoring-policy.ts` validates the integer 0-100 policy in steps of 5; `suspicion-report.ts` calculates exact fractions and compares them by cross multiplication before any display rounding.
- Eleven focused domain tests cover the exact 80/20 and 70/30 examples, `7.45 -> 7.5`, literal 0% and 100% boundaries, empty and singleton inputs, mathematical ties, equal times, Unicode IDs, tied locations, input permutations, and invalid policy values.
- The application view model exposes Russian display values and concise leader-changing or leader-preserving announcements without moving formula logic into React.
- The Summary route now presents one dominant leader, four report metrics, a semantic ranked list, an exact two-part contribution ledger, synchronized range/number controls, and a 20% reset.
- Component tests cover the default report, immediate preview, one committed polite announcement, leader-preserving exact input, and reset behavior.
- The production preview completed the 20% -> 30% reviewer flow: `fox_001` 7.8 changed to `fox_003` 7.9, with exact 4.9 + 3.0 contributions and one live status. The console reported 0 errors and 0 warnings.
- At 320 px the document and body widths both equal the 320 px viewport; the leader, metrics, ranking, calculation, and controls remain semantically present without horizontal overflow.
- [Phase 2 verification evidence](../../verification/phase-2-explainable-ranking.md) records commands, interaction results, scope, and screenshots. Phase 3 behavior was not introduced.

### Phase 3: Connect ranking to evidence and activity

Status: pending

Target outcome: a reviewer can move from the leader to raw evidence and understand where observations are concentrated.

Files and interfaces:

- selected-fox state and focused view model;
- evidence strip and observation list;
- location aggregation and semantic bars;
- global filter state, chips, reset, and calculation-scope label;
- responsive ranking cards and mobile inspector.

Implementation steps:

1. Make ranking rows keyboard-selectable and preserve the Summary context.
2. Render the contribution explanation and all source observations for the selected fox.
3. Render time-based evidence markers without drawing a movement path.
4. Render location activity with counts, percentages, and explicit metric definition.
5. Apply fox search, location, color, and prey filters to the whole report.
6. Show `Отчёт по N из M наблюдений` and recover cleanly from a zero-result selection.
7. Preserve explicit fox selection while it remains in scope; otherwise fall back without moving focus and announce the new inspector state.

Verification commands:

- `npm run test -- report-scope` checks North Clearing produces 3 observations and 2 foxes.
- `npm run test:e2e -- summary-evidence` checks selection, filters, reset, and keyboard operation.
- `npm run verify` remains clean.

Estimated effort: 3-4 hours.

### Phase 4: Add observation management and persistence

Status: pending

Target outcome: add, edit, delete, undo, and reload update the whole report predictably.

Files and interfaces:

- application commands for observation mutations;
- accessible observation editor;
- desktop table and mobile cards;
- versioned persistence port and local storage adapter;
- delete undo and starter-data reset behavior.

Implementation steps:

1. Add observation validation shared by manual input and import boundaries.
2. Implement add with generated immutable ID.
3. Implement edit with atomic save and unsaved-change handling.
4. Implement delete with persistent-until-dismissed-or-next-mutation undo and correct unique-fox recalculation.
5. Persist observations and scoring policy in the strict v1 envelope.
6. Add distinct recovery paths for corrupt, unsupported-version, unavailable, and save-failure storage without overwriting recoverable raw data.

Verification commands:

- `npm run test -- mutations persistence` checks add, edit, delete, undo, reload, and recovery.
- `npm run test:e2e -- manage-observations` demonstrates add, edit (`obs_005 = 10` makes `fox_004` leader), remove, persistent undo, focus recovery, and reload.
- `npm run verify` remains clean.

Estimated effort: 4 hours.

### Phase 5: Add safe import, export, and recovery

Status: pending

Target outcome: a reviewer can replace the dataset safely and understand every validation outcome before application.

Files and interfaces:

- Zod import boundary and field-path errors;
- paste/file import dialog;
- preview model and confirmation step;
- full-dataset export;
- starter-data recovery and empty-state actions.

Implementation steps:

1. Reject file and pasted UTF-8 input above 2 MiB before parse, then parse and validate without mutating current state.
2. Display record, fox, location, and time-range preview.
3. Block confirmation while errors exist and preserve entered content.
4. Apply a valid replacement atomically after confirmation.
5. Export the full unfiltered observation array.
6. Cover empty dataset, duplicate IDs, unknown fields, oversized input, and invalid time.

Verification commands:

- `npm run test -- import-export` checks round-trip, field paths rooted at the input array, pre-parse size rejection, oversized valid arrays, and atomic failure.
- `npm run test:e2e -- import-recovery` checks invalid import, valid confirmation, export, and starter reset.
- `npm run verify` remains clean.

Estimated effort: 3 hours.

### Phase 6: Finish the visual system, responsive experience, and accessibility

Status: pending

Target outcome: the application is distinctive, coherent, and usable across the target viewports and input methods.

Files and interfaces:

- final design tokens, locally served fonts, icons, and UI primitives;
- polished Summary hierarchy and responsive breakpoints;
- dialog/sheet focus management;
- reduced-motion, high-zoom, keyboard, and text-alternative behavior;
- browser screenshots and accessibility evidence.

Implementation steps:

1. Apply the field-ledger art direction without changing information priority.
2. Test 1440x900, 768x1024, 390x844, and 320px width.
3. Convert desktop table and inspector into mobile cards and full-screen sheet.
4. Check route title/lang/focus, contrast, focus, landmarks, headings, labels, live regions, desktop/mobile sorting semantics, persistent undo, sheet initial/apply/cancel focus, and form errors.
5. Remove page overflow, layout shifts, console warnings, and non-functional motion.
6. Record manual keyboard, 200% zoom, the WCAG text-spacing preset (`1.5`, `2em`, `0.12em`, `0.16em`), portrait/landscape, forced/increased-contrast, reduced-motion, and screen-reader evidence under `docs/verification/`.

Verification commands:

- `npm run test:a11y` returns no targeted axe violations.
- `npm run test:e2e -- responsive-keyboard` completes the primary flow at desktop and mobile viewports.
- `docs/verification/accessibility-evidence.md` records the Q-02 manual matrix with date, environment, outcomes, and limitations.
- `npm run verify` remains clean.

Estimated effort: 4 hours.

### Phase 7: Publish the real AI Worklog and reviewer documentation

Status: pending

Target outcome: product and repository communicate the AI-first process without exposing sensitive information.

Files and interfaces:

- `docs/ai-worklog/public-checkpoints.json` as the UI source;
- in-product AI Worklog timeline;
- `README.md` with purpose, demo flow, formula, architecture, local commands, deployment, and limitations;
- public-content secret and private-path check;
- links from checkpoints to durable evidence.

Implementation steps:

1. Select 5-7 factual checkpoints from accumulated plan, decisions, reviews, tests, and screenshots.
2. Record AI contribution and human decision separately.
3. Link each claim to evidence and redact sensitive context.
4. Render the structured source inside the application.
5. Document the 20% -> 30% demo and local verification commands in README.

Verification commands:

- `npm run check:public-content` reports no secret patterns or private absolute paths.
- `npm run check:worklog-links` validates the evidence-reference schema and resolves every public URL or bundled artifact.
- `npm run test:e2e -- worklog` confirms navigation and 5-7 rendered checkpoints.
- `npm run verify` remains clean.

Estimated effort: 2 hours.

### Phase 8: Integrate Vercel and complete the release gate

Status: pending

Target outcome: the agreed repository revision is publicly reviewable on Vercel with reproducible evidence.

Files and interfaces:

- Vercel project connected to `CaseyRybak/Fox-dispatcher`;
- build and output settings documented in repository artifacts;
- `vercel.json` with the production response headers required by the accepted CSP/privacy baseline;
- CI and Vercel status visible on the release revision;
- `docs/verification/release-evidence.md` containing commands, results, viewport evidence, deployed URL, and known limitations.

Implementation steps:

1. Run the complete local release gate from a clean checkout using the pinned Node/npm versions and `npm ci`.
2. Review the production bundle for unintended requests, secrets, and debug artifacts.
3. Add and test the Vercel response headers, including self-only resource directives, `connect-src 'none'`, anti-embedding, referrer, MIME-sniffing, and permissions policy.
4. Connect or confirm Vercel Git integration with Vite build output `dist` and `main` as the production branch.
5. Validate the release-candidate SHA on a preview deployment.
6. After direct authorization fast-forwards `main` to the exact previewed commit, require `preview Git SHA == production Git SHA == approved release-candidate SHA`, then smoke-test desktop and mobile, including reload, persistence, score change, observation edit, and AI Worklog. Any different commit returns to preview review.
7. Record fresh evidence and move this plan to `docs/exec-plans/completed/` only after every acceptance statement is satisfied.

Verification commands and expected evidence:

- `npm run verify` passes from the release revision.
- `npm run test:e2e` passes against the production build.
- Header assertions confirm the accepted policy and the browser request allowlist contains no external observation egress.
- A Playwright smoke run against the Vercel URL completes without console errors.
- The deployed application sends no observation data to external services.

Estimated effort: 2-3 hours.

## Integration evidence

Completion requires one evidence package that ties repository state to deployed behavior:

- exact starter metrics and ranking screenshot;
- score contribution screenshot for `fox_001`;
- before/after evidence for prey influence 20% -> 30%;
- before/after evidence for editing `obs_005` to 10;
- location filter evidence for 3 of 5 observations and 2 foxes;
- invalid import evidence showing no state mutation;
- reload evidence for local persistence;
- desktop, tablet, and mobile screenshots;
- keyboard and accessibility report;
- public-safe AI Worklog evidence;
- clean `npm run verify` and production browser run;
- final Vercel production URL and deployment revision.
- preview and production URLs tied to the same approved Git commit SHA plus deployed header results.

The plan is complete only when these claims are supported by fresh results. Passing unit tests alone is not sufficient for a UI or deployment completion claim.

## Resulting repository artifacts

When all phases finish, the repository should contain:

- a public Vercel-deployed React application;
- pure tested observation and scoring domain logic;
- accessible responsive Summary, Observations, and AI Worklog interfaces;
- atomic JSON import, export, local persistence, and recovery;
- short repository and domain context maps;
- durable product, design, architecture, and decision documents;
- the completed execution plan and release evidence;
- real public-safe AI Worklog checkpoints;
- repository skills only for procedures proven reusable during execution.

## Execution handoff

Execution order is Phase 0 through Phase 8. Later slices depend on the product and architecture contract established in Phase 0, while focused domain tests, UI review, accessibility review, and documentation review can run independently inside an authorized phase once their interfaces are stable.

The next authority gate is **Phase 3: Connect ranking to evidence and activity**. Phase 2 is verified in unit, component, architecture, build, and production-browser checks. No commit, push, Vercel connection, or deployment is implied by Phase 2 completion.
