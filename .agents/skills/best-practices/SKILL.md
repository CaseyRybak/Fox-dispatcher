---
name: best-practices
description: Review Fox Dispatcher web code for security, compatibility, privacy, and production artifact quality. Use for editable JSON, browser storage, rendering, external resources, deployment configuration, dependency changes, and AI Worklog content.
---

# Web Best Practices

Review the application as a public interactive artifact with user-controlled data and a transparent AI Worklog.

## Security and privacy review

1. Trace user-controlled JSON from input through validation, domain translation, storage, and rendering.
2. Render user text through framework text bindings and explicit structured components.
3. Validate expected fields, value ranges, identifiers, time formats, and collection limits at the application boundary.
4. Keep persisted browser data minimal, versioned, and understandable to the user.
5. Inspect AI Worklog content and generated artifacts for keys, tokens, credentials, private data, client information, and local paths.
6. Inventory external scripts, fonts, images, APIs, and analytics with their purpose and provenance.
7. Apply deployment headers and content policy appropriate to the selected host.

## Compatibility and artifact review

Check semantic HTML, charset, viewport, responsive behavior, feature support, console output, source maps, production bundle contents, error handling, and offline or degraded behavior relevant to the prototype.

Review dependency changes through the lockfile and project-defined audit command. Treat automated fixes as a separate repository change with their own tests and review evidence.

## Evidence

Record findings by impact with file and line references. Pair each confirmed issue with a reproducible browser flow, command, or test. Preserve durable decisions in the relevant specification or deployment note.

Adapted from `addyosmani/web-quality-skills` `best-practices`, audited at commit `95d6e255afe1596b557d7a8498517884438f5b3a`.
