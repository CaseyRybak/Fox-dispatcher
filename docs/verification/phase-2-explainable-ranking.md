# Phase 2 explainable-ranking evidence

Status: Phase 2 passed and was later published on `main` in `c53d1f1`; evidence collection itself performed no commit or push

Evidence date: 2026-07-16

Published revision: `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb`

## Verified outcome

The Summary route calculates and presents an explainable suspicion ranking from the five starter observations. The calculation uses only `suspicion_level` and `has_prey`, keeps arithmetic exact through ordering, displays decimal half-up values, and recalculates immediately when prey influence changes.

| Claim | Fresh result |
|---|---|
| Default 80/20 leader | `fox_001`, 7.8 = 6.8 direct assessment + 1.0 prey contribution |
| Changed 70/30 leader | `fox_003`, 7.9 = 4.9 direct assessment + 3.0 prey contribution |
| Exact display boundary | `fox_001` at 70/30 is exactly 7.45 and displays as 7.5 |
| Report composition | 5 observations, 4 foxes, `Северная поляна` leading with 3 of 5 |
| Interaction | Range, keyboard, exact number input, and reset keep both controls and the report synchronized |
| Announcement | Preview is silent; each committed policy change produces one concise polite status |
| Architecture | App composition consumes the application Summary API; domain scoring stays independent of React and browser APIs |
| Narrow reflow | At 320 px, document, body, and viewport widths are all 320 px |
| Production console | 0 errors, 0 warnings after the 20% -> 30% flow |

## Focused test evidence

```text
npm run test -- scoring
Test Files  1 passed (1)
Tests       11 passed (11)

npm run test -- summary
Test Files  1 passed (1)
Tests       2 passed (2)
```

The domain cases cover exact starter contributions, 70/30 leader change, half-up rounding, 0% and 100% policy boundaries, empty and singleton selections, mathematically equal fractions, equal latest times, UTF-16 fox ordering, tied locations, input-order invariance, and policy validation.

The component cases cover the default leader/ranking/calculation and the full preview/commit/exact-input/reset sequence. The committed 35% case preserves `fox_003` as leader at 8.1 and announces that final result through the single status region.

## Repository gate

```text
npm run check:boundaries
Boundary fixtures passed: 1 positive fixture, 13 negative fixtures.
Boundary check passed: 12 source files, 1 positive fixture, 13 negative fixtures.

npm run test:run
Test Files  5 passed (5)
Tests       19 passed (19)

npm run build
Exit 0: TypeScript project build and Vite production build completed.

npm run verify
Exit 0: format check, ESLint, boundary checks, tests, TypeScript, and production build.
```

The first full gate exposed an `app -> domain` policy import. Phase 2 corrected the composition boundary by exposing the default prey weight through the application Summary API; the repeated full gate then passed.

## Production-browser evidence

The final browser flow ran against `vite preview` at `http://127.0.0.1:4173/#summary` using headless Chrome:

1. The initial accessibility snapshot exposed one `h1`, the four report metrics, a semantic four-item ranking, an explainable calculation, two labeled synchronized inputs, and one empty status region.
2. Exact input changed prey influence from 20% to 30%; after blur the leader changed from `fox_001` 7.8 to `fox_003` 7.9.
3. The updated calculation exposed 4.9 from assessment and 3.0 from prey, while the status announced `Лидер изменился: fox_003, 7,9.`
4. A separate development-browser flow confirmed Arrow-key control, a leader-preserving committed 35% result, and reset to 20%.
5. Console inspection after the production flow returned 0 errors and 0 warnings.
6. At a 320 × 800 viewport, `document.documentElement.scrollWidth`, `document.documentElement.clientWidth`, and `document.body.scrollWidth` all returned 320.

Screenshots:

- [Default desktop Summary, 1440 × 1000](../../output/playwright/phase-2/desktop-summary-1440px.png)
- [Production Summary after 30% prey influence](../../output/playwright/phase-2/production-summary-30-percent.png)
- [Mobile Summary, 320 × 800](../../output/playwright/phase-2/mobile-summary-320px.png)
- [Mobile ranking at 320 px](../../output/playwright/phase-2/mobile-ranking-320px.png)

## Slice boundary

This phase does not add report-wide filters, selected-fox evidence, the time/suspicion evidence strip, location activity bars, observation mutation, persistence, import/export, or Vercel deployment. Those outcomes remain assigned to later phases, beginning with Phase 3.
