# Fox Dispatcher architecture

## Purpose

Fox Dispatcher is a static local-first web application that converts editable observation records into an explainable report. Its architecture keeps the small product proportionate while making domain facts, browser boundaries, and UI decisions easy for agents to inspect and verify.

The durable product contract lives in [docs/product-specs/fox-dispatcher.md](docs/product-specs/fox-dispatcher.md). The active delivery sequence lives in [docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md](docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md).

## System context

```text
Assignment starter JSON ─┐
Manual observation edit ─┼─> Fox Dispatcher in the browser ─> Explainable report
User JSON import ────────┘                │
                                          ├─> Versioned local storage
                                          ├─> JSON export
                                          └─> Public-safe AI Worklog

GitHub repository ─> Vercel build and preview/production deployment
```

The runtime has no server-side application, database, login, runtime AI call, or remote observation API. Vercel serves the static production artifact. Observation data remains in the browser.

## Bounded context

The application has one bounded context: `observation-monitoring`.

Core domain language:

- **Observation** — one source record with identity, fox identity, location, color, prey presence, direct suspicion assessment, and time.
- **Scoring policy** — the user-selected prey influence and its complementary direct-assessment influence.
- **Observation selection** — the current set after global filters.
- **Fox assessment** — the deterministic aggregate for one fox within the selection.
- **Report** — summary metrics, ranked assessments, location activity, latest observation, and calculation scope.
- **Evidence volume** — number of observations supporting an assessment; context rather than a scoring signal.

## Layer map

```text
src/
├── app/
│   ├── composition
│   ├── navigation
│   └── application-error-boundary
├── observation-monitoring/
│   ├── domain/
│   │   ├── observation
│   │   ├── scoring-policy
│   │   ├── assessment
│   │   └── report
│   ├── application/
│   │   ├── commands
│   │   ├── queries
│   │   ├── dashboard-state
│   │   └── ports
│   ├── adapters/
│   │   ├── starter-data
│   │   ├── json-import-export
│   │   └── local-storage
│   └── ui/
│       ├── summary
│       ├── observations
│       └── ai-worklog
└── shared/
    └── ui/
```

Dependency direction:

```text
app ──────────────────────────────┐
ui ──────────────> application ───┼─> domain
adapters ─────────> application ──┘
```

### Domain

The domain contains plain types and pure calculations:

- observation and scoring-policy values;
- filtering inputs expressed as values rather than browser controls;
- mean suspicion and prey-rate aggregation;
- exact score contributions and deterministic tie-breaks;
- unique-fox, location-activity, latest-observation, and report calculations.

Inputs and outputs are serializable values. Tests can supply arrays and policies without mounting React or browser storage.

### Application

The application layer coordinates user intent:

- initialize from starter or persisted state;
- update scoring policy;
- set and clear global report filters;
- select a fox or observation;
- add, edit, delete, undo, import, export, and reset;
- request persistence after accepted state transitions;
- convert domain reports into small UI view models.

Planned outbound ports:

```text
DashboardStateStore
  load(): StoredDashboardState | LoadFailure
  save(state): SaveResult
  clear(): ClearResult

ObservationExporter
  createFile(observations): ExportArtifact
```

JSON parsing and starter-data validation are boundary adapters that produce domain-ready observations or structured validation failures.

### Adapters

Adapters translate browser and file representations:

- bundled assignment data into validated observations;
- unknown JSON into a preview containing valid summary data or field-path errors;
- application state into a versioned local storage envelope;
- observations into a downloadable JSON array.

The storage envelope is planned as:

```text
{
  schemaVersion: 1,
  observations: Observation[],
  scoringPolicy: { preyWeight: number },
  updatedAt: string
}
```

Corrupt and unavailable storage become explicit recovery results that the application presents to the user.

### UI

React renders application view models and emits commands. The UI has three destinations:

- Summary — calculation scope, leader, ranking, evidence, scoring control, location activity, recent observations;
- Observations — filters, table/cards, editor, delete/undo, import/export, recovery;
- AI Worklog — 5-7 structured public checkpoints with evidence references.

The [interface specification](docs/design-docs/interface.md) owns composition, copy, responsive behavior, and accessibility.

## Data flow

```text
starter/persisted/imported data
        │ parse and validate
        v
application state ── commands ──> accepted next state ──> persistence
        │
        ├─ filters + scoring policy
        v
pure domain report
        │
        v
focused view models ──> React UI
```

One authoritative observation array and one scoring policy produce all derived values. The report, counts, rankings, bars, and explanations share the same calculation result.

## Domain invariants

The executable contract planned for tests includes:

- observation IDs are unique within the active dataset;
- `fox_id`, `location`, and `color` are trimmed non-empty strings;
- `has_prey` is boolean;
- `suspicion_level` is an integer from 0 through 10;
- `time` is a real 24-hour `HH:mm` value;
- prey weight is a number from 0 through 1 in 0.05 steps;
- report scores remain from 0 through 10;
- input array order does not change the ranking;
- tie-breaks are deterministic;
- observation count, location, color, and time contribute no hidden score.

Mechanical checks in the planned TypeScript and ESLint setup express dependency direction. Domain tests express scoring and data invariants.

## Public content boundary

The AI Worklog UI consumes a structured public source under `docs/ai-worklog/`. Its content model separates:

- checkpoint and question;
- AI contribution;
- human decision;
- resulting change;
- verification evidence.

The public-content check planned in Phase 7 covers secret-like values, private absolute paths, credentials, and accidental transcript dumps before the worklog enters the production bundle.

## Deployment topology

```text
GitHub branch or pull request
          │
          v
Vercel Git integration
          │ npm install from lock + npm run build
          v
       dist/
          ├─ preview deployment for review revisions
          └─ production deployment for the agreed production branch
```

Vercel's Vite defaults are the starting configuration. A repository `vercel.json` becomes an explicit artifact when tested headers, routing, or build behavior need an override. Hash-based top-level navigation keeps static reload behavior simple.

The deployment decision is recorded in [docs/decisions/0003-vercel-deployment.md](docs/decisions/0003-vercel-deployment.md).

## Verification architecture

The planned feedback layers are:

| Layer | Evidence |
|---|---|
| Domain | Vitest examples for scoring, ordering, empty input, and boundaries |
| Application | Mutation, filter-scope, import, persistence, and recovery integration tests |
| Components | React Testing Library for labels, live status, errors, selection, and view models |
| Browser | Playwright for reviewer journey, keyboard, mobile, reload, import, and Worklog |
| Accessibility | axe plus manual keyboard, zoom, reflow, and screen-reader evidence |
| Build | Typecheck, ESLint, formatting, unit tests, and Vite production build through `npm run verify` |
| Deployment | Playwright smoke against the Vercel preview and production URLs |

Fresh results and screenshots are recorded under `docs/verification/` during their authorized phases.
