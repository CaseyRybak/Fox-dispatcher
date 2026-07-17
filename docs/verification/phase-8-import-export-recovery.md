# Phase 8 import, export, and recovery evidence

Date: 2026-07-17

Scope: the separately authorized optional Phase 8 in the local working tree. This record does not claim that the current GitHub branch or Vercel production deployment contains Phase 8.

## Accepted behavior

- Paste and file input share one strict UTF-8/Zod boundary: 2 MiB maximum, 1000 records maximum, strict observation fields, normalized strings, unique IDs, and stable issue paths.
- Invalid, malformed, oversized, unreadable, or non-UTF-8 input cannot mutate the accepted observation array.
- A valid preview reports observations, foxes, locations, and time range. Only the named replacement action changes state.
- Replacement clears filters and delete undo, preserves the scoring policy, persists through the existing version-1 store, and recalculates every report surface.
- Export serializes the complete authoritative array, not the filtered report, as `fox-dispatcher-observations.json` with two-space formatting, a trailing newline, and `application/json;charset=utf-8`.
- Corrupt and unsupported-version storage stays byte-for-byte intact with autosave blocked. Its raw string remains selectable until explicit, confirmed starter recovery.
- All transfer and recovery operations stay in the browser and render imported/raw strings only as text values.

## Automated evidence

Focused regression:

```text
npm run test:run -- import-export import-recovery recovery manage-observations navigation summary
6 files passed · 43 tests passed
```

Full component/domain/adapter suite:

```text
npm run test:run
16 files passed · 93 tests passed
```

The focused tests cover multibyte byte limits, pre-read file rejection, fatal UTF-8 decoding, read failure, JSON syntax, strict schema paths, unknown fields, duplicates, empty-array preview, deterministic round-trip export, temporary URL cleanup, invalid-input atomicity, accepted replacement, filter reset, policy preservation, reload persistence, full-data export, exact corrupt/future raw values, selection, confirmation, and recovery.

## Production-browser evidence

Command:

```text
npm run test:e2e:import-recovery
```

Result:

```json
{
  "axeScans": [
    { "name": "import validation error", "violations": 0 },
    { "name": "valid import preview", "violations": 0 },
    { "name": "future-version recovery", "violations": 0 },
    { "name": "import dialog at 320px", "violations": 0 }
  ],
  "browserErrors": 0,
  "exportedFile": "fox-dispatcher-observations.json",
  "importedRecords": 2,
  "recoveredStarterRecords": 5,
  "requestOrigins": ["http://127.0.0.1:4173"],
  "viewport": 320
}
```

The browser flow first submits `suspicion_level: 11`, confirms the focused `[0].suspicion_level` error and unchanged five-record ledger, then previews and imports two valid records. Reload restores those two records. A real browser download reports the deterministic filename. The scenario then installs an unsupported version-42 value, verifies exact raw preservation and complete text selection, confirms recovery to five starter records, and repeats the import dialog check at 320 px.

Visual artifacts:

- [desktop import preview](../../output/playwright/phase-8/import-preview-1440px.png)
- [desktop future-version recovery](../../output/playwright/phase-8/recovery-1440px.png)
- [320 px import dialog](../../output/playwright/phase-8/import-dialog-320px.png)

The screenshots were inspected after the browser run. One first-pass mobile grid overflow and one stretched recovery action were corrected; the accepted rerun has no viewport overflow, no clipping in the visible dialog, and no axe violation.

## Repository gate

`npm run verify` passed after the final implementation and documentation pass. It covered formatting, lint, dependency boundaries, public-content safety, revision-pinned Worklog links, all 93 tests, type checking, production build, and deployment policy.

## Honest boundary

Phase 8 is locally implemented and verified. It has not been committed, pushed, or deployed because those actions require a separate direct user command. The public URL therefore continues to represent the Phase 7 release until a later publication and external smoke run.
