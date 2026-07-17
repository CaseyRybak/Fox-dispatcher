# Fox Dispatcher repository map

Fox Dispatcher is an interactive local-first dashboard for a forest observer. The product turns editable fox observations into an explainable suspicion ranking, leading-location context, and public-safe AI Worklog.

## Current delivery state

- Phase 0 is complete and contract-audited: product, interface, architecture, deployment decisions, and traceability evidence are repository artifacts.
- Phase 1 is complete: the walking skeleton and its consistency corrections establish the pinned toolchain, validated starter boundary, navigation, architecture checks, and shared verification gate.
- Phase 2 is complete and published with Phase 1 on `main` in `c53d1f1`: exact scoring, deterministic ranking, contribution explanations, the live prey-weight policy, and responsive Summary baseline are verified.
- [Phase 2 evidence](docs/verification/phase-2-explainable-ranking.md) records focused tests, the full gate, production-preview interactions, accessibility snapshots, console results, and 320 px reflow.
- Phase 3 is complete and published on `main` in `9834af5`: report-wide filters, selected-fox evidence, location activity, recent observations, deterministic chip focus, and the shared Observations scope passed focused, full, production-browser, and 320 px gates.
- Phase 3 consistency hardening and the rebalanced delivery plan were published in `1b2bb24`; its final focus, runner-argument, and evidence-precision corrections were published with the Phase 4 integration in `699d457`.
- [Phase 3 evidence](docs/verification/phase-3-evidence-and-activity.md) records the automated and visual acceptance results and distinguishes the remaining browser-evidence limitation.
- Phase 4 is complete and published in `699d457`: the application renders 6 schema-validated public-safe AI checkpoints with 12 revision-pinned evidence links, and `README.md` explains the product, formula, stack, AI process, checks, status, and current limitations.
- [Phase 4 evidence](docs/verification/phase-4-ai-worklog-and-readme.md) records the schema, privacy, link, focused, production-browser, and responsive acceptance results.
- Phase 5 was published on `main` in `0021c6d`, and its consistency hardening was published in `df434c9`: six-field add/edit, immutable generated IDs, delete/one-step undo, starter reset, report-wide recalculation, strict local version-1 persistence, runtime validation, deterministic sorting, and focus/live-feedback corrections are verified.
- [Phase 5 evidence](docs/verification/phase-5-observation-management.md) records the mutation, storage, focus, reload, desktop, and 320 px results plus the current consistency follow-up.
- Phase 6 is complete and published in `579b146`: mobile observation cards and sorting, modal editor/reset behavior, bottom navigation, focus protection, axe scans, keyboard flows, required viewports, zoom/reflow, text spacing, reduced motion, forced colors, and Chromium accessibility-tree evidence are recorded.
- [Phase 6 evidence](docs/verification/accessibility-evidence.md) records the automated, visual, keyboard, and assistive-technology boundary results.
- Phase 7 is complete: the public Vercel product renders 7 public-safe Worklog checkpoints, passed the production reviewer journey with no console errors or external observation requests, and serves the tested privacy headers. [Release evidence](docs/verification/release-evidence.md) ties the URL, revision, browser result, and honest limitations together.
- Phase 8 is complete and was first published and deployed in `89c0f49`: atomic JSON import, deterministic full-data export, and explicit corrupt/future-storage recovery passed focused, full, production-browser, axe, and 320 px checks.
- Post-Phase-8 hardening on `main` adds the compact Summary composition, decimal explanation for repeating fractions, name-based fox identity with deterministic first-free IDs, one-color-per-fox enforcement, clearer observation terminology, and current documentation/screenshots.
- Production: [fox-dispatcher-brown.vercel.app](https://fox-dispatcher-brown.vercel.app/), deployed through the GitHub/Vercel integration from `main`.

## Start here

- [Current implementation documentation audit](docs/verification/2026-07-17-current-implementation-documentation-audit.md) — authoritative-document reconciliation, historical-evidence boundary, current screenshot, and fresh verification.
- [Phase consistency and UI/UX audit](docs/verification/2026-07-17-phase-consistency-ui-audit.md) — current phase matrix, corrected findings, fresh local/public evidence, and remaining boundaries.
- [Completed Phase 8 plan](docs/exec-plans/completed/2026-07-17-import-export-recovery.md) — import, export, recovery execution and acceptance map.
- [Completed audit-corrections plan](docs/exec-plans/completed/2026-07-17-audit-corrections.md) — exact explanation, atomic failed-file provenance, forms, empty/mobile context, and fresh verification.
- [Phase 8 specification](docs/specs/completed/2026-07-17-import-export-recovery.md) — accepted user outcomes, boundaries, states, and evidence.
- [Completed implementation plan](docs/exec-plans/completed/2026-07-16-fox-dispatcher-implementation.md) — execution slices, acceptance evidence, and optional Phase 8 boundary.
- [Product specification](docs/product-specs/fox-dispatcher.md) — user outcomes, field semantics, scoring contract, states, and examples.
- [Interface specification](docs/design-docs/interface.md) — information hierarchy, responsive layout, interactions, visual language, and accessibility.
- [Architecture](ARCHITECTURE.md) — bounded context, layers, dependency direction, ports, and repository structure.
- [Phase 0 contract audit](docs/verification/phase-0-contract-audit.md) — requirement traceability, consistency findings, commands, and remaining external-source boundary.
- [Documentation consistency audit](docs/verification/2026-07-16-documentation-consistency-audit.md) — current status reconciliation, implementation-readiness findings, verification, and residual risks.

## Decision history

- [Explainable scoring](docs/decisions/0001-explainable-scoring.md) — the two scoring signals, aggregation, weights, and tie-breaks.
- [Local-first static application](docs/decisions/0002-local-first-static-app.md) — browser persistence, import/export, recovery, and runtime boundaries.
- [Vercel deployment](docs/decisions/0003-vercel-deployment.md) — build output, Git integration, preview, and production evidence.

## Domain map

The product has one bounded context: `observation-monitoring`.

```text
observation-monitoring
├── domain          observations, scoring policy, report analytics
├── application     commands, queries, state transitions, ports
├── adapters        starter data, JSON boundary, browser persistence
└── ui              Summary, Observations, AI Worklog
```

The source context lives under [`src/observation-monitoring/`](src/observation-monitoring/). Its [domain map](src/observation-monitoring/AGENTS.md) points agents to current entry points and phase ownership.

## Durable knowledge

- `docs/product-specs/` contains product facts and acceptance examples.
- `docs/design-docs/` contains interface and interaction decisions.
- `docs/decisions/` contains contextual decision records.
- `docs/exec-plans/active/` contains authorized ongoing outcomes; there is no active plan after Phase 8.
- `docs/exec-plans/completed/` contains finished plans and evidence summaries.
- `docs/verification/` contains reproducible browser, phase, audit, and release evidence.
- `docs/ai-worklog/` contains structured public checkpoints rendered by the product.
- `docs/research/` contains supporting research and audited skill selection.
- `docs/legal/` contains third-party notices.

## Agent capabilities

Project-local skills live in `.agents/skills/`. The [skills audit](docs/research/skills-audit.md) maps their provenance and scope. Planning, design, TDD, review, accessibility, browser verification, and skill-writing workflows are available for the execution slices that call for them.

Repository skills capture proven repeatable procedures. Specifications, execution state, and unresolved work remain discoverable through the document areas above.

## Verification entry points

Phase 1 established the pinned Node/npm toolchain and shared `npm run verify` gate. Phase 2 adds `npm run test -- scoring` and `npm run test -- summary` for exact ranking and interactive policy behavior. Phase 3 adds `npm run test -- report-scope`, the selection/filter cases in `npm run test -- summary`, and `npm run test:e2e` for the production Summary-to-evidence flow. Phase 4 adds `npm run check:public-content`, `npm run check:worklog-links`, `npm run test -- worklog`, and `npm run test:e2e:worklog`. Phase 5 adds `npm run test:run -- manage-observations mutations persistence`, component mutation/reload coverage, and `npm run test:e2e:manage-observations`. Phase 6 adds `npm run test:run -- accessibility`, `npm run test:a11y`, and `npm run test:e2e:responsive-keyboard`. Phase 7 adds `npm run check:deployment` to the shared gate and `npm run test:e2e:release` for the deployed reviewer journey. `npm run test -- navigation` focuses hash-route behavior, `npm run test:browser` reproduces the production-preview shell smoke, and `npm run check:boundaries` proves allowed production imports and rejected dependency directions. Browser artifacts live under `output/playwright/`.

Phase 8 adds `npm run test:run -- import-export import-recovery recovery` and `npm run test:e2e:import-recovery`; [its evidence](docs/verification/phase-8-import-export-recovery.md) records atomic replacement, deterministic download, storage preservation, four zero-violation axe scans, and 320 px inspection.
