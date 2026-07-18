# Audit remediation verification

Date: 2026-07-18

Status: local implementation complete; publication not performed

Baseline revision: `ac2da13b8b9d10a8db2189b88b6ded3531a8de76`

## Scope

This follow-up closes the confirmed implementation and current-documentation
gaps from the independent audit without reducing the codebase or changing the
approved AI Worklog cards and copy.

The implemented outcomes are:

- Summary filters recalculate only the Summary report; Parameters keeps the
  full accepted observation ledger and full fox profiles available for CRUD
  without showing or resetting Summary-filter state;
- every user-facing calculation uses `=`, including displayed values rounded
  to tenths, with rounding explained in adjacent text;
- a return to the initially loaded hash destination focuses its `h1`, while the
  initial load itself remains unfocused;
- keyboard range changes receive one stabilized live result announcement;
- observation ID is sortable on desktop and mobile;
- the browser runner falls back from an occupied preferred port and rejects an
  exited or failed owned preview process;
- release smoke reports the measured Worklog card count instead of a literal;
- current documentation reports the six approved, link-free rendered Worklog
  cards and the strict separation between Summary filters and Parameters.

Production line-count reduction and architecture simplification were explicitly
out of scope.

## AI Worklog preservation

`docs/ai-worklog/public-checkpoints.json` and
`src/observation-monitoring/ui/ai-worklog/WorklogPage.tsx` have no diff against
the baseline. The browser gate reports six rendered cards and zero timeline
links. Only documentation and release reporting were reconciled with that
already approved UI.

## Automated verification

The repository-pinned Node 24/npm 11 toolchain produced these fresh results:

| Check | Result |
|---|---|
| Focused component and runner regressions | 5 files, 48 tests passed |
| Full `npm run test:run` | 17 files, 120 tests passed |
| `npm run verify` | formatting, lint, boundaries, public content, Worklog links, tests, TypeScript, build, and deployment policy passed |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` | 0 vulnerabilities |
| Production-source/dist search for the prohibited approximation symbol | no matches |
| `git diff --check` | passed |

The final production-browser programs were run against an isolated copy of the
working tree so existing user-owned audit screenshots in the main worktree were
not overwritten:

| Browser gate | Result |
|---|---|
| `npm run test:browser` | 3 destinations, 5 observations, 4 foxes, 320 px, 0 browser errors |
| `npm run test:e2e` | complete filter/full-ledger flow, 320 px, 0 browser errors |
| `npm run test:e2e:worklog` | 6 cards, 0 links, 320 px, 0 browser errors |
| `npm run test:e2e:manage-observations` | CRUD, persistence, identity/color reuse, repeating-value `=` formulas, 320 px, 0 browser errors |
| `npm run test:a11y` | 10 states, 0 targeted axe violations, 0 browser errors |
| `npm run test:e2e:responsive-keyboard` | 5 viewport/orientation cases, keyboard/focus/preferences/accessibility-tree checks passed |
| `npm run test:e2e:release` | local revision, 6 measured Worklog cards, 3 mobile routes, local-only request origin, 0 browser errors |
| `npm run test:e2e:import-recovery` | import/export/recovery, 4 additional zero-violation axe scans, 320 px, 0 browser errors |

Fresh Summary and Parameters screenshots from that isolated run were inspected
at 1440 px and 320/390 px. The calculation grid and selected-fox contribution
rows show `=`, the full ledger remains readable, and no horizontal overflow or
visual regression was observed. The temporary screenshots were intentionally
not copied over the pre-existing audit artifacts.

## Remaining release boundary

No commit, push, Vercel publication, or production-alias mutation was authorized
or performed. The local release smoke passed; a revision-pinned external smoke
must be run against the newly published revision after publication is separately
authorized.

The Linux environment still has no native NVDA, VoiceOver, or Orca session.
Automated axe, keyboard, focus, responsive, forced-colors, reduced-motion, and
Chromium accessibility-tree evidence passed, but no native screen-reader result
is claimed.
