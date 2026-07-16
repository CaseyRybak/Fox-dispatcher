# Fox Dispatcher repository map

Fox Dispatcher is an interactive local-first dashboard for a forest observer. The product turns editable fox observations into an explainable suspicion ranking, location activity summary, and public-safe AI Worklog.

## Current delivery state

- Phase 0 is complete and contract-audited: product, interface, architecture, deployment decisions, and traceability evidence are repository artifacts.
- Phase 1 is complete: the walking skeleton and its consistency corrections establish the pinned toolchain, validated starter boundary, navigation, architecture checks, and shared verification gate.
- Phase 2 is complete in the working tree: exact scoring, deterministic ranking, contribution explanations, the live prey-weight policy, and the responsive Summary experience are verified.
- [Phase 2 evidence](docs/verification/phase-2-explainable-ranking.md) records focused tests, the full gate, production-preview interactions, accessibility snapshots, console results, and 320 px reflow.
- Phase 3 is the next pending slice. Phase 1 and Phase 2 changes remain uncommitted and unpushed.
- Deployment target: Vercel through the GitHub repository integration.

## Start here

- [Active implementation plan](docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md) — execution slices, acceptance evidence, and current gate.
- [Product specification](docs/product-specs/fox-dispatcher.md) — user outcomes, field semantics, scoring contract, states, and examples.
- [Interface specification](docs/design-docs/interface.md) — information hierarchy, responsive layout, interactions, visual language, and accessibility.
- [Architecture](ARCHITECTURE.md) — bounded context, layers, dependency direction, ports, and repository structure.
- [Phase 0 contract audit](docs/verification/phase-0-contract-audit.md) — requirement traceability, consistency findings, commands, and remaining external-source boundary.

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
- `docs/exec-plans/active/` contains authorized ongoing outcomes.
- `docs/exec-plans/completed/` will contain finished plans and evidence summaries.
- `docs/verification/` will contain reproducible browser and release evidence.
- `docs/ai-worklog/` will contain structured public checkpoints rendered by the product.
- `docs/research/` contains supporting research and audited skill selection.
- `docs/legal/` contains third-party notices.

## Agent capabilities

Project-local skills live in `.agents/skills/`. The [skills audit](docs/research/skills-audit.md) maps their provenance and scope. Planning, design, TDD, review, accessibility, browser verification, and skill-writing workflows are available for the execution slices that call for them.

Repository skills capture proven repeatable procedures. Specifications, execution state, and unresolved work remain discoverable through the document areas above.

## Verification entry points

Phase 1 established the pinned Node/npm toolchain and shared `npm run verify` gate. Phase 2 adds `npm run test -- scoring` and `npm run test -- summary` for exact ranking and interactive policy behavior. `npm run test -- navigation` focuses hash-route behavior, while `npm run check:boundaries` proves allowed production imports and rejected dependency directions. Browser artifacts live under `output/playwright/`; final release evidence culminates in a smoke run against the Vercel production URL.
