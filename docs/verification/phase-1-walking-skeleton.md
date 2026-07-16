# Phase 1 walking-skeleton evidence

Status: historical Phase 1 snapshot passed; the current tree is not a Phase 1-only verified state

Evidence date: 2026-07-16

Consistency follow-up: [Phase 1 consistency audit](phase-1-consistency-audit.md) records scoped corrections and a fresh green repository gate. The later [Phase 2 evidence](phase-2-explainable-ranking.md) reconciles and replaces the then-concurrent Summary UI as current browser evidence. Evidence collection itself performed no commit or push; the completed Phase 1/2 repository state was later published in `c53d1f1`.

## Verified outcome

Phase 1 boots as a production-built React application and renders the unmodified assignment fixture through explicit adapter, application, domain, and UI seams. It contains the walking skeleton only: explainable scoring and ranking remain owned by Phase 2.

| Claim | Evidence | Result |
|---|---|---|
| Reproducible toolchain | `.nvmrc`, `.node-version`, `packageManager`, engines, exact dependencies, and `package-lock.json` | Node `24.17.0`, npm `11.13.0` |
| Exact starter boundary | Zod fixture test checks every field of all five records | 5 records, 4 unique `fox_id` values |
| Application shell | React component tests render Summary, Observations, and AI Worklog | Pass |
| Hash navigation | Focused test checks Russian `lang`, destination title, `aria-current`, `h1` focus, Back, and Forward | Pass |
| Dependency direction | Historical ESLint run checked the full source graph; executable fixtures included one allowed and four forbidden imports | Pass for the recorded snapshot; current gate is expanded in the consistency audit |
| CI parity | GitHub Actions runs `npm ci` and `npm run verify` under `.nvmrc` | Configured |
| Production artifact | TypeScript project build plus Vite production build | `dist/` produced |
| Browser shell | Playwright opens the production preview with zero console errors and reaches all three destinations | Pass |
| Narrow reflow | Summary and Worklog measured at a 320 px viewport | document and body widths both equal 320 px |

## Fresh command evidence

```text
npm run test -- navigation
Test Files  1 passed (1)
Tests       1 passed (1)

npm run check:boundaries
Boundary check passed: 13 source files, 1 positive fixture, 4 negative fixtures.
(The historical script mislabeled tests/setup as production; the consistency audit corrected the filter.)

npm run test:run
Test Files  3 passed (3)
Tests       5 passed (5)

npm run verify
Exit 0: format check, ESLint, boundary checks, tests, TypeScript, production build.

npm ci
Exit 0: 249 packages installed from the lockfile.
```

## Browser evidence

- [Desktop Summary, 1440 × 1000](../../output/playwright/phase-1/desktop-summary.png)
- [Mobile Summary, 320 × 800](../../output/playwright/phase-1/mobile-summary-320px.png)
- Production-preview title follows the active destination: `Сводка — Лисий диспетчер`, `Наблюдения — Лисий диспетчер`, or `AI Worklog — Лисий диспетчер`.
- Console inspection after the final build: 0 errors, 0 warnings.
- Navigation inspection: `#summary`, `#observations`, and `#worklog` each render one focused destination `h1`; current-link state follows the hash, and Back/Forward restore the corresponding title and focused heading.
- Reflow measurement at 320 px: `window.innerWidth`, `document.documentElement.scrollWidth`, and `document.body.scrollWidth` are all `320`.

The screenshots demonstrate the Phase 1 shell, not the final ranking interface. Full keyboard, zoom, contrast, axe, and screen-reader evidence remains assigned to later accessibility and release phases.
