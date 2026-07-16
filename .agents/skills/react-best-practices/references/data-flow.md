# React data flow

## Purpose

Keep Fox Dispatcher domain calculations independent from React and translate their results into small view models.

## Flow

1. Parse and validate observation input at the application boundary.
2. Pass typed observations and scoring parameters into domain use cases.
3. Produce immutable report data with rankings, explanations, and location summaries.
4. Translate the report into view models close to the UI boundary.
5. Start independent async work together and await results at the latest useful point.
6. Represent loading, success, empty, and error states explicitly.

Give each component the smallest data shape it renders. Keep serialization boundaries compact and versioned. Use stable identifiers from the domain for lists and edits.

## Evidence

Verify domain behavior through focused tests and user-visible transitions through Playwright. Measure async timing when sequencing is the concern.
