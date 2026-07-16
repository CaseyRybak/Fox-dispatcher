---
name: brainstorming
description: Shape an idea into an approved, repository-backed product or technical specification. Use for new Fox Dispatcher features, domain behavior, scoring logic, user flows, interface concepts, architecture choices, or other work where meaningful intent and approach decisions remain before execution planning.
---

# Brainstorming

Turn conversational intent into a durable specification that `writing-plans` can execute.

## Build context

1. Read the nearest `AGENTS.md` domain maps and linked specifications.
2. Inspect the relevant repository structure, current behavior, and recent decisions.
3. Summarize the requested outcome, users, constraints, and visible success evidence.
4. Split broad ideas into independently valuable outcomes and focus the conversation on one outcome.

## Explore the idea

Ask one high-value question at a time. Prefer questions that resolve product intent, domain meaning, user control, data boundaries, or acceptance evidence. Reflect each answer back as a concise working decision and update the emerging model.

Develop two or three credible approaches when the choice changes user experience, domain boundaries, delivery risk, or future flexibility. Present the recommended approach first, then compare tradeoffs in plain language.

Use compact ASCII wireframes, state tables, or examples when they clarify a relationship. Keep visual exploration inside repository-friendly text artifacts.

## Form the design

Cover the sections that materially shape the outcome:

- user journey and controls;
- domain concepts, calculations, and explanations;
- inputs, outputs, validation, and state transitions;
- DDD and hexagonal boundaries, ports, and adapters;
- interface composition, accessibility, and responsive behavior;
- empty, error, recovery, and reset experiences;
- verification evidence and AI Worklog checkpoints;
- repository artifacts affected by the decision.

Present the design in small coherent sections and incorporate user feedback into the working model.

## Materialize the result

Save the approved specification to `docs/specs/active/YYYY-MM-DD-<outcome>.md` with this structure:

```markdown
# Outcome

## Intent
## Context
## User outcomes
## Domain concepts and examples
## Approaches considered
## Decisions
## Interfaces and data flow
## Interaction and accessibility
## Error and recovery states
## Acceptance evidence
## AI Worklog checkpoints
## Repository impact
```

Capture cross-domain architectural choices in `docs/decisions/` and link them from the specification. Represent sensitive values as `[redacted]` and keep task-local context focused on the design outcome.

Review the written specification for coverage, internal consistency, scope, ambiguous terms, concrete examples, and testable evidence. Read [spec-review.md](references/spec-review.md) when an independent review brief adds value.

Present the specification path and decision summary for user approval. After approval, invoke `writing-plans` with the specification as its primary input.

Adapted from `obra/superpowers` `brainstorming` and the Coffee Fix repository example, audited against upstream commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
