# Phase 0 contract audit

Status: historical Phase 0 contract passed; Phase 1 work was uncommitted and outside scope at audit time, then later reconciled and published in `c53d1f1`

Audit date: 2026-07-16

Baseline revision: `cbaf165bda86ab629b30ed19f226d81af14ed35e` (`main`, equal to `origin/main` before the audit)

Publication follow-up: the Phase 1 and Phase 2 implementation and their evidence were later published together in `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb`. This does not change the historical baseline or scope recorded below.

## Scope and evidence boundary

This review checks the Phase 0 repository artifacts against the active implementation plan and against each other: repository map, product contract, interface contract, architecture, ADRs, execution slices, and planned verification.

The working tree was clean at audit start. While documentation amendments were in progress, a separate concurrent workflow created Phase 1 package, toolchain, CI, and `src/` files. This audit preserves those files and updates the phase-status wording, but it does not attribute, review, verify, or accept that implementation work.

The original MOX assignment text is not stored in this repository. Therefore the matrix below verifies every assignment-facing requirement normalized by the product specification and active plan, but it cannot prove word-for-word fidelity to an external brief that was not available during this audit. A final submission review should compare the public brief with this matrix without replacing the accepted product decisions silently.

## Requirement traceability

| Normalized requirement | Acceptance IDs | Canonical contract | Delivery and evidence owner | Audit result |
|---|---|---|---|---|
| Public interactive product without setup | P-01 | Product goal and primary scenario; ADR 0003 | Phase 7 Vercel smoke | Covered |
| Exact five starter observations | D-01 | Product `Исходные данные` | Phase 1 validated fixture and component test | Covered |
| Add, edit, remove, undo, and recalculate | D-02 | Product `Управление наблюдениями`; interface editor | Should-have Phase 5 mutation tests and CRUD browser flow | Covered as enhancement |
| Local persistence and recovery | D-03, D-06 | Product `Локальное сохранение`; ADR 0002 | Phase 5 baseline reload; optional Phase 8 advanced recovery | Covered by priority |
| Atomic JSON import and full export | D-04, D-06 | Product `JSON import и export`; ADR 0002 | Optional Phase 8 size, schema, atomicity, preview, and round-trip evidence | Stretch, non-blocking |
| Four unique foxes and responsive count updates | F-01 | Product summary metrics | Phase 1 fixture plus optional Phase 5 mutation evidence | Covered |
| Main location is Северная поляна, 3/5, 60% | F-02 | Product summary and location activity | Phase 3 report-scope test and browser evidence | Covered |
| Only suspicion and prey affect score | F-03, A-01 | Product scoring model; ADR 0001; architecture domain | Phase 1 boundaries plus Phase 2 domain tests | Covered |
| `fox_001` leads at 20% with 7.8 and explainable contributions | F-04 | Product starter calculation; ADR 0001 | Phase 2 scoring/component tests and screenshot | Covered |
| `fox_003` leads at 30% with 7.9; `7.45` displays as `7.5` | F-05, D-05 | Product exact-fraction contract; ADR 0001 | Phase 2 rational comparison and decimal half-up tests | Covered after arithmetic correction |
| Filters define one report scope | I-01 | Product filter scope; interface scope toolbar | Phase 3 scope tests and zero-result browser flow | Covered |
| Ranking, inspector, evidence, and raw records form one path | I-02, I-03 | Product selected-fox rules; interface inspector/focus contract | Phase 3 selection, fallback, keyboard, and status evidence | Covered after state clarification |
| AI Worklog has 5-7 public-safe, traceable checkpoints | W-01, W-02 | Product Worklog; architecture public boundary | Phase 4 schema, secret/path scan, link resolution, and browser test | Covered after evidence-link clarification |
| Domain is independent of React/storage and adapters are injected | A-01 | Architecture import matrix and ports | Phase 1 positive and negative `check:boundaries` fixtures | Covered after composition-root clarification |
| Browser cannot send observation data externally | A-02 | Product NFR; ADR 0003; architecture deployment boundary | Phase 7 header assertion and request allowlist | Covered after security-baseline clarification |
| Fresh automated, manual accessibility, build, and deployment evidence | Q-01, Q-02 | Interface verification matrix; verification architecture | Phases 1-8, final release evidence | Covered after manual-evidence clarification |

## Findings resolved by the audit

| ID | Impact | Resolution |
|---|---|---|
| F0-01 | High | Replaced floating-point-dependent ranking/display with exact integer fractions, cross multiplication, and decimal half-up rounding. |
| F0-02 | High | Added a composition-root import matrix and an `ObservationImportParser` application port. |
| F0-03 | High | Defined strict storage v1 load states, blocked autosave during recovery, and protected raw future/corrupt values. |
| F0-04 | High | Corrected the historical Git statement: Phase 0 exists in published commit `cbaf165`; this audit authorizes no new Git mutation. |
| F0-05 | High | Added this reproducible requirement-to-acceptance evidence instead of relying on one self-matching OR search. |
| F0-06 | Medium | Defined deterministic equal-time, string, location, and selected-fox behavior. |
| F0-07 | Medium | Added a 2 MiB UTF-8 pre-parse import boundary and array-root error paths. |
| F0-08 | Medium | Fixed impossible chip-focus and timed-undo contracts; specified route and mobile-sheet focus behavior. |
| F0-09 | Medium | Added a production CSP/header baseline, `npm ci`, and SHA-matched preview-to-production flow. |
| F0-10 | Low | Darkened `moss-muted`, expanded the accessibility matrix, and defined public Worklog evidence URLs. |
| F0-11 | Low | Bundled exact available MIT notices and recorded the missing-license boundary of the pinned Vercel source without inventing attribution. |

## Intentionally pending after Phase 0

These are not missing Phase 0 deliverables:

- application scaffold, `package.json`, lockfile, runtime code, and tests were Phase 1-owned; concurrent uncommitted versions present at audit time were not Phase 0 evidence and were later reviewed separately;
- domain-level `src/observation-monitoring/AGENTS.md` — created with the source tree;
- README and public AI Worklog data — Phase 4;
- screenshots and the accessibility report — Phase 6; `vercel.json`, Vercel connection, and the production URL — Phase 7;
- moving the active plan to `completed/` — only after the full release gate.

## Fresh verification

The final audit commands are run from the working tree after all amendments. Their observed results are recorded below:

| Claim | Command or inspection | Result |
|---|---|---|
| Documentation patch has no whitespace errors | `git diff --check` | Pass, exit 0 |
| Exact starter and 30% calculations are present in canonical contracts | Focused `rg` checks in product spec and ADR 0001 | Pass |
| Main location fact is present in the product contract | Focused `rg` check for `Северная поляна`, `3 из 5`, and `60%` | Pass |
| Deployment target and policy are recorded | Focused `rg` checks in ADR 0003 and architecture | Pass |
| Exact decimal behavior differs from naive IEEE-754 formatting as documented | Local Node arithmetic assertion for rational half-up `7.45 -> 7.5` | Pass |
| Design text tokens meet their stated contrast target | Local contrast calculation for declared foreground/background pairs | Pass |
| Local Markdown links resolve | Repository-local link inspection across Phase 0 Markdown files | Pass |
| Phase 0 audit changes remain separable from concurrent Phase 1 work | `git diff --name-only`, untracked-file inventory, and timestamp inspection | Pass: documentation audit scope identified; concurrent scaffold preserved and excluded |
| Git authority boundary was respected | `git status --short --branch`, HEAD/origin inspection | Pass: HEAD/origin unchanged; no audit commit or push |

### Copy-paste verification commands

All blocks below completed with exit code 0 after the audit amendments.

```bash
git diff --check
rg -n 'fox_001.*7,8' docs/product-specs/fox-dispatcher.md
rg -n 'fox_003.*7\.90' docs/decisions/0001-explainable-scoring.md
rg -n 'Северная поляна — 3 из 5 наблюдений, 60%' docs/product-specs/fox-dispatcher.md
rg -n 'Vercel is the deployment target' docs/decisions/0003-vercel-deployment.md
rg -n "connect-src 'none'" ARCHITECTURE.md docs/decisions/0003-vercel-deployment.md
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch
```

Both revision commands returned `cbaf165bda86ab629b30ed19f226d81af14ed35e`. Exact score and rounding:

```bash
node <<'NODE'
const sum = 17;
const count = 2;
const preyCount = 1;
const weightPercent = 30;
const numerator = sum * (100 - weightPercent) + preyCount * 10 * weightPercent;
const denominator = count * 100;
const display = Math.floor((numerator * 10 + denominator / 2) / denominator) / 10;
const naive = 8.5 * 0.7 + 5 * 0.3;
if (numerator !== 1490 || denominator !== 200 || display !== 7.5) process.exit(1);
if (naive.toFixed(1) !== '7.4') process.exit(1);
console.log({ numerator, denominator, display, naive, naiveDisplay: naive.toFixed(1) });
NODE
```

Observed output: exact fraction `1490/200`, display `7.5`; naive IEEE-754 value `7.449999999999999`, display `7.4`.

The corrected minimum text pair:

```bash
node <<'NODE'
const channel = value => {
  value /= 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};
const luminance = hex => {
  const value = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(value >> 16)
    + 0.7152 * channel((value >> 8) & 255)
    + 0.0722 * channel(value & 255);
};
const values = ['#607269', '#EEF3EF'].map(luminance).sort((a, b) => b - a);
const ratio = (values[0] + 0.05) / (values[1] + 0.05);
if (ratio < 4.5) process.exit(1);
console.log(ratio.toFixed(3));
NODE
```

Observed output: `4.552`.

Local Markdown path resolution:

```bash
mapfile -t links < <(rg -n -o '\[[^]]+\]\([^)]+\)' AGENTS.md ARCHITECTURE.md docs --glob '*.md')
failed=0
for entry in "${links[@]}"; do
  file="${entry%%:*}"
  rest="${entry#*:}"
  line="${rest%%:*}"
  match="${rest#*:}"
  target="${match#*](}"
  target="${target%)}"
  target="${target%%#*}"
  case "$target" in ""|http://*|https://*|mailto:*) continue ;; esac
  path="$(dirname "$file")/$target"
  if [[ ! -e "$path" ]]; then echo "$file:$line unresolved $target"; failed=1; fi
done
exit "$failed"
```

Observed result: 28 local targets resolved and no failures were printed.

## Readiness conclusion

The amended Phase 0 contract was internally consistent for its historical scope. The required Phase 1/2 reconciliation later occurred and is recorded in their verification artifacts and `c53d1f1`. The residual Phase 0 boundary remains comparison with the external assignment source, which is not a repository artifact; later-phase runtime, accessibility, and deployment claims require their own evidence.
