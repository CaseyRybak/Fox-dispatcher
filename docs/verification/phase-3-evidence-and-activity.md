# Phase 3 ranking, evidence, and activity verification

Status: accepted and published; consistency hardening published in `1b2bb24`; final audit corrections verified in the working tree

Evidence date: 2026-07-16

Published baseline: `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb` (`main`, equal to `origin/main` before this working-tree slice)

Published Phase 3 revision: `9834af5b48705cbf00d8207877c6880a7e6e10f5` (`main == origin/main` before the consistency follow-up)

Published consistency-hardening revision: `1b2bb24e049a0fc9aca4704ef288400a97bec4ec` (`main == origin/main` after a concurrent publication during the final audit)

## Accepted scope

Phase 3 connects every report result to one explicit observation scope:

- fox search and exact location, color, and prey filters update metrics, ranking, evidence, location activity, recent observations, and the Observations ledger together;
- the persistent label states `Отчёт по N из M наблюдений`, active filters have removable named chips, and reset restores the full source set;
- ranking rows are keyboard-selectable native buttons, expose selected state, and update the selected-fox contribution and raw-evidence inspector;
- an explicit fox selection survives weight recalculation while that fox remains in scope; an excluded fox falls back to the scoped leader without moving focus;
- every accepted filter command produces one atomic polite announcement, including the new selected fox when fallback occurs;
- chip removal focuses the next chip, then the previous chip, and finally the scope label when no chips remain;
- the evidence strip places markers by real time and direct suspicion score, lists every source record in reverse chronology, and does not imply a route;
- semantic location bars expose exact counts and percentages and can apply the same location filter as the toolbar;
- the canonical zero state preserves the input data and offers explicit filter reset;
- the stacked 320 px baseline keeps the full inspector and evidence available without horizontal overflow.

Mutation, local persistence, import/export, recovery, filter sheets, and the full-screen mobile inspector are not part of this phase.

## Focused and repository gates

The commands ran with the repository-pinned Node `24.17.0` and npm `11.13.0`.

```text
npm run test -- report-scope --run
Test Files  1 passed (1)
Tests       5 passed (5)

npm run test -- summary --run
Test Files  1 passed (1)
Tests       5 passed (5)

npm run test:run
Test Files  6 passed (6)
Tests       27 passed (27)

npm run check:boundaries
Boundary check passed: 13 source files, 1 positive fixture, 13 negative fixtures.

npm run verify
Pass: format, lint, boundaries, 27 tests, typecheck, and production build.
```

The application-layer scope tests use plain domain fixtures. They do not import the starter-data adapter, so the architectural check remains strict rather than adding a test exception.

## Reproducible production-browser gate

`npm run test:e2e` builds the application, starts Vite preview on `127.0.0.1:4173`, and drives the production output through the repository-local official Playwright CLI.

The passing result was:

```json
{
  "combinedFilterCount": 1,
  "consoleErrors": 0,
  "northClearing": {
    "foxes": 2,
    "observations": 3
  },
  "selectionPreservedAtWeight": 30,
  "viewport": 320
}
```

The automated journey verifies:

1. default scope `5 из 5`;
2. keyboard selection of `fox_002` and its evidence inspector;
3. preservation of `fox_002` while 30% prey influence makes `fox_003` the leader;
4. fox, location, color, and prey filters individually;
5. a four-filter combination and one atomic scope announcement;
6. North Clearing as 3 observations and 2 foxes;
7. next-chip focus after removing a middle chip;
8. the canonical zero state, unchanged initiating-control focus, and reset;
9. location-bar filtering and preservation of the 3-record scope in Observations;
10. 320 px document/body width within the viewport and the selected-fox evidence region;
11. zero console and page errors.

The runner discovers an existing Chrome-compatible executable from `PATH` or accepts `PLAYWRIGHT_EXECUTABLE_PATH`; it writes only an ephemeral launch config outside the repository and closes the browser and preview server after the run.

## Manual browser and visual evidence

The official Playwright CLI was also used to inspect the accessibility snapshot and visual result at 1440 px and 320 px. The accessibility snapshot was inspected interactively but was not retained as a standalone text artifact; the visual artifacts below are the durable manual evidence. Manual interaction confirmed keyboard selection, filter fallback, exact weight entry, zero recovery, location-driven filtering, and cross-route scope before the reproducible production script encoded the same critical path.

- [Desktop Summary, 1440 px](../../output/playwright/phase-3/desktop-summary-1440px.png)
- [Selected `fox_001` evidence strip](../../output/playwright/phase-3/evidence-strip-fox-001.png)
- [North Clearing, 3-of-5 scope](../../output/playwright/phase-3/north-clearing-scope.png)
- [Mobile Summary, 320 px](../../output/playwright/phase-3/mobile-summary-320px.png)
- [Mobile evidence and location activity, 320 px](../../output/playwright/phase-3/mobile-evidence-320px.png)

The visual review found that the 96% opaque sticky header allowed dark evidence text to remain faintly visible while scrolling. Phase 3 changed the header to an opaque surface and recaptured the mobile evidence image. The final measurement was:

```json
{
  "innerWidth": 320,
  "documentScrollWidth": 320,
  "bodyScrollWidth": 320
}
```

## Consistency follow-up

The post-publication audit closed the following gaps without starting Phase 4:

- ranking rows now expose latest location and the specified color swatch, and their accessible names include the visible ranking facts;
- the polite status remains mounted across destinations and replaces its message node even when consecutive commands produce identical copy;
- an empty filtered Observations ledger has the canonical explanation and an in-place reset action that focuses the restored scope;
- an active location bar toggles its own exact filter off, matching `aria-pressed` semantics;
- focused tests cover trimmed fox search, multi-record chronology and marker endpoints, persistent status, cross-route zero recovery, and location toggling;
- the production-browser script checks every individual filter announcement and cross-route zero recovery, waits for exact scope text, and guarantees preview/config cleanup even if session close fails;
- CI runs `npm run test:e2e` after the repository gate; the final focus assertion also passed a fresh real-browser run before the Phase 4 integration.

Fresh local results with Node `24.17.0` and npm `11.13.0`:

```text
npm run test -- report-scope summary navigation --run
Test Files  3 passed (3)
Tests       15 passed (15)

npm run test:run
Test Files  6 passed (6)
Tests       30 passed (30)

npm run verify
Pass: format, lint, boundaries, 30 tests, typecheck, and production build.
```

The refreshed `npm run test:e2e` production build completed, but this restricted workspace rejected the preview bind with `listen EPERM 127.0.0.1:4173`. Therefore the updated browser assertions are wired into the working-tree CI gate but are not claimed as a fresh local browser pass in this follow-up. The published Phase 3 browser result and screenshots above remain the last successful production-browser evidence.

## Handoff

Phase 3 is accepted against its repository contract and was published in `9834af5`; its consistency hardening was published in `1b2bb24`. The final focus, runner-argument, and evidence-precision corrections passed the full repository gate and a fresh production-browser flow during the Phase 4 integration. Phase 4 now publishes the real 6-checkpoint AI Worklog and reviewer README. Observation management remains Phase 5; optional import/export remains Phase 8. No Vercel connection or deployment was performed.
