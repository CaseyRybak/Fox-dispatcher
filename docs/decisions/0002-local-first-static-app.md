# Decision 0002: Local-first static application

Status: accepted

Date: 2026-07-16

Architecture: [../../ARCHITECTURE.md](../../ARCHITECTURE.md)

## Context

The assignment evaluates a small interactive prototype over at most five days. The product needs starter data, editing, parameter changes, report recalculation, AI Worklog, and a public demo. It does not request accounts, collaboration, cross-device synchronization, server-side analytics, or an AI inference feature.

A backend would add deployment, security, and failure surfaces without improving the core reviewer journey. A browser-only runtime keeps every relevant state transition inspectable by agents and reproducible in tests.

## Decision

The first product version is a static React application:

- bundled starter observations provide the first-run state;
- one authoritative observation array and scoring policy live in application state;
- a versioned local storage envelope persists accepted changes;
- JSON import parses and validates before preview and explicit replacement;
- JSON export contains the full observation array;
- corrupt or unavailable storage becomes a recoverable application state;
- AI Worklog content enters the production bundle from a structured public repository artifact;
- user observations are processed and stored in the browser.

Planned storage shape:

```text
{
  schemaVersion: 1,
  observations: Observation[],
  scoringPolicy: { preyWeight: number },
  updatedAt: string
}
```

Filters represent a current analysis scope and start cleared on a new browser session. Data reset and scoring-policy reset remain separate actions.

## Boundary behavior

Import accepts an observation array only after all records satisfy the product schema. Invalid import preserves the current dataset. Unknown fields are treated as contract errors so data is not discarded silently.

The application renders imported strings as text. Runtime content does not require HTML interpretation. Public build review covers accidental external requests, secrets, private paths, and debug artifacts.

## Alternatives considered

### Server database and API

This would support synchronization and shared data, neither of which belongs to the assignment outcome. It would also make a simple demo dependent on credentials and service availability.

### Session-only state

This is simpler but makes reload discard reviewer changes and weakens the prototype's feeling of a usable tool.

### Runtime AI-generated recommendations

The task measures AI-first development process, not the presence of an AI API inside the product. A runtime model would make deterministic verification and explanation harder while introducing credentials and network handling.

## Consequences

- The production artifact is static and has a small operational footprint.
- Reviewer edits survive reload in the same browser.
- Browser storage limitations and recovery states are part of the visible UX.
- Cross-device synchronization and accounts remain outside this version.
- Agents can reproduce the full product locally and in browser automation without external services.
