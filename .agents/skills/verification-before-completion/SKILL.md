---
name: verification-before-completion
description: Collect fresh, reproducible evidence for completion claims. Use before reporting a Fox Dispatcher task, slice, fix, review finding, or release as complete.
---

# Verification Before Completion

Convert each completion claim into evidence produced from the current repository state.

## Evidence workflow

1. List the claims implied by the requested outcome.
2. Map every claim to the most direct command, inspection, or browser flow.
3. Run the evidence-producing actions from the current working tree.
4. Read exit codes and relevant output, including warnings and skipped checks.
5. Compare the observed result with the acceptance evidence.
6. Record commands, results, artifact paths, and remaining uncertainty.

Prefer focused tests for domain behavior, integration tests for adapters, and Playwright flows for user-visible interaction. Pair visual claims with current screenshots and behavioral claims with assertions or reproducible steps.

Include repository state when it affects the claim: changed files, generated artifacts, dependency state, and the active branch.

## Completion report

Summarize:

- verified claims;
- commands and observed results;
- screenshots, traces, or reports;
- coverage boundaries;
- follow-up work represented in repository artifacts.

Adapted from `obra/superpowers` `verification-before-completion`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
