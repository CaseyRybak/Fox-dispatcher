---
name: test-driven-development
description: Develop observable behavior through focused test feedback. Use for Fox Dispatcher domain calculations, validation, state transitions, adapters, and regression fixes with deterministic acceptance examples.
---

# Test-Driven Development

Use tests as executable examples of product behavior and architectural boundaries.

## Behavior loop

1. State one user-visible or domain-visible behavior in concrete terms.
2. Select the narrowest test level that observes the behavior through a stable interface.
3. Write one focused example with meaningful inputs and outputs.
4. Run the test and confirm that its failure represents the missing behavior.
5. Implement the smallest coherent change that satisfies the example.
6. Run the focused test and its neighboring suite.
7. Improve names, structure, and duplication while preserving passing evidence.
8. Record any broader architectural insight in the relevant specification or skill.

## Fox Dispatcher emphasis

Give domain tests to suspicion scoring, aggregation, ranking, explanations, and JSON validation. Give adapter tests to persistence, browser storage, import/export, and view-model translation. Give Playwright flows to editing observations and observing a recalculated report.

Choose assertions that describe outcomes rather than internal call order. Use factories and builders when they make examples easier to read. Keep fixtures small enough to explain directly.

Adapted from `obra/superpowers` `test-driven-development`, audited at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
