# Documentation consistency and implementation-readiness audit

Status: historical audit later published with Phase 3 in `9834af5`; no commit or push was performed by the audit itself

Audit date: 2026-07-16

Baseline revision: `c53d1f1b2e5a1f81166edf0aa34c61d84a938aeb` (`HEAD == origin/main` before documentation changes)

Publication follow-up: Phase 3 and this audit were later published on `main` in `9834af5b48705cbf00d8207877c6880a7e6e10f5`. The baseline and command results below remain the historical evidence from before that publication.

## Scope

This audit reads the repository map, product and interface specifications, architecture, three decisions, active implementation plan, historical verification records, legal/research documentation, domain map, package scripts, CI, production source boundaries, focused tests, and available Phase 3 browser artifacts.

The original MOX assignment is still not a repository artifact. The audit can establish internal consistency and implementation readiness, but not word-for-word fidelity to an unavailable external brief.

## Canonical ownership after reconciliation

| Question | Canonical artifact |
|---|---|
| Product behavior, data limits, formula, states | `docs/product-specs/fox-dispatcher.md` |
| Layout, copy, responsive and accessibility contract | `docs/design-docs/interface.md` |
| Dependency direction, ports, runtime and deployment boundaries | `ARCHITECTURE.md` and accepted decisions |
| Current phase, executable steps and remaining gate | active implementation plan |
| What was actually verified | dated files under `docs/verification/` |
| Fast current entry points | root and bounded-context `AGENTS.md` maps |

Historical verification files keep their original baselines and results. Publication follow-ups clarify later history without retroactively treating later code as earlier evidence.

## Findings resolved

| ID | Impact | Finding | Resolution |
|---|---|---|---|
| DOC-01 | Critical | Maps and plan said Phase 1/2 were uncommitted although `HEAD` and `origin/main` already contained them in `c53d1f1`. | Root map, plan, and historical evidence now record the published revision. |
| DOC-02 | High | Phase 3 filtering/evidence code and artifacts existed while maps still called filtering future work and Phase 3 pending. | Phase 3 is now recorded as completed in the working tree, with a dedicated acceptance record. |
| DOC-03 | High | Architecture mixed implemented behavior with future commands, adapters, Worklog, and deployment as if all existed. | Added delivery-status semantics and marked current versus planned responsibilities. |
| DOC-04 | High | Phase 3 and Phase 6 both appeared to own final mobile inspector/filter sheets. | Phase 3 owns stacked narrow reflow; Phase 6 owns bottom navigation and modal mobile sheets. |
| DOC-05 | Medium | Filter matching and option-source semantics were underspecified. | Defined trimmed case-insensitive fox substring search, case-sensitive domain identity, exact location/color matching, and full-dataset options. |
| DOC-06 | Medium | The original mutation phase did not define generated IDs or a test seam. | Added injected `ObservationIdGenerator`, `obs_<uuid>`, validation, uniqueness, and failure behavior; the rebalanced plan now assigns this to Phase 5. |
| DOC-07 | Medium | Export lacked a deterministic artifact contract. | Added filename, MIME/encoding, formatting, order, trailing newline, and object-URL cleanup. |
| DOC-08 | Medium | The planned CSP did not acknowledge current React style attributes used for data-driven bars. | Added a deployment gate to remove them or document and test the minimum style-attribute exception; the rebalanced plan assigns it to Phase 7. |
| DOC-09 | Medium | Planned `test:e2e` commands looked like available evidence although no such package script existed yet. | Phase 3 now provides `npm run test:e2e`; later phase commands remain planned deliverables. |
| DOC-10 | Low | The bounded-context map stopped at Phase 2 entry points. | Added report scope, evidence, activity, shared observation scope, and focused verification links. |

## Intentional future documentation

The following are incomplete by phase design rather than current documentation defects:

- `README.md` and public `docs/ai-worklog/public-checkpoints.json` belong to Phase 4 after the MOX-priority rebaseline;
- `vercel.json`, deployed headers, production URL, and release evidence belong to Phase 7;
- observation management and baseline persistence belong to should-have Phase 5;
- import/export and advanced recovery belong to optional Phase 8;
- complete keyboard, zoom, text-spacing, contrast-preference, axe, and screen-reader evidence belongs to Phase 6/release verification;
- moving the active plan to `docs/exec-plans/completed/` happens only after the full release gate.

## Verification results

Fresh results from the final amended working tree are recorded here after running with Node `24.17.0` and npm `11.13.0`:

| Claim | Evidence | Result |
|---|---|---|
| Phase 3 focused behavior | `npm run test -- report-scope` and `npm run test -- summary` | Pass: 5 and 5 tests |
| Documentation formatting | pinned Prettier over `AGENTS.md`, `ARCHITECTURE.md`, `docs/`, and the domain map | Pass |
| Repository quality gate | `npm run verify` | Pass: format, lint, boundaries, 27 tests, typecheck, and production build |
| Remaining automated checks | `npm run check:boundaries`, `npm run test:run`, `npm run build` | Pass: 13 production sources + 1/13 fixtures; 6 files/27 tests; production build |
| Production artifact hygiene | source-map, external HTML/CSS load, notices, and offline production-audit inspections | Pass: no maps or external loads, notices match, 0 cached vulnerabilities |
| Production-preview browser gates | `npm run test:browser`, `npm run test:e2e` | Pass: shell/navigation and Phase 3 Summary/evidence journeys; 320 px; 0 browser errors |
| Markdown whitespace | `git diff --check` | Pass |
| Local Markdown targets | repository-local link inspection | Pass: 49 targets |
| Status facts | `git rev-parse HEAD`, `git rev-parse origin/main`, `git status --short --branch` | Baseline revisions both `c53d1f1`; Phase 3/docs remain uncommitted |
| Git authority | final status and log inspection | No commit or push performed by this audit |

The host-default Node `18.19.1` cannot start the pinned Vitest/Vite toolchain because its `node:util` lacks `styleText`. Verification must activate `.node-version` first; this is an environment precondition, not a repository test failure.

The Phase 3 application test now uses plain domain fixtures instead of a concrete adapter, and the CSS is formatted. The architectural rules remain unchanged and the full gate is green.

## Readiness assessment

The documentation set is sufficient to implement the remaining product without chat history: scoring, field semantics, validation, state/recovery behavior, UI copy and focus contracts, dependency boundaries, release topology, and phase-specific evidence are all assigned. The remaining uncertainty is primarily execution evidence, not product intent.

Phase 3 is published in `9834af5`. Its focused logic, full repository gate, production-browser status/focus flow, narrow reflow, and later consistency hardening are recorded in [Phase 3 evidence](phase-3-evidence-and-activity.md). The rebalanced Phase 4 publishes the mandatory Worklog and README and remains behind a direct user command.
