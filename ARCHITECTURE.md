# Fox Dispatcher architecture

## Purpose

Fox Dispatcher is a static local-first web application that converts editable observation records into an explainable report. Its architecture keeps the small product proportionate while making domain facts, browser boundaries, and UI decisions easy for agents to inspect and verify.

The durable product contract lives in [docs/product-specs/fox-dispatcher.md](docs/product-specs/fox-dispatcher.md). The active delivery sequence lives in [docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md](docs/exec-plans/active/2026-07-16-fox-dispatcher-implementation.md).

## Delivery status

- The published `c53d1f1` revision contains the complete Phase 1 shell and Phase 2 scoring/report slice.
- Phase 3 was published on `main` in `9834af5`: application report filtering, selected evidence, location activity, recent observations, deterministic chip focus, and shared Summary/Observations scope passed focused, full, production-browser, and narrow-reflow gates. Its consistency hardening and rebalanced plan were published in `1b2bb24`; the remaining final-audit corrections were published with Phase 4 in `699d457`.
- [Phase 3 evidence](docs/verification/phase-3-evidence-and-activity.md) is the report-interaction acceptance record.
- Phase 4 is complete and published in `699d457`: a Zod boundary parses the structured public Worklog, the composition root injects it into the UI, public-content/link checks protect the bundle, and the reviewer README describes the current product honestly.
- Phase 5 was published in `0021c6d`, and its consistency hardening was published in `df434c9`: atomic observation commands, injected ID generation, delete/undo/reset, and strict browser persistence feed the existing report path from one authoritative state.
- Phase 6 targeted responsive/accessibility quality was published in `579b146`, with the repository-map publication update in `6200eb9`. The remaining core slice is Phase 7 Vercel submission; Phase 8 import/export and advanced recovery are optional extensions.

Sections below use **implemented** for published behavior and focused-tested working-tree follow-ups, and **planned** for later ports, commands, adapters, public content, and deployment policy.

## System context

```text
Assignment starter JSON ─┐
Manual observation edit ─┼─> Fox Dispatcher in the browser ─> Explainable report
Optional JSON import ───┘                │
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

The application layer coordinates user intent. Summary queries, scoring-policy updates, report filters, selected-fox fallback, view-model translation, and the following proportionate mutation/persistence commands are implemented:

- initialize from starter or persisted state;
- update scoring policy;
- set and clear global report filters;
- select a fox or observation;
- add, edit, delete, undo, and reset;
- request persistence after accepted state transitions;
- convert domain reports into small UI view models.

The initially selected fox is the current leader. Explicit selection survives recalculation while the fox remains in scope; otherwise the application selects the new leader or no fox for an empty report. Automatic fallback updates status without moving focus.

Implemented core outbound ports:

```text
DashboardStateStore
  load(): Missing | ValidState | InvalidState | Unavailable
  save(state): SaveResult
  clear(): ClearResult

ObservationIdGenerator
  create(): ObservationId
```

Optional Phase 8 adds `ObservationImportParser` and `ObservationExporter` ports plus advanced storage-recovery results if that extension is separately authorized.

JSON parsing and starter-data validation are boundary adapters that produce domain-ready observations or structured validation failures.

The production ID adapter creates `obs_<uuid>` values through the secure browser `crypto.randomUUID()` API. The application validates the generated value against the normal 64-character ID boundary and the active dataset before accepting an add command; tests inject deterministic IDs. Generation or collision failure leaves state unchanged and returns a form-level error.

### Adapters

Adapters translate browser and file representations:

- bundled assignment data into validated observations;
- structured public Worklog JSON into immutable application checkpoint values;
- application state into a small versioned local storage envelope;
- optionally in Phase 8, unknown JSON into a preview and observations into a downloadable JSON array.

The implemented storage envelope is:

```text
{
  schemaVersion: 1,
  observations: Observation[],
  scoringPolicy: { preyWeightPercent: number },
  updatedAt: string
}
```

The stable key is `fox-dispatcher.dashboard`; the envelope, not the key name, carries the schema version. Phase 5 parses version `1`, validated observations and policy, and a UTC ISO 8601 `updatedAt`. Missing or invalid storage falls back explicitly without overwriting the current in-memory session; unavailable or failed saves expose an honest memory-only status. Raw-value copying, future-version recovery, and the extended failure matrix belong only to optional Phase 8.

Optional Phase 8 file and pasted imports will be rejected above 2 MiB of UTF-8 before `JSON.parse`, then checked against the 1000-record and field limits. Its planned `ObservationImportParser` returns a preview or field paths rooted at the input array, such as `[2].suspicion_level`; it never mutates application state.

### UI

React renders application view models and emits commands. The UI has three destinations:

- Summary — calculation scope, leader, ranking, evidence, scoring control, location activity, recent observations;
- Observations — filters, table/cards, editor, delete/undo, starter recovery, and optional Phase 8 import/export;
- AI Worklog — 5-7 structured public checkpoints with evidence references.

The [interface specification](docs/design-docs/interface.md) owns composition, copy, responsive behavior, and accessibility.

The composition root owns the accepted observation array and scoring policy, delegates validation and immutable transitions to application commands, and sends each accepted state through the injected persistence adapter. Filters, selection, undo, announcements, and static Worklog content remain focused React state; every report is derived from the same accepted observation array.

## Data flow

```text
starter/persisted data (plus optional Phase 8 imported data)
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

The Phase 4 public-content check covers secret-like values, private absolute paths, credentials, and accidental transcript dumps before the Worklog enters the production bundle. The schema boundary requires 5-7 strict records and freezes accepted values; a repository-native link check resolves every revision/path pair through Git objects.

Each evidence reference has `label`, `kind`, and a public HTTPS `href` pinned to a GitHub repository revision or a public Vercel artifact. Through Phase 4 the accepted source uses only revision-pinned GitHub blobs, which the build-time check resolves through local Git objects. If Phase 7 adds a Vercel artifact to the Worklog, that slice must first add an exact host/URL contract and its own resolvability check; a mutable or wildcard Vercel URL is not accepted implicitly. Build-time checks reject local filesystem paths, unsafe URL schemes, unresolved repository links, and unpinned mutable evidence where a revision is available.

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

Production headers enforce the browser boundary: self-hosted static resource directives, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosn`, and a minimal `Permissions-Policy`. Phase 7 tests the minimum policy supported by the actual built bundle and deployed responses.

The current Summary implementation uses React `style` attributes for data-driven CSS custom properties on contribution, evidence, and location bars. Before finalizing the Phase 7 CSP, implementation either moves those values to a compatible representation or explicitly allows and records the narrow style-attribute exception required by the actual bundle. The release gate must not claim a self-only style policy that the built UI violates.

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
