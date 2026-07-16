# Fox Dispatcher repository map

Fox Dispatcher is an interactive local-first dashboard for a forest observer. The product turns editable fox observations into an explainable suspicion ranking, location activity summary, and public-safe AI Worklog.

## Current delivery state

- Phase 0 is complete: product, interface, architecture, and deployment decisions are repository artifacts.
- Phase 1 is the next execution slice and awaits a direct user command.
- The application scaffold and runtime code arrive in Phase 1.
- Deployment target: Vercel through the GitHub repository integration.

## Start here

- [Active implementation plan](docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md) — execution slices, acceptance evidence, and current gate.
- [Product specification](docs/product-specs/fox-dispatcher.md) — user outcomes, field semantics, scoring contract, states, and examples.
- [Interface specification](docs/design-docs/interface.md) — information hierarchy, responsive layout, interactions, visual language, and accessibility.
- [Architecture](ARCHITECTURE.md) — bounded context, layers, dependency direction, ports, and planned repository structure.

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

The planned source location is `src/observation-monitoring/`. A domain-level `AGENTS.md` becomes its local map when that source tree is created.

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

## Planned verification entry points

Phase 1 introduces the executable scripts and pinned toolchain. The shared verification entry point is planned as `npm run verify`, with focused Vitest and Playwright scripts described in the active plan. Release evidence culminates in a browser smoke run against the Vercel production URL.
