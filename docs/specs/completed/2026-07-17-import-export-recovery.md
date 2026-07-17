# Import, export, and storage recovery

Status: accepted and implemented on 2026-07-17

## Intent

Extend the already submitted local-first Fox Dispatcher with a reversible data boundary: a forest observer can validate and preview a complete JSON dataset before replacement, export the authoritative unfiltered observations, and inspect rather than silently lose corrupt or future-version browser data.

## Context

Phase 8 is a separately authorized optional extension. The current product already owns one validated observation array, a scoring policy, strict version-1 persistence, filters, selection fallback, CRUD, and a public release. This slice keeps that architecture: parsing and browser effects stay in adapters, accepted replacement is an application transition, and reports remain derived from one state owner.

## User outcomes

- Paste JSON or choose a UTF-8 JSON file and validate it without changing the report.
- See record, fox, location, and time-range facts before confirming replacement.
- Receive precise field paths for invalid records and retain the draft for correction.
- Replace the full dataset explicitly, then see filters reset and every report surface recalculate.
- Export every accepted observation regardless of active report filters.
- On corrupt or future-version storage, view/copy the untouched raw value and explicitly choose starter recovery.

## Domain concepts and examples

An **import draft** is untrusted text. An **import preview** is an immutable validated observation array plus derived facts; it is not accepted application state. **Replacement** is the explicit transition that installs a preview. **Recovery raw value** is the exact local-storage string that failed the version-1 envelope boundary.

Example invalid issue:

```text
[2].suspicion_level — ожидается целое число от 0 до 10
```

Example preview:

```text
6 наблюдений · 5 лис · 4 локации · 08:20–13:45
```

## Approaches considered

1. Recommended: a native import dialog with one textarea shared by paste and file input, explicit validation, preview, and replacement. It preserves draft context, provides a natural keyboard boundary, and keeps destructive replacement visibly separate from CRUD.
2. Inline import panel in the observation ledger. It reduces one click but makes long JSON and errors compete with the primary table, especially at 320 px.
3. Import immediately after file selection. It is shorter but removes the required preview and makes replacement easier to trigger accidentally.

## Decisions

- Maximum source size is `2 * 1024 * 1024` UTF-8 bytes and is checked before `JSON.parse`; file `size` is checked before reading.
- A file is decoded as fatal UTF-8. Paste size uses `TextEncoder`.
- Root input is a strict array of 0–1000 strict observation records. Existing observation schemas trim accepted strings, reject unknown fields, and report duplicate IDs.
- Validation returns all stable issue paths. Any issue leaves the accepted dataset unchanged.
- Confirmed import replaces observations only, clears report filters and delete undo, preserves the current scoring policy, persists through the existing state store, and applies normal selected-fox fallback.
- Export serializes the authoritative unfiltered array in current order with two-space formatting, a trailing newline, UTF-8 JSON MIME, deterministic filename, and revoked object URL.
- Corrupt and unsupported-version loads return their exact raw value. Autosave remains blocked until explicit starter recovery clears the stored value. Raw content is rendered only in a read-only textarea.
- Import/export and recovery use no network request, HTML interpretation, telemetry, or new dependency.

## Interfaces and data flow

```text
file/paste -> JSON import adapter -> validated preview
                                      |
                              explicit replace
                                      v
React state owner -> persistence -> reports

authoritative observations -> export adapter -> local browser download

localStorage raw -> envelope adapter -> valid state OR recovery value
```

New application-facing values:

- `ObservationImportParser.parse(text, measuredBytes?)`;
- `ObservationImportResult = preview | boundary error`;
- `ObservationExporter.export(observations)`;
- recovery metadata on corrupt and unsupported load results.

## Interaction and accessibility

The Observations data bar groups three explicit actions: import, export all, and starter reset. Import opens a native `<dialog>` named `Импорт наблюдений`. The textarea has permanent format/size guidance; the file input names accepted `.json` data. Validation errors use a focused `role="alert"` summary. Preview facts use a semantic definition list, and the replacement button names the record count.

Closing the dialog preserves its draft during the mounted observation session and returns focus to the import trigger. Successful replacement closes the dialog, returns focus to the observation scope, and publishes one polite status. Controls reflow to one column at 320 px. No information depends on color.

The recovery surface appears before normal data actions. It explains that autosave is paused, exposes the exact raw string in a labelled read-only textarea, and offers explicit starter recovery. The value remains selectable without requiring Clipboard permission.

## Error and recovery states

- Empty source text: focused `Добавьте JSON для проверки`.
- More than 2 MiB: focused `JSON больше 2 МиБ`; parse is not attempted.
- Invalid UTF-8 file: focused decoding error and retained filename.
- Invalid JSON: syntax summary; accepted state unchanged.
- Schema failure: one or more path/reason issues; accepted state unchanged.
- Valid empty array: preview shows zeroes and requires `Заменить на пустой набор`.
- Export browser failure: data remains unchanged and a polite status offers retry.
- Storage clear failure during recovery: raw value remains visible, autosave stays blocked, and the in-memory starter state remains usable.

## Acceptance evidence

- Focused adapter tests prove byte limits, fatal validation, stable paths, strict fields, duplicates, empty arrays, preview facts, export round-trip, filename/MIME, and object-URL cleanup.
- Component tests prove invalid import atomicity, valid preview/confirmation, filter reset, persistence, full unfiltered export, focus/status behavior, and raw recovery.
- A production-preview Playwright flow exercises paste, invalid and valid replacement, reload, export capture, future-version recovery, dialogs, keyboard focus, 320 px reflow, and zero browser errors.
- `npm run verify` stays green and production inspection still reports no observation egress.

## AI Worklog checkpoints

The public Worklog already uses its maximum seven entries. Phase 8 evidence updates repository documentation rather than inventing an eighth checkpoint or rewriting historical process claims.

## Repository impact

- new import/export application types and browser adapters under `src/observation-monitoring/`;
- storage load results gain raw recovery metadata;
- Observations UI gains data actions, import dialog, and recovery surface;
- focused tests and `scripts/phase-8-import-recovery.js`;
- Phase 8 verification evidence, README, architecture, and AGENTS maps updated after acceptance.
