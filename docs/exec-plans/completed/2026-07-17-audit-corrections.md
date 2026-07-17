# Audit corrections

Status: complete on 2026-07-17; verified in the working tree and not yet published

## Outcome

The confirmed audit findings are corrected without changing the product's local-first boundary or scoring policy: exact contributions remain explainable, import provenance stays atomic, empty/mobile states remain actionable, and form semantics expose the validation contract.

## Intent

Close the high- and medium-impact correctness, accessibility, responsive-context, and documentation gaps found by the 2026-07-17 project-to-specification audit. Preserve the established field-ledger visual language, typography, color system, and deterministic domain behavior.

## Acceptance evidence

- A repeating-fraction scoring example shows exact component values and an exact total before the one-decimal display value; no displayed equation contradicts the total.
- A fox observed with multiple colors shows the latest color and an explicit multiple-values marker.
- Imported time strings are trimmed before strict `HH:MM` validation.
- A failed file read cannot combine an older JSON draft with the failed file's name or byte count, and replacement stays unavailable until the source is explicitly restored.
- The exact prey-weight field accepts sequential editing, commits only values from 0 to 100 in steps of 5, and exposes its hint/error to assistive technology.
- Slider arrow sequences preview immediately and create one committed announcement on blur; numeric Enter keeps focus in the field.
- Required observation fields and import errors have programmatic and visible semantics.
- A truly empty dataset has a distinct action leading to add/import/reset controls; filtered-empty behavior remains unchanged.
- At compact widths the current leader and score remain adjacent to the policy control, while the formula status remains visible in the header.
- Focused tests, the shared verification gate, and production-preview browser checks pass with no new accessibility or console failures.
- Release documents distinguish the deployed baseline from the uncommitted audit-correction work and retain the native-screen-reader evidence boundary.

## Context and domain map

`observation-monitoring` remains the only bounded context. Exact rational values are already owned by the domain report; the application view model formats them without recomputing the score. JSON normalization remains in the adapter. React owns only draft/provenance and presentation state. App composition continues to own committed policy and dataset mutations.

## Decisions

- Format reduced exact fractions in the view model, using finite decimal notation only when it is exact; retain one-decimal score labels as the product's compact ranking display.
- Derive color variation from the active observation scope and expose the latest value plus a count, rather than altering scoring.
- Model import text, source name, and measured bytes as one state value. A failed read leaves the earlier draft visible but blocks validation until the observer edits it or selects a readable file.
- Give the number input a local string draft. Slider changes still preview immediately; the number field commits on blur or Enter after validation.
- Keep the existing visual signature. The only responsive addition is a compact committed-result docket next to the scoring policy; no new palette, type family, or ornamental motif is introduced.
- Route dataset-empty recovery to the existing Observations data-management surface instead of duplicating destructive reset behavior on Summary.
- Do not claim native screen-reader evidence or deployment of the working-tree corrections.

## Execution slices

### Slice 1: Exact report contract

- Add failing view-model/component and import-boundary tests for repeating fractions, color variation, and trimmed time.
- Expose exact contribution/total labels and scoped color summaries.
- Normalize time at the shared Zod boundary.
- Verification: focused summary and import/export tests.

### Slice 2: Atomic import and form semantics

- Add regression coverage for valid draft, unreadable file, provenance, disabled validation/replacement, and explicit draft restoration.
- Replace split import source metadata with an atomic state model.
- Link textarea/file errors and expose required editor fields visibly and programmatically.
- Verification: focused import-recovery, management, and accessibility tests.

### Slice 3: Policy editing and compact result context

- Add tests for sequential number editing, invalid step/range, commit behavior, and compact result content.
- Add local number draft/error behavior and the mobile result docket.
- Preserve the dataset formula status in the compact header.
- Verification: summary component tests plus production-preview mobile interaction.

### Slice 4: Empty dataset and consistency evidence

- Add a true-empty-dataset test distinct from filtered-empty.
- Link Summary to existing add/import/reset controls.
- Reconcile README, verification, and release revision language with the actual deployed baseline.
- Run focused suites, `npm run verify`, browser smoke/e2e checks, and artifact inspection.

## Integration evidence

[Audit corrections verification](../../verification/2026-07-17-audit-corrections.md) records the focused RED/GREEN cycles, 108-test full suite, complete repository gate, four production-browser flows, inspected mobile artifacts, and revision-pinned public-baseline check. Public deployment remains a separate follow-up because the current task does not authorize a release.

## Resulting artifacts

- exact and internally consistent scoring explanation;
- explicit multi-color report semantics and normalized time input;
- atomic import provenance and accessible error relationships;
- robust policy number editing and compact result context;
- distinct empty-dataset recovery route;
- focused regression coverage and audit-correction verification evidence.
