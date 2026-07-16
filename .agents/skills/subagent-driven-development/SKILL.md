---
name: subagent-driven-development
description: Execute an approved repository plan through bounded implementer and reviewer agents. Use when Fox Dispatcher work contains independently verifiable slices and benefits from fresh agent context.
---

# Subagent-Driven Development

Coordinate agents through repository artifacts, focused briefs, and fresh evidence.

## Prepare a slice

1. Read the approved execution plan and select one ready slice.
2. Build a brief with the outcome, acceptance evidence, exact file paths, relevant interfaces, and verification command.
3. Include links to the nearest domain map and specifications.
4. Reduce the brief to the context that directly supports the slice.

## Implement and review

1. Assign the brief to a fresh implementer agent.
2. Collect the changed paths, decisions, verification output, and remaining observations.
3. Scan the changed material for credentials, tokens, private data, client information, and generated artifacts.
4. Prepare a focused review package containing the brief, relevant diff sections, and verification evidence.
5. Ask a specification reviewer to compare the result with acceptance evidence.
6. Ask a quality reviewer to inspect design, maintainability, tests, and architectural fit.
7. Return actionable findings to the implementer and repeat the focused verification.

Use `[redacted]` for sensitive values and provide reviewers with the smallest useful excerpt. Treat agent context as a data boundary with an explicit purpose.

## Integrate the slice

Record the verified outcome in the active plan. Update durable specifications or domain maps when the slice changes repository knowledge. Select the next ready slice from the plan.

After all slices, run repository-level verification and request one final review of the integrated result.

Adapted from `obra/superpowers` `subagent-driven-development`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
