# Phase consistency and UI/UX audit

Date: 2026-07-17

Status: Phases 0–8 and the corrective changes described below are published on `main`. Follow-up correctness and Summary-clarity corrections are implemented and verified in the current revision.

## Audit scope

- compared the root/domain maps, product/interface/architecture contracts, both completed implementation plans, decision records, phase evidence, Git state, CI, and embedded production revision;
- reviewed domain/application/adapter/UI changes for correctness, local-first privacy, storage/import boundaries, React state, accessibility, and production artifacts;
- exercised Summary, Observations, AI Worklog, editor, discard/reset confirmations, import preview, export download, corrupt/future recovery, filters, selected evidence, sorting, delete/undo, persistence, and navigation in a real Chromium browser;
- inspected 1440, 768, 390, 320, landscape, 200% scale/reflow, text spacing, reduced motion, increased contrast, forced colors, and Chromium accessibility-tree behavior;
- repeated revision-pinned release and Phase 8 flows against the public Vercel alias.

## Phase result

| Phase | Planned outcome | Audit result |
|---|---|---|
| 0 | durable product, interface, architecture, decisions, traceability | Pass; current contracts and status maps reconciled |
| 1 | pinned walking skeleton, starter boundary, navigation, architecture gate | Pass; boundaries and shared gate remain green |
| 2 | exact explainable score, ranking, live policy | Pass; arithmetic, rounding, tie-breaks, and 20→30% flow reproduced |
| 3 | shared report scope, evidence, activity, recent observations | Pass; every filter type, combined/zero state, selection, cross-route scope, and 320 px reproduced |
| 4 | public-safe Worklog and reviewer README | Pass; 7 historical checkpoints and 14 pinned links remain unchanged; Phase 8 evidence stays in repository verification docs |
| 5 | CRUD, undo/reset, persistence, deterministic sorting and focus | Pass; add/edit/delete/undo/reload and failure feedback reproduced |
| 6 | responsive and accessibility quality | Pass for automated/browser boundary; native screen-reader session remains an explicit external limitation |
| 7 | public Vercel release, headers, privacy and reviewer journey | Pass; production metadata equals `675a6aa`, exact headers and same-origin static requests verified |
| 8 | atomic import, full export, corrupt/future recovery | Pass locally and publicly; deterministic download, reload, raw preservation, 4 axe scans, and 320 px reproduced |

## Corrected findings

### Product correctness and state

- Friendly labels previously collapsed distinct IDs such as `fox_1`, `fox_01`, and `fox_001` into the same visible `Лиса 1`. Canonical IDs now remain visible and part of accessible identity on every result and ledger surface.
- A stale asynchronous file read could overwrite a newer file, manual JSON, or preview. Import source revisions now enforce last-source-wins and disable validation only while the authoritative read is pending.
- New records previously defaulted prey to `Нет`, bypassing the intended explicit choice. The empty draft is now unselected and the application boundary accepts only a validated boolean.
- Russian error counts now use the 1/21/11 plural rules rather than the last digit alone.

### Recovery and destructive actions

- Unsupported future storage was described as damaged in its confirmation. The dialog now names the preserved schema version and uses matching safe copy.
- The ordinary starter reset remained visible during recovery and bypassed the recovery-specific warning. Recovery now precedes the data bar and is the only destructive reset path until resolved.
- Cancel restores focus to the concrete trigger that opened the confirmation rather than a generic reset ref.

### UI/UX and accessibility

- Mobile Summary now presents the primary outcome before filters; filter fields are initially compact while the scope label and active chips remain visible. DOM order also makes the first `Tab` after the route heading reach the filters.
- Mobile Observations keeps `Добавить наблюдение`, sorting, and records primary; import/export/reset are grouped behind `Показать управление данными`.
- A filtered observation ledger explains the shared scope and offers `Показать все наблюдения`, with deterministic focus after reset.
- The native English file chooser was replaced by a localized `Выбрать JSON-файл` control and readable loading/file state.
- Evidence and contribution containers now expose valid `group` semantics; the English footer fragment has `lang="en"`.
- The visual language, typography, data density, focus treatment, mobile cards, dialogs, and Worklog remain consistent with the field-ledger direction. No horizontal overflow or axe violation was found in the accepted browser states.
- The Summary now names the most suspicious fox directly, explains exact contributions in plain language, distinguishes the two formula signals from contextual fields, and states how observation count affects the averages without becoming a third signal.
- The formula status uses explicit percentages, the leading-location metric names what is counted, ranking rows use full observation wording, and a direct data-edit action plus persistent post-change result make recalculation discoverable and visible.

### Verification and documentation

- Current maps, README, architecture, completed plans, Phase 5/6/8 evidence, and release evidence now record the actual published Phase 8 revision rather than an uncommitted Phase 7-only state. The seven-entry Worklog remains historical as required by the accepted Phase 8 specification.
- CI now runs the Phase 8 browser regression.
- The release runner now rejects Playwright CLI `### Error` output even if the child exits zero. URL checks no longer depend on globals unavailable in the CLI sandbox.
- Phase 8 axe injection moved to an init script so the same evidence flow works under the production `script-src 'self'` CSP.
- The canonical interface specification now matches the implemented contextual data actions, mobile disclosures, identity rules, and read-only Summary inspector instead of promising nonexistent global header actions.

## Fresh evidence

Repository:

```text
npm run verify
exit=0

npm run test:run
16 files passed · 101 tests passed
```

Local production-browser flows:

- Summary/filter/evidence: combined filter `1`, Северная поляна `3/5` and `2` foxes, selected evidence preserved at 30%, 320 px, 0 browser errors.
- Worklog: 7 checkpoints, 14 pinned evidence links, 320 px, 0 browser errors.
- CRUD/persistence: `fox_004` becomes leader at `8.0`, reload preserves `10`, 320 px, 0 browser errors.
- Accessibility: 9 axe scans across pages, editor/validation/discard/reset states and mobile cards, all with 0 violations and 0 browser errors.
- Responsive/keyboard: 1440×900, 768×1024, 390×844, 320×800, 844×390; skip link, editor/discard/reset focus, 200% scale, text spacing, reduced motion, increased/forced contrast and accessibility tree passed.
- Phase 8: two-record import/reload, deterministic `fox-dispatcher-observations.json`, five-record recovery, 4 axe scans, 320 px, no external origin and 0 browser errors.

Public production:

- release smoke: HTTP 200, exact revision `675a6aa86ade70b8daaafb08d046541e4e4f2ba2`, privacy headers verified, three mobile routes, seven Worklog checkpoints, persisted `Лиса 4 · 8.0`, same-origin static GET allowlist, 0 browser errors;
- Phase 8 smoke: import/reload, export, future-version recovery, four zero-violation axe scans, 320 px, production origin only, 0 browser errors.

Accepted post-fix visual artifacts are under `output/playwright/phase-3`, `phase-4`, `phase-5`, `phase-6`, and `phase-8`. `output/playwright/agent-ui-audit` is the independent pre-fix diagnostic baseline and is not completion evidence for the corrected layout.

## Remaining honest boundaries

- The audit environment cannot provide a native NVDA, JAWS, VoiceOver, or TalkBack session. Axe, keyboard, focus, reflow, preferences, and Chromium accessibility-tree evidence must not be relabelled as that test.
- Direct evidence-to-editor navigation from the Summary inspector could shorten an advanced correction workflow. It is now documented as an optional improvement; the accepted editor remains intentionally contextual to the full Observations journal.
- The mobile Worklog is necessarily long. A compact checkpoint index may help repeat visitors but is not required for task completion or accessibility.
- Production contains the accepted Phase 8 baseline and the first audit hardening from this record. The exact-fraction explanation, atomic failed-file provenance, required-field semantics, sequential numeric editing, distinct dataset-empty state, and compact recalculation result in the completed follow-up plan remain local until a separately authorized commit and deployment.
