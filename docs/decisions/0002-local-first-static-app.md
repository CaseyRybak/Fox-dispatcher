# Decision 0002: Local-first static application

Status: accepted with delivery-priority addendum

Date: 2026-07-16

Architecture: [../../ARCHITECTURE.md](../../ARCHITECTURE.md)

## Context

The first release is a small interactive prototype. The product needs starter data, a changeable parameter or data input, report recalculation, AI Worklog, reviewer documentation, and a public demo. Observation editing and persistence strengthen the prototype; import/export and advanced recovery are later enhancements. Accounts, collaboration, cross-device synchronization, server-side analytics, and AI inference remain outside its scope.

A backend would add deployment, security, and failure surfaces without improving the core reviewer journey. A browser-only runtime keeps every relevant state transition inspectable by agents and reproducible in tests.

## Decision

The first product version is a static React application:

- bundled starter observations provide the first-run state;
- one authoritative observation array and scoring policy live in application state;
- a small versioned local storage envelope persists accepted changes when the should-have observation-management slice is included;
- optional JSON import parses and validates before preview and explicit replacement;
- optional JSON export contains the full observation array;
- invalid or unavailable baseline storage has an honest fallback, while raw-value and future-version recovery remain optional;
- AI Worklog content enters the production bundle from a structured public repository artifact;
- user observations are processed and stored in the browser.

Planned storage shape:

```text
{
  schemaVersion: 1,
  observations: Observation[],
  scoringPolicy: { preyWeightPercent: number },
  updatedAt: string
}
```

The stable key is `fox-dispatcher.dashboard`; the envelope carries the version. Baseline loading returns `missing`, `valid`, `invalid`, or `unavailable`. Observations and scoring policy reuse their boundary schemas, `schemaVersion` is exactly `1`, and `updatedAt` is a UTC ISO 8601 instant. Optional advanced recovery may later distinguish corrupt and unsupported future versions without changing the baseline state boundary silently.

Filters represent a current analysis scope and start cleared on a new browser session. Data reset and scoring-policy reset remain separate actions.

## Optional import and advanced recovery behavior

Import accepts an observation array only after all records satisfy the product schema. Invalid import preserves the current dataset. Unknown fields are treated as contract errors so data is not discarded silently.

File and pasted input share a 2 MiB UTF-8 limit checked before `JSON.parse`; the validated array remains limited to 1000 records. Oversized input produces a boundary error without mutating application state.

If optional advanced recovery is authorized, corrupt and unsupported stored values are not treated as first run. Autosave remains blocked until the user explicitly chooses recovery, and the raw value stays available for copying. At baseline, invalid or unavailable storage leaves the accepted state in memory, exposes a memory-only status, and offers explicit starter recovery.

The application renders imported strings as text. Runtime content does not require HTML interpretation. Public build review covers accidental external requests, secrets, private paths, and debug artifacts.

## Alternatives considered

### Server database and API

This would support synchronization and shared data, neither of which belongs to the product outcome. It would also make a simple demo dependent on credentials and service availability.

### Session-only state

This is simpler but makes reload discard reviewer changes and weakens the prototype's feeling of a usable tool.

### Runtime AI-generated recommendations

The task measures AI-first development process, not the presence of an AI API inside the product. A runtime model would make deterministic verification and explanation harder while introducing credentials and network handling.

## Consequences

- The production artifact is static and has a small operational footprint.
- Reviewer edits survive reload in the same browser.
- Baseline browser storage limitations are visible without requiring a large recovery workflow.
- Optional future-version recovery can be added after the core release without blocking it.
- Cross-device synchronization and accounts remain outside this version.
- Agents can reproduce the full product locally and in browser automation without external services.
