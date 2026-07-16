---
name: accessibility
description: Design and review accessible web interactions using WCAG 2.2 and proven UI patterns. Use for Fox Dispatcher forms, tables, filters, dialogs, live recalculation, keyboard navigation, focus, contrast, motion, and assistive-technology verification.
---

# Accessibility

Build accessibility into the interaction model and verify it through browser behavior.

## Review workflow

1. Identify the page landmarks, reading order, headings, and primary task flow.
2. Map every interaction to a native semantic element and an accessible name.
3. Connect labels, instructions, validation messages, and error summaries to their fields.
4. Trace keyboard focus through editing, filtering, dialogs, and dynamic updates.
5. Announce meaningful recalculation results through an appropriate live region.
6. Check text, controls, charts, and state indicators for contrast and non-color cues.
7. Respect zoom, reflow, target size, reduced motion, and high-contrast preferences.
8. Verify the flow with keyboard use, a screen reader pass, and repository-defined automated checks.

## Fox Dispatcher emphasis

Give observation editors explicit labels and error associations. Give sortable tables accessible column names and current sort state. Express suspicion levels through text and visual treatment together. Preserve focus when observations are added, edited, filtered, or removed. Announce updated rankings in a concise live region.

Read [A11Y-PATTERNS.md](references/A11Y-PATTERNS.md) for implementation patterns. Read [WCAG.md](references/WCAG.md) when a criterion or test method needs clarification.

Run accessibility tooling through pinned project scripts recorded in `package.json` and the repository lockfile. Record automated findings together with manual keyboard and screen-reader evidence.

Adapted from `addyosmani/web-quality-skills` `accessibility`, audited at commit `95d6e255afe1596b557d7a8498517884438f5b3a`.
