# Fox Dispatcher: implementation outcome

Status: Phases 0-6 are complete; Phase 7 is the next pending slice

Deployment target: Vercel

Current gate: wait for a direct Phase 7 command before Vercel deployment and submission closure

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
4. Open the in-product AI Worklog and inspect 5-7 real development checkpoints with evidence.
5. When the observation-management enhancement is present, edit or add an observation and see every affected report section update.

## Acceptance evidence

### Product contract

| ID | Priority | Acceptance statement | Required evidence |
|---|---|---|---|
| P-01 | Must | The public product is interactive and usable without setup | A Vercel production URL completes the primary reviewer journey |
| D-01 | Must | The first run contains exactly the 5 assignment observations | UI count, fixture test, and browser screenshot agree |
| D-02 | Should | Observations can be added, edited, and removed | Browser flow demonstrates immediate report recalculation |
| D-03 | Should | Accepted observations and scoring policy persist locally | Reload restores the latest valid state; reset restores the starter state |
| D-04 | Stretch | JSON import is atomic | Invalid import identifies the field and leaves current state unchanged |
| D-05 | Must | Calculation and report ordering are deterministic | Exact starter examples, rounding, ties, and input permutations pass focused tests |
| D-06 | Stretch | Untrusted import and advanced storage failures stay recoverable | Size, schema, corrupt-value, future-version, and save-failure tests preserve accepted data |
| F-01 | Must | The interface answers how many foxes were observed | Starter result is 4; mutation updates the count when Phase 5 is present |
| F-02 | Must | The interface identifies the main activity location | Starter result is `Северная поляна`, 3 of 5 observations, 60% |
| F-03 | Must | The interface names the exact scoring inputs | Only `suspicion_level` and `has_prey` contribute to the score |
| F-04 | Must | The interface identifies and explains the ranking leader | Starter leader is `fox_001`, score 7.8, with visible contributions |
| F-05 | Must | Changing a parameter changes the report | At 30% prey influence, `fox_003` leads with 7.9 |
| I-01 | Must | Filters have a visible calculation scope | The report states `N из M наблюдений` and recalculates from that selection |
| I-02 | Must | Result, ranking, locations, evidence, and raw observations form one path | Selecting a ranking row updates its evidence inspector without losing context |
| I-03 | Should | Selection and focus survive dynamic updates predictably | Selected fox fallback, chip removal, dialogs, route changes, and undo have browser focus/status assertions |
| W-01 | Must | AI Worklog is available inside the product | Main navigation opens 5-7 real, public-safe checkpoints |
| W-02 | Must | Worklog claims are traceable | Checkpoints link to a plan, decision, commit, test, or screenshot |
| R-01 | Must | Reviewer documentation explains the submission | README records scenario, stack, demo, AI tools, checks, local start, repository, and deployed URL |
| A-01 | Must | Domain logic is independent of React and storage | Import-boundary checks and unit tests enforce dependency direction |
| A-02 | Must | The production browser does not send observation data externally | Deployed headers and browser requests match the documented no-egress boundary |
| Q-01 | Must | Completion claims have fresh evidence | Typecheck, lint, tests, build, browser, and deployed smoke evidence are recorded |
| Q-02 | Should | Accessibility-facing manual claims are recorded | Keyboard, 320 px reflow, zoom, text spacing, contrast preferences, and screen-reader evidence have dated results |

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

Phase 0 materialized the repository map, product specification, interface specification, architecture, and three accepted decision records in `cbaf165bda86ab629b30ed19f226d81af14ed35e`. Phase 1 added the verified package/toolchain, bounded-context source tree, validated assignment fixture, responsive application shell, import-boundary enforcement, tests, CI, and browser evidence. Phase 2 added exact scoring and ordering, an application Summary query, the leader/ranking/contribution interface, synchronized policy controls, and production-preview evidence. Phases 1 and 2 were published together on `main` in `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb`; Phase 3 was later published in `9834af5b48705cbf00d8207877c6880a7e6e10f5`, and its consistency hardening and plan rebaseline followed in `1b2bb24e049a0fc9aca4704ef288400a97bec4ec`. The remaining Phase 3 audit corrections and Phase 4 were published together in `699d457a84d8f3fdc8ff5ae7f0b9d15c5ed0aa9c`, which is the published baseline for this follow-up audit.

The published Phase 3 consistency hardening adds complete ranking facts, persistent live status, cross-route zero-state recovery, stronger evidence/filter tests, safer browser-runner cleanup, CI coverage for the production-browser gate, and corrected delivery-state documentation. The corrections published in `699d457` preserve focus after Observations reset, reject misleading extra browser-runner arguments, and state the fresh-browser limitation precisely. External Vercel project configuration remains a later outcome.

Phase 4, published in `699d457`, replaces the Worklog placeholder with 6 structured public-safe checkpoints and 12 evidence links pinned to published revisions. A strict adapter boundary, privacy scan, Git-object link validation, focused tests, production-browser flow, and responsive screenshots protect the public artifact. The new reviewer README explains the scenario, formula, demo flow, stack, local start, AI tools, checks, limitations, repository link, and pending Phase 7 deployment without relying on chat history.

Phase 5 was published on `main` in `0021c6d8bc55b55734ac503676f0e36a30d392ee`, and its consistency hardening was published in `df434c9`. It adds atomic six-field observation commands, secure injected IDs, delete/undo, starter reset, one authoritative report state, strict local version-1 persistence, runtime validation, safe editor targeting, deterministic sorting, focus recovery, and live feedback.

Phase 6 is complete and published in `579b146`. It converts the narrow observation ledger to explicit field cards and mobile sorting, moves editor/reset surfaces to native modal dialogs, adds bottom navigation and focus-obscuring protection, and establishes axe plus responsive-keyboard browser gates. [Accessibility evidence](../../verification/accessibility-evidence.md) records five viewport/orientation checks, zero targeted axe violations across six states, keyboard/dialog focus, 200% scale/reflow, text spacing, reduced motion, forced colors, and the explicit native-screen-reader limitation.

After a direct user review against the original MOX brief, the remaining sequence was rebalanced on 2026-07-16. Mandatory Worklog/README work moved from Phase 7 to Phase 4, observation management became a proportionate should-have Phase 5, targeted quality remained Phase 6, Vercel submission moved to Phase 7, and import/export plus advanced recovery became optional Phase 8. This rebaseline changes priorities and ownership only; it does not claim that any pending phase was implemented.

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
- starter-data recovery;
- optional JSON import and full-data export only when the stretch slice is authorized.

`AI Worklog` contains 5-7 real checkpoints. Each checkpoint records the problem, AI contribution, human decision, resulting change, and verification evidence. A testing problem is included only after one is actually found.

### 6. Data management stays proportionate to the assignment

Starter data is bundled with the application. The core submission already satisfies the assignment's change-and-recalculate requirement through the scoring-policy control. Observation CRUD and simple local persistence are a valuable reviewer enhancement, not a blocker for the mandatory Worklog, README, or deployment outcomes.

Phase 5 adds observation validation, add/edit/delete, one-step undo, starter reset, and a small versioned local-storage envelope. It distinguishes missing, valid, invalid, and unavailable storage well enough to preserve the in-memory session and offer starter recovery. Atomic JSON import/export, a 2 MiB pre-parse limit, future-version raw-value recovery, and the full failure matrix move to optional Phase 8.

### 7. MOX submission essentials precede optional product depth

The real AI Worklog and reviewer README are Phase 4 because they are explicit assignment requirements and enough factual evidence already exists from Phases 0-3. Observation management follows in Phase 5 as a strong enhancement. Targeted responsive/accessibility work is Phase 6, and the public Vercel submission is Phase 7. Phase 8 contains optional import/export and advanced recovery work and does not block the MOX release.

### 8. Stack and deployment

| Concern | Decision |
|---|---|
| Application | React, TypeScript, Vite |
| State | Focused React state through Phase 4; Phase 5 consolidates mutation, undo, reset, and persistence through a reducer or equivalent application state machine; no external state library initially |
| Validation | Zod at JSON and persistence boundaries |
| Styling | One inspectable global stylesheet and global design tokens; split by feature only when it reduces ownership ambiguity |
| Visualisation | Semantic HTML, CSS, and small inspectable SVG; no chart library |
| Persistence | Versioned browser local storage |
| Unit and integration tests | Vitest and React Testing Library |
| Browser and accessibility tests | Playwright and axe |
| Static quality | TypeScript strict, ESLint, Prettier |
| CI | GitHub Actions |
| Deployment | **Vercel**, connected to the GitHub repository |

Vercel should use `npm ci` with repository-pinned Node/npm versions, run the repository build command, and publish `dist` from `main` only after explicit authorization. Phase 7 adds the minimum response headers and request assertions needed for the documented privacy boundary. The initial navigation can use hashes, avoiding an unnecessary SPA fallback.

Production has no backend, runtime AI API, analytics, or remote font dependency. User observations remain in the browser.

### 9. Accessibility and responsive contract

The main journey works at 320 CSS pixels, 200% zoom, and by keyboard. The Russian document title, current hash destination, `h1`, focus, and back/forward behavior remain synchronized. Desktop tables become readable mobile cards where needed, and the page does not acquire horizontal overflow. Full-screen inspector and filter sheets are implemented only if Phase 6 evidence shows the existing stacked layout is not usable.

Controls have visible labels and focus, dialogs manage and restore focus, sorted headers expose their state, validation errors connect to fields through a focused summary, every completed score change receives one concise polite announcement, undo has no automatic timeout, charts retain exact text alternatives, and color never carries meaning alone. Motion respects reduced-motion preferences.

### 10. Git and agent execution model

The implementation is divided into short independently verifiable slices. A slice can use an isolated worktree and focused agent context when execution is authorized. Review packages contain the changed scope and evidence rather than unrelated repository content. `main` remains releasable, and Vercel preview deployment becomes part of review after Git integration is configured.

Preparing the original plan did not itself authorize Git mutation. Phase 0 was subsequently recorded and published in the separately created commit `cbaf165bda86ab629b30ed19f226d81af14ed35e`; that historical fact does not authorize future commits or pushes. Further branch publication and Vercel deployment occur only in their authorized execution slices.

## Execution slices

Phases 0 through 6 and their recorded consistency follow-ups are complete. Phase 7 is the remaining MOX delivery slice. Phase 8 is an optional extension and starts only after a separate direct user command once the submission essentials are safe.

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
- Phase 0 itself produced documentation only. The original contract is present in published commit `cbaf165bda86ab629b30ed19f226d81af14ed35e`. Concurrent Phase 1 scaffold/dependency/test files appeared during that historical audit and remained outside its reviewed change set; they were later reconciled with Phase 2 and published in `c53d1f1`. The Vercel connection is still untouched.

### Phase 1: Deliver the walking skeleton

Status: completed and consistency-audited on 2026-07-16; later published with Phase 2 in `c53d1f1`

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
- `npm run test:browser` builds and checks the same Phase 1 shell behavior in a production-preview Chrome session, including 320 px overflow;
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

Status: completed on 2026-07-16 and published in `c53d1f1`

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

Status: completed on 2026-07-16 and published in `9834af5`; consistency hardening published in `1b2bb24`; final audit corrections published in `699d457`

Target outcome: a reviewer can move from the leader to raw evidence and understand where observations are concentrated.

Files and interfaces:

- selected-fox state and focused view model;
- evidence strip and observation list;
- location aggregation and semantic bars;
- global filter state, chips, reset, and calculation-scope label;
- stacked responsive ranking/inspector baseline; Phase 6 later confirmed that full-screen inspector and filter sheets were unnecessary for the implemented journey.

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
- `npm run test -- summary` checks selection persistence, fallback, filters, zero results, reset, and the published scoring-policy flow.
- `npm run test:e2e` checks production-build selection, all filter types, combined status copy, chip-removal focus, empty-state copy/actions, reset, keyboard operation, shared Observations scope, and 320 px overflow.
- `npm run verify` remains clean.

Estimated effort: 3-4 hours.

Completion notes:

- `application/report-scope.ts` and its six focused tests cover deterministic options, trimmed case-insensitive fox search, exact location/color/prey filters, the 3-of-5 North Clearing scope, selected-fox fallback, and multi-record evidence chronology.
- The Summary view model and UI render selected-fox evidence, time/suspicion markers, source records, report scope, filter chips, location activity, and recent observations. The read-only Observations destination consumes the same filtered array.
- Component tests cover explicit selection through policy recalculation, filter fallback without focus movement, atomic scope announcements, zero results, full reset, and next/previous/scope-label focus recovery after chip removal.
- The Summary uses the canonical zero-result copy, one atomic polite announcement per accepted filter command, and an opaque sticky header that keeps scrolled mobile evidence legible.
- `npm run test:e2e` runs the production build through the repository-local official Playwright CLI. It verifies keyboard fox selection, selection preservation at 30%, each filter type, a four-filter combination, chip focus, empty/reset behavior, location-driven scope, the scoped Observations ledger, 320 px overflow, and zero browser errors.
- [Phase 3 evidence](../../verification/phase-3-evidence-and-activity.md) records the focused, full, browser, and visual results. Phase 4 had not started at the Phase 3 acceptance gate.

### Phase 4: Publish the real AI Worklog and reviewer README

Status: completed, verified, and published in `699d457` on 2026-07-16

Target outcome: the two mandatory communication artifacts already describe the real AI-first process before optional product depth continues.

Files and interfaces:

- `docs/ai-worklog/public-checkpoints.json` as the structured UI source;
- a small schema/parser at the application or adapter boundary;
- `ui/ai-worklog/WorklogPage.tsx` as a real 5-7 checkpoint timeline;
- `README.md` with scenario, stack, formula, demo flow, AI tools, verification, local start, repository, deployment status, and limitations;
- `check:public-content` and `check:worklog-links` scripts;
- focused Worklog component/schema tests and production-browser evidence.

Implementation steps:

1. Select 5-7 factual checkpoints from the original task framing, repository planning, scoring decision, interface work, human decisions, defects actually found, and verification from Phases 0-3.
2. Give each checkpoint a stage/date, goal, AI contribution, human decision, resulting change, verification summary, and structured evidence references.
3. Remove secrets, tokens, personal data, private absolute paths, raw transcript text, and unsupported claims before the source enters the bundle.
4. Render the structured source with meaningful evidence-link names and clear separation between AI contribution and human responsibility.
5. Write the reviewer README now; mark the deployment URL as pending until Phase 7 rather than delaying the rest of the document.
6. Update the final Worklog checkpoint and deployed URL again in Phase 7 without expanding the list beyond 5-7 entries.

Verification commands and expected evidence:

- `npm run check:public-content` reports no secret-like values, private absolute paths, or transcript dumps.
- `npm run check:worklog-links` validates the checkpoint schema and every evidence reference available at the current published revision.
- `npm run test -- worklog` proves 5-7 entries and the required fields.
- `npm run test:e2e:worklog` confirms navigation, rendered checkpoints, and accessible evidence links in the production build.
- `npm run verify` remains clean.

Estimated effort: 2-3 hours.

First checkpoint: the placeholder is replaced by 5-7 schema-valid public-safe checkpoints, and README lets a reviewer run and understand the current product without chat history.

Completion notes:

- `docs/ai-worklog/public-checkpoints.json` contains 6 factual checkpoints and 12 public GitHub evidence links pinned to commits from Phases 0-3.
- `adapters/public-worklog/public-worklog.ts` enforces strict fields, 5-7 entries, unique IDs, pinned URLs, and private-path/credential rejection before freezing accepted values.
- The Worklog timeline separates AI contribution, human decision, resulting change, verification, and descriptive evidence links in semantic articles.
- `README.md` gives the reviewer an honest current-state handoff; the Vercel URL remains explicitly pending until Phase 7.
- `check:public-content` scans the two public artifacts, while `check:worklog-links` validates the schema and resolves every commit/path pair through local Git objects.
- Focused tests cover valid/invalid public data and UI semantics. `test:e2e:worklog` covers route focus, 6 checkpoints, 12 pinned links, public text, 320 px overflow, screenshots, and zero browser errors.
- Through Phase 4 Worklog evidence is restricted to revision-pinned GitHub blobs. Phase 7 must add and verify an exact Vercel artifact URL contract before using deployment evidence directly in the structured source; otherwise it can keep the Worklog pinned to the published `release-evidence.md` revision and put the public deployment URL in README.
- [Phase 4 evidence](../../verification/phase-4-ai-worklog-and-readme.md) records the commands, artifacts, and remaining deployment boundary.

### Phase 5: Add proportionate observation management

Status: completed and published in `0021c6d` on 2026-07-16; consistency hardening published in `df434c9`

Target outcome: a reviewer can add, edit, delete, undo, reset, and reload observations while every report section recalculates from one accepted state.

Files and interfaces:

- application commands/state transition for observation mutations;
- accessible observation editor, sortable desktop ledger, and reflow-safe table container; the final mobile-card treatment was delivered in Phase 6;
- injected `ObservationIdGenerator`;
- one-step delete undo and starter-data reset;
- small versioned local-storage port and adapter.

Implementation steps:

1. Validate the six editable assignment fields; keep observation `id` generated and immutable.
2. Implement add and edit as atomic accepted-state transitions.
3. Implement delete with one persistent undo action and correct unique-fox recalculation; deleting a fox's final observation removes that fox from the report naturally.
4. Persist observations and scoring policy in a small v1 envelope and restore only a valid envelope.
5. For missing or invalid storage, preserve the current in-memory session and offer an explicit starter reset. Treat unavailable/save-failure status honestly without building the Phase 8 raw-value recovery UI.
6. Keep filters derived and unsaved; do not introduce a separate Fox aggregate editor or new domain fields.

The add command consumes an injected `ObservationIdGenerator`. Production creates `obs_<uuid>` through `crypto.randomUUID()`; tests inject fixed values. Generation or collision failure preserves state and returns a form-level error.

Verification commands and expected evidence:

- `npm run test:run -- manage-observations mutations persistence` checks add, edit, delete, undo, starter reset, valid reload, and safe invalid-storage fallback without entering watch mode.
- `npm run test:e2e:manage-observations` demonstrates that editing `obs_005.suspicion_level` to 10 makes `fox_004` the 8.0 leader, then covers remove, undo, focus recovery, and reload.
- `npm run verify` remains clean.

Estimated effort: 3-4 hours.

Completion notes:

- `observation-management.ts` validates the six assignment fields and applies add/edit/delete/undo/reset without mutating the previous set.
- Production IDs use injected `crypto.randomUUID()` values in `obs_<uuid>` form; generation and collision errors keep the form and dataset intact.
- The Observations route provides labelled fields, permanent hints, focused error summaries that do not collide with hash routing, sortable column headers, protected editor targeting, row-specific actions, persistent one-step undo with explicit dismissal, starter reset confirmation, and visible browser/memory-only status. Persistence status is also visible from the other destinations.
- `fox-dispatcher.dashboard` stores only a strict version-1 envelope containing observations, scoring policy, and a UTC timestamp. Missing, valid, corrupt, unsupported, unavailable, and failed-save paths do not crash or silently replace accepted data.
- All reports, filter options, evidence, activity, counts, and rankings derive from the accepted observation array. Filters remain unsaved; starter-data reset leaves the scoring policy unchanged.
- Focused mutation/persistence/component tests cover strict runtime types, schema-valid punctuation/whitespace IDs, sorting, editor isolation, reset/policy reload, save-failure feedback, and the original mutation/reload path. Current focused/full-gate results and the sandbox-blocked browser rerun are recorded honestly in the linked evidence; the published browser artifacts remain the `0021c6d` baseline until a preview server can bind.
- [Phase 5 evidence](../../verification/phase-5-observation-management.md) records the reproducible commands and visual artifacts. The later [Phase 6 evidence](../../verification/accessibility-evidence.md) closes the mobile-card/table refinement and records the broader accessibility boundary.

### Phase 6: Complete targeted responsive and accessibility quality

Status: completed on 2026-07-17 and published in `579b146`

Target outcome: the actual reviewer journey, including Worklog and observation management when present, remains clear and operable across target viewports and input methods.

Files and interfaces:

- final design tokens and focused responsive corrections;
- mobile observation cards/editor treatment where the table is not usable;
- dialog focus/error behavior for implemented flows;
- reduced-motion, keyboard, zoom, and text-alternative evidence;
- browser screenshots and accessibility evidence.

Implementation steps:

1. Review 1440x900, 768x1024, 390x844, and 320px against the current field-ledger direction.
2. Fix concrete hierarchy, overflow, focus, contrast, or form problems found by evidence.
3. Convert the observation table/editor to mobile cards or a dialog where required. Keep the current stacked Summary unless testing proves a full-screen inspector or filter sheet is necessary.
4. Check route title/lang/focus, landmarks, headings, labels, live regions, mutation focus, undo, and error summaries.
5. Record keyboard, 200% zoom, text spacing, portrait/landscape, reduced-motion, contrast-preference, and assistive-technology evidence without claiming unperformed checks. If a native screen reader is unavailable locally, keep that smoke as an explicit Phase 7 release-environment check.

Verification commands and expected evidence:

- `npm run test:a11y` returns no targeted violations for implemented destinations and dialogs.
- `npm run test:e2e:responsive-keyboard` exercises the targeted responsive, keyboard, dialog, and preference flow at desktop and mobile viewports; the Phase 3-5 browser gates retain the complete scoring, Worklog, and mutation journeys.
- `docs/verification/accessibility-evidence.md` records Q-02 results and limitations.
- `npm run verify` remains clean.

Completion evidence:

- the desktop table remains semantic while widths through 767 px use a labelled field-card list with a dedicated sort control;
- native modal editor and reset dialogs expose accessible names, safe initial focus, Escape behavior, confirmation focus containment, and trigger-focus restoration;
- the published `npm run test:a11y` baseline reports zero targeted axe violations across six implemented page/dialog states; the Phase 6 consistency follow-up expands the gate to validation, dirty-discard, and mobile-editor states;
- `npm run test:e2e:responsive-keyboard` covers 1440x900, 768x1024, 390x844, 320x800, and 844x390 plus keyboard, focus-obscuring, reflow, text spacing, reduced motion, forced colors, and the Chromium accessibility tree;
- [Phase 6 evidence](../../verification/accessibility-evidence.md) distinguishes browser accessibility-tree inspection from an unavailable native NVDA/VoiceOver/Orca pass.

Estimated effort: 3-4 hours.

### Phase 7: Deploy to Vercel and complete the MOX submission gate

Status: pending; final required slice

Target outcome: the approved repository revision is publicly reviewable and all must-have MOX submission artifacts point to the same working product.

Files and interfaces:

- Vercel project connected to `CaseyRybak/Fox-dispatcher`;
- minimal `vercel.json` only where required for the tested static/privacy behavior;
- final README deployment/repository links;
- final 5-7 checkpoint Worklog evidence;
- `docs/verification/release-evidence.md` with URL, revision, commands, browser results, and known limitations.

Implementation steps:

1. Run the complete local gate with the pinned Node/npm versions and inspect the production bundle for secrets, debug artifacts, unintended external resources, and observation egress.
2. Add and test the minimum deployment headers supported by the real bundle; document any narrow inline-style exception rather than blocking the submission on an idealized CSP.
3. Connect Vercel with build command `npm run build`, output `dist`, and `main` as the production branch after explicit authorization for external changes.
4. Smoke-test the deployed Summary, Observations, AI Worklog, parameter recalculation, and any Phase 5 mutation/persistence flow on desktop and mobile.
5. Put the public URL and GitHub URL in README, finalize Worklog evidence links, and record the deployed revision.
6. Move this core plan to `docs/exec-plans/completed/` only after every Must acceptance statement has fresh evidence. Any unmet Should item is documented as a limitation; Stretch items do not block submission.

Verification commands and expected evidence:

- `npm run verify` passes from the submitted revision.
- Phase-specific production browser tests pass against the built artifact.
- Deployed header/request assertions show no external observation egress.
- A Playwright smoke run against the Vercel URL completes the reviewer journey without console errors at desktop and 320 px.
- README and Worklog resolve their public URLs and contain no private paths or secrets.

Estimated effort: 2-3 hours.

### Phase 8 (optional): Add import, export, and advanced recovery

Status: optional stretch; not part of the MOX completion gate

Target outcome: after the submission is safe, a separately authorized extension can replace and export the full observation dataset without weakening validated state.

Files and interfaces:

- Zod import boundary and field-path errors;
- paste/file import dialog and preview;
- full-dataset export;
- advanced corrupt/future-version storage recovery only if its product value is still justified.

Implementation steps:

1. Reject file and pasted UTF-8 input above 2 MiB before parse, then validate without mutating accepted state.
2. Preview record, fox, location, and time-range summaries before explicit replacement.
3. Export the full unfiltered observation array with a deterministic UTF-8 artifact.
4. Add raw-value and future-version recovery only as a separate reviewed behavior, not as hidden complexity in Phase 5.

Verification commands and expected evidence:

- `npm run test -- import-export` checks size, schema, field paths, round-trip, and atomic failure.
- `npm run test:e2e:import-recovery` checks invalid import, valid confirmation, export, and recovery.
- `npm run verify` remains clean.

Estimated effort: 3 hours if separately authorized.

## Integration evidence

Core completion requires one evidence package that ties repository state to deployed behavior:

- exact starter metrics and ranking screenshot;
- score contribution screenshot for `fox_001`;
- before/after evidence for prey influence 20% -> 30%;
- before/after evidence for editing `obs_005` to 10 when the Should-have Phase 5 is included;
- location filter evidence for 3 of 5 observations and 2 foxes;
- reload evidence for local persistence when Phase 5 is included;
- desktop, tablet, and mobile screenshots;
- keyboard and accessibility report;
- public-safe AI Worklog evidence;
- clean `npm run verify` and production browser run;
- final README, Vercel production URL, GitHub URL, and deployment revision;
- deployed header and browser-request results.

Optional Phase 8 evidence adds invalid-import atomicity, full-data export, size limits, and advanced recovery. Those results do not block the MOX completion gate. The core plan is complete only when every Must claim is supported by fresh results; passing unit tests alone is not sufficient for a UI or deployment completion claim.

## Resulting repository artifacts

When the core Phases 0-7 finish, the repository should contain:

- a public Vercel-deployed React application;
- pure tested observation and scoring domain logic;
- accessible responsive Summary, Observations, and AI Worklog interfaces;
- real 5-7 checkpoint AI Worklog and reviewer README;
- proportionate observation management and local persistence when Phase 5 is included;
- short repository and domain context maps;
- durable product, design, architecture, and decision documents;
- the completed execution plan and release evidence;
- real public-safe AI Worklog checkpoints;
- repository skills only for procedures proven reusable during execution.

Optional Phase 8 may add atomic JSON import/export and advanced recovery after the submitted product is already complete.

## Execution handoff

Required execution order is Phase 0 through Phase 7. Phase 4 has closed the mandatory Worklog/README gap before the should-have observation-management enhancement in Phase 5. Phase 6 verifies the implemented journey, and Phase 7 deploys and closes the MOX submission. Phase 8 is a separate optional extension, not a release dependency.

The next authority gate is **Phase 7: Deploy to Vercel and complete the MOX submission gate**. Phase 6 is published in `579b146`. No Vercel connection or deployment begins without a separate direct command.
