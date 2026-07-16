export interface ScoringPolicy {
  readonly preyWeightPercent: number;
}

export const DEFAULT_SCORING_POLICY: ScoringPolicy = Object.freeze({
  preyWeightPercent: 20,
});

export function createScoringPolicy(preyWeightPercent: number): ScoringPolicy {
  if (
    !Number.isInteger(preyWeightPercent) ||
    preyWeightPercent < 0 ||
    preyWeightPercent > 100 ||
    preyWeightPercent % 5 !== 0
  ) {
    throw new RangeError(
      "Prey weight must be an integer from 0 through 100 in steps of 5.",
    );
  }

  return { preyWeightPercent };
}
