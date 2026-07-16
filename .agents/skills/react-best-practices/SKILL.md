---
name: react-best-practices
description: Apply focused React performance and correctness guidance through progressive rule references. Use when writing, reviewing, or refactoring Fox Dispatcher React components, state, data flow, browser storage, rendering, and bundle behavior.
---

# React Best Practices

Choose guidance according to the observed bottleneck or correctness concern, then read only the relevant reference.

## Route the task

- Domain-to-view data flow and async work: [data-flow.md](references/data-flow.md)
- State ownership, derived values, and rendering: [state-and-rendering.md](references/state-and-rendering.md)
- Browser storage, bundle shape, and runtime evidence: [browser-and-bundle.md](references/browser-and-bundle.md)

## Apply guidance

1. Measure or reproduce the behavior through current evidence.
2. Select the smallest relevant reference.
3. Compare the examples with the project's React version and architecture.
4. Implement a focused change through existing public interfaces.
5. Verify user-visible behavior, render frequency, bundle output, or timing according to the original evidence.
6. Record architectural insights in the relevant domain or adapter documentation.

Give particular attention to derived suspicion reports, localStorage schema versioning, observation editor state, list rendering, and chart updates.

Use optimization tools through pinned project dependencies and repository scripts. This keeps analysis reproducible from the lockfile.

Adapted from `vercel-labs/agent-skills` `react-best-practices`, audited at commit `f8a72b9603728bb92a217a879b7e62e43ad76c81`.
