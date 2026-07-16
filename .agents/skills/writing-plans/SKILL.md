---
name: writing-plans
description: Create versioned, executable repository plans from an approved specification. Use for multi-step Fox Dispatcher work that spans domains, interfaces, tests, documentation, or several agents.
---

# Writing Plans

Turn approved intent into a repository artifact that another agent can execute with limited conversational context.

## Gather context

1. Read the nearest `AGENTS.md` maps for the affected domains.
2. Read the product specification, current architecture notes, and relevant completed plans.
3. Inspect the current files, interfaces, tests, and repository state.
4. Capture user intent, assumptions, decisions, and acceptance evidence in the plan.

## Create the plan

Save active plans under `docs/exec-plans/active/YYYY-MM-DD-<outcome>.md`.

Use this compact structure:

```markdown
# Outcome

## Intent
## Acceptance evidence
## Context and domain map
## Decisions
## Execution slices
### Slice 1: Verifiable outcome
- Files and interfaces
- Implementation steps
- Verification command and expected evidence
## Integration evidence
## Resulting repository artifacts
```

Shape each execution slice around one independently reviewable outcome. Include exact paths, consumed and produced interfaces, relevant test cases, and a concrete verification command.

Link to detailed specifications instead of duplicating them. Keep domain concepts beside their domain and adapter details beside their adapter.

Place unresolved decisions in the plan's decision section with the context needed for a future choice. Keep reusable procedures in repository skills and durable product facts in specifications.

## Handoff

Review the plan against every acceptance statement. Present the plan path, execution order, parallel opportunities, and the first verification checkpoint.

Move a finished plan to `docs/exec-plans/completed/` together with its final evidence summary.

Adapted from `obra/superpowers` `writing-plans`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
