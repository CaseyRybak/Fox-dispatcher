# Fox Dispatcher architecture

## Purpose

Fox Dispatcher is a static local-first web application that converts editable observation records into an explainable report. Its architecture keeps the small product proportionate while making domain facts, browser boundaries, and UI decisions easy for agents to inspect and verify.

The durable product contract lives in [docs/product-specs/fox-dispatcher.md](docs/product-specs/fox-dispatcher.md). The active delivery sequence lives in [docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md](docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md).

## Delivery status

- The published `c53d1f1` baseline contains the complete Phase 1 shell and Phase 2 scoring/report slice.
- Phase 3 is complete but uncommitted in the working tree: application report filtering, selected evidence, location activity, recent observations, deterministic chip focus, and shared Summary/Observations scope pass focused, full, production-browser, and narrow-reflow gates.
- [Phase 3 evidence](docs/verification/phase-3-evidence-and-activity.md) is the architectural acceptance record. Phases 4-8 remain target architecture rather than current runtime behavior.

Sections below use **implemented** for the published or focused-tested working-tree behavior and **planned** for later ports, commands, adapters, public content, and deployment policy.

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

## Target layer map

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
app (composition root) ──> ui
        │                 └─> application ──> domain
        └───────────────> adapters ─────────> application
```

Allowed imports are explicit:

| Source | May import | Must not import |
|---|---|---|
| `domain` | domain modules | React, browser APIs, application, adapters, UI, app |
| `application` | domain, application modules | React, browser APIs, concrete adapters, UI, app |
| `adapters` | application port types | UI, app, direct domain modules |
| `ui` | application API/view models, `shared/ui` | concrete adapters, browser persistence, domain calculations |
| `shared/ui` | other shared presentation modules | observation-monitoring, app |
| `app` | UI, application bootstrap, concrete adapters | new domain rules or duplicated calculations |

`app` is the only composition root: it creates concrete adapters and injects them into the application boundary. ESLint restrictions plus `npm run check:boundaries` enforce this matrix against production source and positive/negative fixtures.

### Domain

The domain contains plain types and pure calculations:

- observation and scoring-policy values;
- filtering inputs expressed as values rather than browser controls;
- mean suspicion and prey-rate aggregation;
- exact score contributions and deterministic tie-breaks;
- unique-fox, location-activity, latest-observation, and report calculations.

Inputs and outputs are serializable values. Tests can supply arrays and policies without mounting React or browser storage.

Scores are represented as integer fractions rather than floating-point display values:

```text
scoreNumerator = sumSuspicion * (100 - weightPercent)
               + preyCount * 10 * weightPercent
scoreDenominator = observationCount * 100
```

Score and mean comparisons use safe-integer cross multiplication under the 1000-record boundary. Decimal display uses half-up rounding to one place. Chronology uses `time` descending then observation `id` ascending; string tie-breaks use locale-independent UTF-16 ordinal order. Location activity uses count descending then location name ascending.

### Application

The application layer coordinates user intent. Summary queries, scoring-policy updates, report filters, selected-fox fallback, and view-model translation are implemented through Phase 3; the following mutation and persistence commands remain planned:

- initialize from starter or persisted state;
- update scoring policy;
- set and clear global report filters;
- select a fox or observation;
- add, edit, delete, undo, import, export, and reset;
- request persistence after accepted state transitions;
- convert domain reports into small UI view models.

The initially selected fox is the current leader. Explicit selection survives recalculation while the fox remains in scope; otherwise the application selects the new leader or no fox for an empty report. Automatic fallback updates status without moving focus.

Planned outbound ports:

```text
DashboardStateStore
  load(): Missing | ValidState | CorruptState | UnsupportedVersion | Unavailable
  save(state): SaveResult
  clear(): ClearResult

ObservationImportParser
  preview(rawText): ImportPreview | ImportFailure

ObservationExporter
  createFile(observations): ExportArtifact

ObservationIdGenerator
  create(): ObservationId
```

JSON parsing and starter-data validation are boundary adapters that produce domain-ready observations or structured validation failures.

The production ID adapter will create `obs_<uuid>` values through the secure browser `crypto.randomUUID()` API. The application validates the generated value against the normal 64-character ID boundary and the active dataset before accepting an add command; tests inject deterministic IDs. Generation or collision failure leaves state unchanged and returns a form-level error.

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
  scoringPolicy: { preyWeightPercent: number },
  updatedAt: string
}
```

The stable key is `fox-dispatcher.dashboard`; the envelope, not the key name, carries the schema version. It is parsed strictly: version `1`, validated observations and policy, UTC ISO 8601 `updatedAt`, and no unknown fields. `corrupt`, `unsupported-version`, and `unavailable` are distinct recovery results. Corrupt or future-version raw values are not overwritten and autosave stays blocked until an explicit recovery choice; a save failure keeps the accepted state in memory and exposes memory-only status.

File and pasted imports are rejected above 2 MiB of UTF-8 before `JSON.parse`, then checked against the 1000-record and field limits. `ObservationImportParser` returns a preview or field paths rooted at the input array, such as `[2].suspicion_level`; it never mutates application state.

### UI

React renders application view models and emits commands. The UI has three destinations:

- Summary — calculation scope, leader, ranking, evidence, scoring control, location activity, recent observations;
- Observations — filters, table/cards, editor, delete/undo, import/export, recovery;
- AI Worklog — 5-7 structured public checkpoints with evidence references.

The [interface specification](docs/design-docs/interface.md) owns composition, copy, responsive behavior, and accessibility.

Through Phase 3 the composition root uses focused React state for destination, policy, filters, selection, and announcement. Phase 4 may consolidate mutation, undo, recovery, and persistence transitions behind a reducer or equivalent application state machine; the architectural requirement is one accepted-state transition path, not a particular React hook.

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
- prey weight percent is an integer from 0 through 100 in 5-point steps;
- report scores remain from 0 through 10;
- input array order does not change the ranking;
- tie-breaks are deterministic;
- exact `7.45` displays as `7.5` with decimal half-up rounding;
- equal-time observations and tied location counts have deterministic secondary order;
- observation count, location, color, and time contribute no hidden score.

TypeScript, ESLint restrictions, and executable boundary fixtures express dependency direction. Domain tests grow the scoring and data-invariant contract phase by phase.

## Public content boundary

The AI Worklog UI consumes a structured public source under `docs/ai-worklog/`. Its content model separates:

- checkpoint and question;
- AI contribution;
- human decision;
- resulting change;
- verification evidence.

The public-content check planned in Phase 7 covers secret-like values, private absolute paths, credentials, and accidental transcript dumps before the worklog enters the production bundle.

Each evidence reference has `label`, `kind`, and a public HTTPS `href` pinned to a GitHub repository revision or a public Vercel artifact. Build-time checks reject local filesystem paths, unsafe URL schemes, unresolved repository links, and unpinned mutable evidence where a revision is available.

## Deployment topology

```text
GitHub branch or pull request
          │
          v
Vercel Git integration
          │ npm ci + npm run build
          v
       dist/
          ├─ preview deployment for review revisions
          └─ production deployment for the agreed production branch
```

Vercel's Vite defaults are the starting configuration. A repository `vercel.json` becomes an explicit artifact when tested headers, routing, or build behavior need an override. Hash-based top-level navigation keeps static reload behavior simple.

Vercel installs the committed lockfile with `npm ci` under repository-pinned Node and npm versions. The production branch is `main`. One release-candidate commit SHA receives the preview smoke first; after authorization, `main` is fast-forwarded to that exact commit. Production smoke begins only when Vercel reports the same Git SHA for production. A merge, rebuild from a different commit, or changed tree creates a new candidate and requires a new preview smoke.

Production headers enforce the browser boundary: self-hosted static resource directives, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and a minimal `Permissions-Policy`. Phase 8 tests the exact policy against the built bundle and deployed responses.

The current Summary implementation uses React `style` attributes for data-driven CSS custom properties on contribution, evidence, and location bars. Before fixing the Phase 8 CSP, implementation must either move those values to a CSP-compatible representation or explicitly allow the minimum required style attributes and record that tested exception. The release gate must not claim a self-only style policy that the built UI violates.

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
| Deployment | Header assertions and Playwright smoke against SHA-matched Vercel preview and production URLs |

Fresh results and screenshots are recorded under `docs/verification/` during their authorized phases.
