# Fox Dispatcher repository map

Fox Dispatcher is a local-first dashboard that turns editable fox observations into an explainable suspicion ranking, leading-location context, and a public-safe AI Worklog.

## Current state

Phases 0-8 and the post-release UI, scoring-explanation, identity, color-consistency, audit-remediation, and documentation refinements are complete. There is no active execution plan. Historical phase results remain under `docs/verification/` and completed plans remain under `docs/exec-plans/completed/`.

Production: [fox-dispatcher-brown.vercel.app](https://fox-dispatcher-brown.vercel.app/), deployed from `main` through the GitHub/Vercel integration.

## Start here

- [Current implementation audit](docs/verification/2026-07-18-audit-remediation.md) — current behavior, audit remediation, fresh gates, and verification boundary.
- [Product specification](docs/product-specs/fox-dispatcher.md) — user outcomes, field semantics, scoring contract, states, and acceptance examples.
- [Interface specification](docs/design-docs/interface.md) — information hierarchy, interactions, responsive behavior, visual language, and accessibility.
- [Architecture](ARCHITECTURE.md) — bounded context, layers, dependency direction, ports, runtime boundaries, and data flow.
- [Observation Monitoring map](src/observation-monitoring/AGENTS.md) — source entry points and focused verification evidence.

## Domain map

The product has one bounded context: `observation-monitoring`.

```text
observation-monitoring
├── domain          observations, scoring policy, report analytics
├── application     commands, queries, state transitions, ports
├── adapters        starter data, JSON transfer, browser persistence
└── ui              Summary, Parameters/Observations, AI Worklog
```

The application composition root lives under `src/app/`; shared presentation primitives live under `src/shared/`.

## Durable artifacts

- `docs/product-specs/` contains product facts and acceptance examples.
- `docs/design-docs/` contains interface and interaction decisions.
- `docs/decisions/` contains scoring, local-first, and deployment decisions.
- `docs/exec-plans/active/` contains authorized ongoing outcomes; it is currently empty.
- `docs/exec-plans/completed/` contains finished execution plans.
- `docs/verification/` contains phase, browser, accessibility, audit, and release evidence.
- `docs/ai-worklog/` contains the structured public checkpoints rendered by the product.
- `docs/research/` and `docs/legal/` contain supporting audits and third-party provenance.

## Decision history

- [Explainable scoring](docs/decisions/0001-explainable-scoring.md)
- [Local-first static application](docs/decisions/0002-local-first-static-app.md)
- [Vercel deployment](docs/decisions/0003-vercel-deployment.md)

## Agent capabilities

Project-local skills live in `.agents/skills/`. The [skills audit](docs/research/skills-audit.md) maps their provenance and scope. Specifications and plans describe intended outcomes; repository skills capture repeatable procedures.

## Verification entry points

`npm run verify` is the shared repository gate for formatting, lint, dependency boundaries, public content, Worklog links, tests, TypeScript, production build, and deployment policy.

Focused browser evidence is grouped by outcome:

- `npm run test:e2e` — Summary, filters, ranking, and scoring policy;
- `npm run test:e2e:manage-observations` — add/edit/delete, persistence, and focus;
- `npm run test:e2e:import-recovery` — import, export, and storage recovery;
- `npm run test:e2e:worklog` — public Worklog;
- `npm run test:a11y` and `npm run test:e2e:responsive-keyboard` — accessibility and responsive interaction;
- `npm run test:e2e:release` — production-preview or revision-matched public smoke.

Browser artifacts live under `output/playwright/`; reproducible results and known limits live under `docs/verification/`.
