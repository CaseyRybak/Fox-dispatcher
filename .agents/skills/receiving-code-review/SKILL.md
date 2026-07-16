---
name: receiving-code-review
description: Evaluate and apply code-review feedback against repository evidence. Use when Fox Dispatcher receives reviewer findings, suggestions, questions, or conflicting implementation advice.
---

# Receiving Code Review

Turn review feedback into verified repository improvements and explicit decisions.

## Evaluate findings

1. Read every finding in the context of its cited code and acceptance evidence.
2. Restate the concrete behavior or quality concern.
3. Reproduce the issue with a focused test, command, or inspection.
4. Compare the suggestion with domain boundaries, public interfaces, and current decisions.
5. Classify the finding as confirmed, context-dependent, already covered, or a design choice requiring discussion.

## Apply feedback

Implement confirmed findings in focused changes. Add regression evidence where the finding describes observable behavior. Run the relevant local suite and integration evidence after the update.

For context-dependent findings, respond with code references, observed evidence, and the tradeoff. Materialize durable decisions in specifications or architecture notes.

## Close the review loop

Summarize each finding with its disposition, changed paths, and verification result. Request a focused re-review when the response changes the reviewed behavior or architecture.

Adapted from `obra/superpowers` `receiving-code-review`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
