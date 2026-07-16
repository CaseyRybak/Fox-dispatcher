# React state and rendering

## State ownership

Store authoritative editable observations and user-selected parameters at the nearest shared owner. Derive counts, rankings, filtered lists, and explanations from current inputs.

Use functional state updates when the next value depends on the previous value. Use lazy initialization for browser storage and other meaningful startup work. Use refs for transient values that support interaction without changing rendered output.

## Rendering shape

Split components along interaction and data boundaries. Keep component definitions at module scope and pass explicit props. Give expensive list or chart work a measured reason for memoization.

Use semantic HTML for tables, forms, meters, and status regions. Apply reduced-motion preferences to transitions. Preserve stable keys and focused elements during edits.

## Evidence

Use React profiling or render counters for re-render questions. Use interaction tests for state ownership and Playwright for focus, editing, filtering, and recalculation flows.
