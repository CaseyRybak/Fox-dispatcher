# Audit corrections verification

Date: 2026-07-17

Scope: follow-up corrections for exact score explanation, import provenance, form semantics, numeric policy editing, dataset-empty recovery, compact result context, and current release documentation. The changes are verified in the working tree and are not claimed as deployed.

## Accepted behavior

- Exact rational contributions and the exact total are formatted from the domain fractions. Finite values remain exact decimals; repeating values remain reduced fractions such as `4/15 + 2/3 = 14/15`, with the separate compact result `0,9`.
- Ranking color context shows the latest color and explicitly names multiple observed values.
- Imported `time` strings are trimmed before strict `HH:MM` validation.
- Import text, file identity, and measured byte count form one provenance state. A failed read cannot relabel or resize an older draft, removes preview/replacement, and blocks validation until explicit source recovery.
- The numeric prey-weight alternative accepts sequential draft editing and commits only integer values from 0 to 100 in steps of 5 on blur or Enter.
- Range-keyboard changes remain immediate previews but produce one committed live-region message on blur instead of one message per arrow; Enter in the numeric alternative retains focus.
- Observation fields expose native required semantics and a visible instruction. Import validation errors are programmatically associated with the relevant source/file control.
- Summary distinguishes an empty dataset from a zero-result filter and routes the observer to the existing add/import/starter-recovery actions.
- Compact Summary keeps the formula status in the header and shows the recalculated leader and score beside the policy control.
- Current documents identify `675a6aa86ade70b8daaafb08d046541e4e4f2ba2` as the public baseline and explicitly exclude these working-tree corrections from the deployment claim.

## Test-first evidence

Each behavior slice was first observed failing in a focused test, then passed after the implementation:

```text
npm run test:run -- summary import-export
2 files passed · 19 tests passed

npm run test:run -- import-recovery accessibility manage-observations
3 files passed · 33 tests passed

npm run test:run -- summary
1 file passed · 13 tests passed
```

The final complete suite result is:

```text
npm run test:run
16 files passed · 108 tests passed
```

The regression suite includes the repeating-fraction example, multiple colors, trimmed imported time, failed-file provenance, import error descriptions, required controls, sequential/invalid number drafts, compact result changes, true-empty routing, and the existing neighboring behavior.

## Repository gate

Using the pinned Node 24 toolchain:

```text
npm run verify
exit=0
```

The gate passed formatting, ESLint including React guidance, architecture boundaries, public-content and Worklog-link checks, all 108 tests, type checking, production build, and deployment-policy inspection. No dependency changed.

## Production-browser evidence

All local commands rebuilt the production artifact and used the repository Playwright CLI runner.

### Summary and exact policy

```text
npm run test:e2e
exit=0
```

Result: the 20→30 flow selected Лиса 3 at `7,9`, explicit selected-fox evidence remained stable, combined and zero-result filters recovered correctly, 320 px had no horizontal overflow, and the browser reported zero errors. The accepted 320 px screenshot visibly contains `Расчёт 70/30` in the header and `Текущий лидер · Лиса 3 · 7,9 из 10` beside the policy.

### Import and recovery

```text
npm run test:e2e:import-recovery
exit=0
```

Result: invalid input remained atomic, valid two-record import persisted after reload, export downloaded the deterministic filename, future-version raw storage was preserved and recovered explicitly, four axe scans reported zero violations, 320 px had no overflow, requests stayed on the preview origin, and the browser reported zero errors.

### Accessibility

```text
npm run test:a11y
exit=0
```

The first run correctly rejected `aria-required` on a fieldset. Native radio `required` semantics were retained and the invalid ARIA attribute was removed. The accepted rerun completed nine zero-violation axe scans across desktop/mobile pages, editor, validation, discard, and reset states with zero browser errors.

### Responsive and keyboard

```text
npm run test:e2e:responsive-keyboard
exit=0
```

Result: 1440×900, 768×1024, 390×844, 320×800, and 844×390 passed without overflow; keyboard skip/editor/discard/reset flows, mobile sorting, 200% scale, text spacing, reduced motion, increased contrast, forced colors, control-boundary contrast, and the Chromium accessibility tree passed with zero browser errors.

Visual inspection covered:

- [320 px Summary](../../output/playwright/phase-3/mobile-summary-320px.png)
- [390 px required-field editor](../../output/playwright/phase-6/observation-editor-mobile-390px.png)
- [320 px import dialog](../../output/playwright/phase-8/import-dialog-320px.png)

## Public baseline check

The mutable production alias was checked without deploying this working tree:

```text
FOX_SMOKE_BASE_URL=https://fox-dispatcher-brown.vercel.app \
FOX_SMOKE_EXPECTED_REVISION=675a6aa86ade70b8daaafb08d046541e4e4f2ba2 \
PLAYWRIGHT_EXECUTABLE_PATH=<chrome> npm run test:e2e:release
exit=0
```

It returned HTTP 200 and the exact embedded revision, verified privacy headers, all three mobile routes, persisted local editing, seven Worklog checkpoints, same-origin static GET requests, no overflow, and zero browser errors. This proves the documentation baseline only; it does not imply that the audit corrections in this note are public.

## Honest boundary

A native NVDA, JAWS, VoiceOver, or TalkBack session remains unavailable. Axe, keyboard, focus, reflow, preferences, contrast, and the Chromium accessibility tree are not relabelled as native screen-reader evidence. Commit, push, and deployment remain separate user-authorized actions.
