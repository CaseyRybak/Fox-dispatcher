---
name: requesting-code-review
description: Prepare a focused, secret-safe review package for a code change. Use after a Fox Dispatcher execution slice has fresh verification evidence and before integration or completion.
---

# Requesting Code Review

Give a reviewer enough context to evaluate the change independently while keeping the data surface narrow.

## Prepare the package

1. State the intended outcome and acceptance evidence.
2. Identify the base and head revisions or the exact changed paths.
3. Run the relevant verification and capture concise results.
4. Inspect changed material for credentials, tokens, private data, client information, and generated content.
5. Select the diff sections, interfaces, and domain documents that support the review.
6. Replace sensitive values with `[redacted]` and describe their type when useful.

## Review brief

Include:

- outcome and scope;
- acceptance evidence;
- architectural context and affected domain;
- relevant changed paths;
- focused diff or commit range;
- verification commands and observed results;
- decisions that deserve scrutiny.

Ask the reviewer to classify findings by impact, cite file and line, explain the failure mode, and suggest a verification path. Request separate evaluation of specification fit and code quality when the change is substantial.

Adapted from `obra/superpowers` `requesting-code-review`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
