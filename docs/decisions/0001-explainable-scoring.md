# Decision 0001: Explainable fox scoring

Status: accepted

Date: 2026-07-16

Product contract: [fox-dispatcher.md](../product-specs/fox-dispatcher.md)

## Context

The assignment asks the interface to identify the most suspicious fox, explain which signals matter, and show a changed report after data or parameters change.

The source fields include a direct `suspicion_level` and a boolean `has_prey`. Location, color, identity, and time provide observation context. There is no separate behavior field, calendar date, geographic coordinate, movement path, or validated domain rule connecting repeat count, color, location, or recency to suspiciousness.

`fox_001` has two observations while other foxes have one. Treating record count as a bonus would reward evidence availability rather than an observed signal.

## Decision

The ranking uses two explicit signals:

```text
meanSuspicion = mean(suspicion_level)
preyRate      = prey observations / all observations of the fox
preySignal    = preyRate * 10

score = meanSuspicion * (1 - preyWeight)
      + preySignal * preyWeight
```

Default `preyWeight` is 20%, adjustable from 0% through 100% in 5% steps. The canonical policy value is the integer `preyWeightPercent`; the normalized formula value is `preyWeightPercent / 100`. The complementary weight belongs to `suspicion_level`.

The score is an explainable attention index from 0 through 10. The interface presents treating prey as a configurable observer policy. Setting prey influence to 0% yields a ranking based only on the direct suspicion assessments.

Location, color, time, and record count provide context, filters, and evidence volume. They have no score contribution.

Ranking order uses:

1. unrounded score descending;
2. mean suspicion descending;
3. latest observation time descending;
4. `fox_id` ascending.

Display rounds to one decimal place.

The implementation represents the policy weight as an integer percentage `w` and keeps each fox score as an exact fraction:

```text
scoreNumerator = sumSuspicion * (100 - w) + preyCount * 10 * w
scoreDenominator = observationCount * 100
```

Scores and mean suspicion values are compared by cross multiplication within the documented 1000-record limit. Display rounding is decimal half-up to one place; exact `7.45` therefore displays as `7.5`. This avoids IEEE-754 drift changing a displayed value or preventing a mathematical tie from reaching the recorded tie-breaks.

All final string tie-breaks use locale-independent UTF-16 ordinal comparison. Observations with the same `time` use `id` ascending as their deterministic secondary order.

## Acceptance examples

Default 80/20 policy:

```text
fox_001 = 8.5 * 0.8 + 5 * 0.2  = 7.8
fox_003 = 7.0 * 0.8 + 10 * 0.2 = 7.6
```

At 70/30:

```text
fox_001 = 8.5 * 0.7 + 5 * 0.3  = 7.45
fox_003 = 7.0 * 0.7 + 10 * 0.3 = 7.90
```

The expected leader changes from `fox_001` to `fox_003`.

The exact `fox_001` result is `7.45` and its one-decimal display is `7.5`.

## Alternatives considered

### Mean `suspicion_level` only

This is the most literal reading of the data. It remains available through prey influence 0%, but as the only model it provides a weaker parameter-change demonstration and leaves `has_prey` entirely contextual.

### Latest observation only

This resembles a "current" status but discards valid records. The source has time without date, so chronological recency across reporting periods cannot be established.

### Maximum observation score

This prioritizes the strongest single event but lets one value determine the entity result and weakens the value of the remaining evidence.

### Bonuses for repeat appearances, location, color, or time

The assignment provides no domain basis or coefficients for those bonuses. They would make the result less explainable and introduce unsupported behavior.

## Consequences

- Every displayed score can show exact arithmetic and source values.
- One control provides a visible, deterministic ranking change.
- Record frequency remains visible as evidence volume without becoming risk.
- The word "current" refers to the active observation selection rather than real-time state.
- Domain tests can cover the full policy without React or browser dependencies.
- Exact fraction comparison keeps ranking and rounding invariant across JavaScript engines and input permutations.
