# Phase 6 accessibility and responsive evidence

Date: 2026-07-17

Status: Phase 6 complete and published in `579b146`; final accessibility hardening published in `a08d2d8`

## Outcome

The implemented reviewer journey remains readable and operable across the planned viewports and keyboard flows. The desktop observation table is preserved; widths through 767 CSS px receive a purpose-built field-card ledger with an explicit sort control. The editor and starter reset are native modal dialogs with accessible names, safe initial focus, Escape behavior, and trigger-focus restoration. At widths through 640 px the primary destinations move to a bottom navigation dock with scroll padding that protects focused controls.

The visual treatment keeps the established field-ledger direction: exact observation facts, IDs, time, and suspicion stay primary; the orange record edge and score capsule support the content without replacing text.

## Published automated evidence

| Command | Result |
|---|---|
| `npm run test:run -- accessibility manage-observations` | 2 files, 22 tests passed: dialog naming, field-error connections, mobile card semantics/sorting, Browser Back guard, reset focus, and Phase 5 mutation/focus regressions |
| `npm run test:a11y` | 6 axe scans, 0 targeted WCAG A/AA violations, 0 console/page errors |
| `npm run test:e2e:responsive-keyboard` | production build and browser journey passed across five viewport/orientation cases |
| `npm run verify` | formatting, lint, architecture boundaries, public-content checks, Worklog links, 12 files / 72 unit-component tests, typecheck, and production build passed |

The published Phase 6 baseline axe gate scanned these concrete states:

1. Summary at 1440x900.
2. Observations desktop table.
3. New-observation modal dialog.
4. Starter-reset alert dialog.
5. AI Worklog.
6. Observations mobile cards at 390x844.

Automated scans cannot prove every WCAG success criterion. The browser journey below supplies the interaction and reflow evidence that axe does not cover.

## Browser and responsive matrix

| Viewport | Result |
|---|---|
| 1440x900 | desktop table, hierarchy, actions, and footer fit without document overflow |
| 768x1024 | tablet navigation and desktop semantic ledger remain usable without document overflow |
| 390x844 | mobile field cards, explicit sorting, modal editor, and bottom navigation are usable without document overflow |
| 320x800 | WCAG reflow width retains all record facts and actions without horizontal document scrolling |
| 844x390 | landscape layout retains the desktop ledger and navigation without document overflow |

Artifacts:

- [desktop observations](../../output/playwright/phase-6/observations-desktop-1440px.png)
- [tablet observations](../../output/playwright/phase-6/observations-tablet-768px.png)
- [mobile observations](../../output/playwright/phase-6/observations-mobile-390px.png)
- [320 px reflow](../../output/playwright/phase-6/observations-reflow-320px.png)
- [landscape observations](../../output/playwright/phase-6/observations-landscape-844px.png)
- [mobile editor](../../output/playwright/phase-6/observation-editor-mobile-390px.png)
- [text spacing](../../output/playwright/phase-6/text-spacing-390px.png)
- [200% scale/reflow](../../output/playwright/phase-6/summary-200-percent-reflow.png)
- [forced colors](../../output/playwright/phase-6/forced-colors-summary.png)

## Keyboard and focus results

- The skip link activates main-content focus without changing the current hash destination.
- Opening the editor focuses `Лиса`; its dialog has an accessible name and `aria-modal=true`.
- Escape from a dirty editor opens the discard confirmation and focuses `Продолжить редактирование`, the non-destructive action.
- Browser Back follows the same dirty-editor guard and stays on `#observations`; after discard, a later Back action remains available for normal destination history.
- Tab and Shift+Tab stay inside the discard confirmation; Escape returns to the editor field after inert content becomes active again.
- Confirming discard returns focus to `Добавить наблюдение`.
- Reset opens a named alert dialog, focuses `Оставить текущие данные`, closes with Escape, and returns focus to its trigger.
- A focused middle-card edit action is scrolled above the fixed mobile navigation; the dock does not obscure it.
- Existing navigation component tests continue to prove Russian `lang`, destination title, `aria-current`, route-heading focus after navigation, and browser back/forward synchronization.

## Resize, preferences, and text alternatives

- The 320 CSS px reflow check has no document overflow. Separately, a 720 CSS px layout at 200% Chromium page scale retains the primary Summary control; the scale screenshot is visual evidence, not a second CSS-overflow measurement.
- The WCAG text-spacing override (1.5 line height, 0.12 em letter spacing, 0.16 em word spacing, and 2 em paragraph spacing) produces no horizontal document overflow at 390 px.
- `prefers-reduced-motion: reduce` changes root scrolling to `auto` and reduces transitions to `0.01ms`.
- `forced-colors: active` is emulated successfully and preserves the focused destination and readable browser-rendered controls.
- axe includes its automated normal-mode contrast rules in every targeted scan. Because axe-core does not automate WCAG 1.4.11 control-boundary contrast, the responsive browser gate separately computes the mobile sort and editor-input border contrast and requires at least 3:1.
- Charts and status graphics continue to expose exact text or accessible names; decorative signals remain `aria-hidden`.

## Assistive-technology boundary

Chromium's accessibility tree was inspected in the production build and contains the named primary navigation, `Самая подозрительная лиса` heading, and `Влияние добычи` slider. This is useful screen-reader-oriented evidence, but it is not a native screen-reader session.

NVDA and VoiceOver are unavailable in the Linux execution environment, and Orca is not installed. No native screen-reader pass is claimed. A final manual NVDA, VoiceOver, or Orca smoke remains a transparent release-environment check rather than a hidden completion claim.

## Residual release boundary

- Phase 7 still owns the Vercel production URL, deployed privacy/request assertions, and final public smoke.
- The Phase 6 implementation and this evidence were published in `579b146`; the repository-map publication update was published in `6200eb9`.

## 2026-07-17 consistency follow-up

The consistency follow-up aligns the mobile sort control with all desktop fields and both directions, makes the editor history marker idempotent across responsive rerenders and React Strict Mode effect replay, introduces a control-boundary token above the WCAG 1.4.11 3:1 threshold, and adds explicit increased-contrast and forced-colors styles. The responsive gate now exercises keyboard scoring and Worklog navigation, mobile sorting, focus-driven dock avoidance, control-border contrast, 200% page-scale operation, increased contrast, and forced-colors focus. The axe gate expands from the six-state published baseline to ten states by adding the existing-fox color notice, validation errors, dirty-discard confirmation, and the mobile editor, and both Phase 6 browser commands are now CI steps.

Fresh focused component evidence passes 2 files / 23 tests, including the full mobile sort contract and a Summary → Observations → editor-rerender → Summary history regression. The full `npm run verify` gate passes with 13 files / 77 tests plus formatting, lint, boundaries, public-content, Worklog-link, typecheck, and production-build checks; `git diff --check` is clean.

Both expanded Phase 6 browser runners also pass locally when the available Chrome executable is supplied explicitly. `npm run test:a11y` reports zero violations and zero console errors across ten states: Summary, Observations, the editor, the existing-fox color notice, validation errors, dirty-discard confirmation, starter reset, AI Worklog, mobile cards, and the mobile editor. `npm run test:e2e:responsive-keyboard` passes at 1440×900, 768×1024, 390×844, 320×800, and 844×390; it records 3.74:1 control-boundary contrast, exercises all mobile sort dimensions, keyboard recalculation and Worklog navigation, verifies 200% page-scale operation, increased contrast, forced-colors focus, reduced motion, text spacing, dialog focus, and the Chromium accessibility tree, with zero console errors. During this fresh run, the validation-summary links were raised to the WCAG 2.2 minimum target height and the browser scenarios were made deterministic around route rendering, dialog transitions, nested Worklog lists, and scroll position.
