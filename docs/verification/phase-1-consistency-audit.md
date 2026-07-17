# Phase 1 consistency audit

Status: historical Phase 1 corrections and repository-wide gate passed; the later authorized Phase 2 reconciled the concurrent scoring work

Evidence date: 2026-07-16

Runtime: Node `24.17.0`, npm `11.13.0`

Authority boundary: this audit performed no commit, push, deployment, or Phase 2 implementation.

Publication follow-up: the core corrected Phase 1 and verified Phase 2 state was later published on `main` in `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb`. The `test:browser` automation and Node-type alignment additions recorded below are a later uncommitted follow-up, not part of that revision. The audit-time chronology remains historical evidence.

## Outcome

The Phase 1 walking-skeleton design is consistent with the implementation plan: the exact starter fixture crosses adapter, application, domain, and UI boundaries; the three hash destinations render; the pinned build succeeds; and Phase 2 behavior was not part of the reviewed Phase 1 snapshot.

The audit found and corrected four Phase 1 gaps:

1. the skip link shared the routing hash and changed Observations or Worklog to Summary;
2. boundary patterns missed directory-root imports, `app -> domain`, shared-layer isolation, browser APIs in inner layers, and browser persistence in UI;
3. the muted token differed from the interface contract and failed contrast on the canvas, while metric and table labels failed on their tinted surface;
4. the production artifact redistributed runtime code and fonts without bundled MIT/OFL notices.

During the audit, unrelated concurrent changes introduced scoring, ranking, a policy control, and Phase 2 tests. They were not created or reviewed as part of this audit. The strengthened boundary gate initially rejected their direct `app -> domain` import; the concurrent work later exposed the default policy through the application layer, and the repository-wide gate passed. At that point the plan still required a direct Phase 2 command, so this audit neither accepted nor removed those changes.

The owner subsequently authorized Phase 2. The scoring work was then reviewed against its exact contract, completed through test-first feedback, verified in a production browser, and recorded in [Phase 2 evidence](phase-2-explainable-ranking.md).

## Traceability

| Phase 1 claim | Phase 1 evidence | Result at the recorded boundary |
|---|---|---|
| Pinned toolchain | `.nvmrc`, `.node-version`, `packageManager`, Node 24 type definitions, exact lockfile; commands below | Pass |
| Exact starter fixture | focused adapter test checks all fields, five records, four fox IDs | Pass |
| Accessible hash navigation | focused test covers all destinations, language, title, current link, heading focus, Back/Forward, and skip-link route preservation | Pass |
| Layer boundaries | twelve production source files plus one positive and thirteen negative fixtures, including root imports, shared isolation, and browser globals | Pass |
| Production build | TypeScript and Vite build on the pinned runtime | Pass |
| Reproducible browser smoke | `npm run test:browser` builds, starts the production preview, and checks the three routes in Chrome | Added after the historical gate; sandbox execution is socket-blocked |
| Full repository gate | `npm run verify` | Passed for the corrected Phase 1/2 snapshot; current Phase 3 blockers are recorded separately |

## Changes made by the audit

- `src/app/navigation.test.tsx` reproduces the skip-link/hash collision and expands Back/Forward assertions.
- `src/observation-monitoring/ui/ApplicationShell.tsx` focuses the current main region through a React ref without changing the route hash.
- `eslint.config.js`, `scripts/check-boundaries.mjs`, and `scripts/boundary-fixtures/` enforce the documented matrix and report fixture evidence even when production code fails.
- `src/app/styles.css` restores `moss-muted` to `#607269` and uses `pine-structure` on tinted metric/table backgrounds.
- `scripts/run-phase-1-browser-smoke.mjs` and `scripts/phase-1-browser-smoke.js` make the Phase 1 browser checks reproducible through `npm run test:browser`.
- `@types/node` now uses the Node 24 definitions branch, matching the pinned Node 24 runtime instead of exposing Node 26-only APIs to TypeScript.

Contrast calculations after the change:

```text
#607269 on #eef3ef: 4.552:1
#607269 on #fcfefb: 5.041:1
#24483c on #e5ede8: 8.519:1
```

## Fresh command evidence

```text
After activating the versions pinned by .node-version and packageManager:

node --version
v24.17.0

npm --version
11.13.0

npm run format:check
Pass: all matched files use Prettier style.

npm run test:run -- \
  src/app/App.test.tsx \
  src/app/navigation.test.tsx \
  src/observation-monitoring/adapters/starter-data/starter-observations.test.ts
Test Files  3 passed (3)
Tests       6 passed (6)

npm run test:run
Test Files  5 passed (5)
Tests       19 passed (19)

npm run build
Exit 0: TypeScript and Vite production build passed.

Exit 0: production notice matches its source.

npm run check:boundaries
Boundary fixtures passed: 1 positive fixture, 13 negative fixtures.
Boundary check passed: 12 source files, 1 positive fixture, 13 negative fixtures.

npm run verify
Exit 0: formatting, lint, boundaries, tests, TypeScript, and production build passed.
```

An offline production-dependency audit reported zero cached vulnerabilities. It is not a substitute for a fresh registry advisory check.

## Browser and scope boundary

The existing Phase 1 screenshots remain valid evidence for the original walking-skeleton snapshot, but not for the concurrently changed Phase 2 UI. This sandbox did not permit opening a new local listening socket, so the audit did not claim a fresh browser screenshot or console/network pass. Repository-native smoke automation is now available as `npm run test:browser`; it checks all three destinations, navigation state and history, the skip link, the five-record/four-fox starter fixture, console errors, and page overflow at 320 px. Run it in a normal local or CI environment with Chrome installed.

Bottom navigation, mobile observation cards, complete axe/keyboard/zoom/text-spacing/screen-reader evidence, and final visual polish remain assigned to Phase 6. They are not reclassified as missing Phase 1 behavior.

The current working tree is no longer the green Phase 1/2 snapshot: the in-progress Phase 3 CSS formatting and an application-test adapter import make `npm run verify` fail. [Phase 3 evidence](phase-3-evidence-and-activity.md) owns those current blockers; they do not retroactively change this historical audit result.

## Assessment

- Phase 1 implementation after the scoped corrections: **9/10** — contract-aligned with stronger routing, architecture, contrast, and artifact hygiene.
- Current working tree against Phase 1 technical checks: **PASS** — the repository-wide gate is green.
- Working tree against the authorized phase sequence at audit time: **7/10** — Phase 2-like files and UI existed while Phase 2 was documented as pending and were not reviewed by this audit.

That audit-time gap is closed by the later Phase 2 authorization and its fresh focused, full-gate, desktop, production-preview, and 320 px evidence.
