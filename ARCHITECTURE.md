# Fox Dispatcher architecture

## Purpose

Fox Dispatcher is a static local-first React application. It converts editable observation records into an explainable report while keeping domain calculations independent from React, browser storage, JSON transfer, and deployment concerns.

The [product specification](docs/product-specs/fox-dispatcher.md) owns behavior and acceptance examples. The [interface specification](docs/design-docs/interface.md) owns composition and interaction. Dated implementation and release results live under `docs/verification/`.

## System context

```text
Bundled starter data ─┐
Manual observation ──┼─> Fox Dispatcher in the browser ─> Explainable report
Imported JSON ───────┘                 │
                                       ├─> Versioned local storage
                                       ├─> JSON export
                                       └─> Public-safe AI Worklog

GitHub main ─> Vercel build ─> Static production artifact
```

The runtime has no application server, database, account system, analytics, remote observation API, or AI API. Observation data is processed and persisted in the browser.

## Bounded context

The application has one bounded context: `observation-monitoring`.

Core domain language:

- **Observation** — one source record with observation identity, fox identity and name, location, color, prey presence, suspicion level, and time.
- **Scoring policy** — prey influence and its complementary suspicion influence.
- **Observation selection** — the report scope after Summary filters.
- **Fox assessment** — the deterministic aggregate for one fox in that selection.
- **Report** — ranked assessments, summary metrics, leading-location data, exact score values, and calculation scope.
- **Evidence volume** — observation count used by mean and prey-rate aggregates, not an independent bonus.

## Layer map

```text
src/
├── app/                         composition and navigation
├── observation-monitoring/
│   ├── domain/                  values and pure calculations
│   ├── application/             commands, queries, view models, ports
│   ├── adapters/                browser and file boundaries
│   └── ui/                      Summary, Observations, AI Worklog
└── shared/                      presentation primitives
```

Dependency direction:

```text
app ──> ui ──> application ──> domain
 │                  ^
 └────> adapters ───┘
```

| Source | May import | Excluded dependencies |
|---|---|---|
| `domain` | domain modules | React, browser APIs, application, adapters, UI, app |
| `application` | domain and application modules | React, browser APIs, concrete adapters, UI, app |
| `adapters` | application port types | UI, app, direct domain implementation |
| `ui` | application APIs/view models, `shared/ui` | concrete adapters, persistence, duplicated domain calculations |
| `shared/ui` | shared presentation modules | bounded-context and app modules |
| `app` | UI, application bootstrap, concrete adapters | duplicated domain behavior |

`src/app/` is the composition root. It creates concrete adapters, owns accepted application state, and injects boundaries into the application and UI. ESLint restrictions and `npm run check:boundaries` verify the dependency matrix.

### Domain

The domain contains serializable values and pure calculations for validation-ready observations, scoring policy, filtering, exact assessment aggregation, deterministic ranking, co-leaders, leading location, and report metrics.

Scores are represented as integer fractions. Comparison uses safe-integer cross multiplication; decimal half-up formatting is a presentation operation. Exact calculation details and examples live in [Decision 0001](docs/decisions/0001-explainable-scoring.md).

### Application

The application layer coordinates initialization, filters, selected-fox fallback, scoring-policy changes, observation mutations, undo/reset, import replacement, persistence requests, and presentation-ready view models.

Observation management resolves an entered fox name to an existing identity or a deterministic first-free `fox_NNN`, preserves the fox's established color, assigns the first-free `obs_NNN`, and stores the display name separately from the technical ID. The product contract owns the detailed identity and validation examples.

Core outbound ports:

```text
DashboardStateStore       load, save, clear
ObservationImportParser   validate and preview unknown JSON
ObservationExporter       create the full-data JSON artifact
```

### Adapters

Adapters translate external representations into application values:

- bundled starter JSON;
- structured public Worklog JSON;
- the versioned local-storage envelope;
- pasted or uploaded observation JSON;
- browser downloads for full-data export.

All imported and persisted values pass runtime validation before becoming accepted state. Corrupt or future-version storage remains recoverable until the user explicitly restores starter state. Storage and recovery details live in [Decision 0002](docs/decisions/0002-local-first-static-app.md).

### UI

React renders application view models and emits user intent through application callbacks:

- **Summary** owns report filters, leader or exact co-leaders, unique-fox and leading-location context, calculation explanation, selectable ranking, and scoring-weight controls.
- **Parameters** is the navigation destination for the `Observations` route. Its visible heading is `Наблюдения`; it presents the full editable ledger, active-scope notice, CRUD, reset, import/export, persistence status, and recovery.
- **AI Worklog** renders the validated public checkpoints and immutable evidence references.

## Data flow

```text
starter / persisted / imported values
                │ runtime validation
                v
       accepted observations + scoring policy
                │
                ├─ application commands ─> accepted next state ─> persistence
                │
                └─ filters ─> pure domain report ─> view models ─> React UI
```

One accepted observation array and one scoring policy are authoritative. Counts, ranking, bars, explanations, and the editable ledger derive from that state rather than maintaining independent copies.

## Stable invariants

- Observation IDs are unique inside the accepted dataset.
- Required strings are trimmed and non-empty; suspicion is an integer from 0 through 10; time is a valid `HH:mm` value.
- A manually created fox has a persistent display name and one established color across its observations.
- The prey weight is an integer percentage from 0 through 100 in five-point steps.
- Ranking and co-leader detection use exact values and deterministic tie-breaks.
- Observation count affects mean suspicion and prey rate but has no independent bonus or penalty; location, color, and time do not enter the score.
- Accepted state changes pass application validation before persistence.

Detailed field limits, scoring examples, UI states, and acceptance scenarios live in the product specification.

## Cross-cutting boundaries

### Public content

The AI Worklog enters the production bundle from `docs/ai-worklog/public-checkpoints.json` through a strict adapter. Repository checks validate its record count, public-safe content, immutable evidence links, and referenced Git objects. The UI does not consume chat transcripts or local filesystem paths.

### Deployment

Vercel serves the static `dist/` artifact built from `main`. The committed lockfile, pinned Node/npm versions, `vercel.json`, embedded revision metadata, and release smoke connect source to deployment. Browser privacy headers and CSP are owned by the deployment configuration and verified against built and published artifacts. The workflow and recorded preview limitation live in [Decision 0003](docs/decisions/0003-vercel-deployment.md) and [release evidence](docs/verification/release-evidence.md).

## Verification architecture

| Layer | Primary evidence |
|---|---|
| Domain | Vitest scoring, ordering, empty-input, and invariant examples |
| Application | Mutation, filter-scope, import, persistence, and recovery tests |
| Components | React Testing Library for labels, state, status, errors, and focus |
| Browser | Playwright journeys for Summary, observations, Worklog, import, reload, and release |
| Accessibility | axe, keyboard, zoom, reflow, forced-colors, and accessibility-tree checks |
| Architecture/build | Dependency fixtures, TypeScript, ESLint, formatting, tests, and Vite build through `npm run verify` |
| Deployment | Header assertions and revision-matched browser smoke |

Current audit and phase evidence are indexed in `docs/verification/`; the bounded-context entry points are mapped in [src/observation-monitoring/AGENTS.md](src/observation-monitoring/AGENTS.md).

## Decisions

- [Decision 0001: Explainable fox scoring](docs/decisions/0001-explainable-scoring.md)
- [Decision 0002: Local-first static application](docs/decisions/0002-local-first-static-app.md)
- [Decision 0003: Deploy the static product on Vercel](docs/decisions/0003-vercel-deployment.md)
