import type { Observation } from "./observation";
import type { ScoringPolicy } from "./scoring-policy";

export interface ExactFraction {
  readonly denominator: number;
  readonly numerator: number;
}

export interface FoxAssessment {
  readonly foxId: string;
  readonly latestObservation: Observation;
  readonly meanSuspicion: ExactFraction;
  readonly observationCount: number;
  readonly preyContribution: ExactFraction;
  readonly preyObservationCount: number;
  readonly score: ExactFraction;
  readonly suspicionContribution: ExactFraction;
}

export interface LocationActivity {
  readonly location: string;
  readonly observationCount: number;
}

export interface SuspicionReport {
  readonly assessments: readonly FoxAssessment[];
  readonly latestObservation?: Observation;
  readonly leader?: FoxAssessment;
  readonly leaders: readonly FoxAssessment[];
  readonly locationActivity: readonly LocationActivity[];
  readonly observationCount: number;
  readonly policy: ScoringPolicy;
  readonly uniqueFoxCount: number;
}

export function calculateSuspicionReport(
  observations: readonly Observation[],
  policy: ScoringPolicy,
): SuspicionReport {
  const observationsByFox = new Map<string, Observation[]>();
  const observationCountByLocation = new Map<string, number>();

  for (const observation of observations) {
    const foxObservations = observationsByFox.get(observation.fox_id);

    if (foxObservations) {
      foxObservations.push(observation);
    } else {
      observationsByFox.set(observation.fox_id, [observation]);
    }

    observationCountByLocation.set(
      observation.location,
      (observationCountByLocation.get(observation.location) ?? 0) + 1,
    );
  }

  const assessments = [...observationsByFox.entries()]
    .map(([foxId, foxObservations]) =>
      createFoxAssessment(foxId, foxObservations, policy),
    )
    .sort(compareAssessments);
  const locationActivity = [...observationCountByLocation.entries()]
    .map(([location, observationCount]) => ({
      location,
      observationCount,
    }))
    .sort(compareLocationActivity);
  const latestObservation = [...observations].sort(
    compareObservationRecency,
  )[0];
  const leader = assessments[0];
  const leaders = leader
    ? assessments.filter(
        (assessment) => compareFractions(assessment.score, leader.score) === 0,
      )
    : [];

  return {
    assessments,
    latestObservation,
    leader,
    leaders,
    locationActivity,
    observationCount: observations.length,
    policy,
    uniqueFoxCount: assessments.length,
  };
}

export function roundFractionToTenths(fraction: ExactFraction): number {
  const doubledScaledNumerator = fraction.numerator * 20;
  const doubledDenominator = fraction.denominator * 2;

  return Math.floor(
    (doubledScaledNumerator + fraction.denominator) / doubledDenominator,
  );
}

function createFoxAssessment(
  foxId: string,
  observations: readonly Observation[],
  policy: ScoringPolicy,
): FoxAssessment {
  const observationCount = observations.length;
  const sumSuspicion = observations.reduce(
    (sum, { suspicion_level }) => sum + suspicion_level,
    0,
  );
  const preyObservationCount = observations.reduce(
    (count, { has_prey }) => count + Number(has_prey),
    0,
  );
  const scoreDenominator = observationCount * 100;
  const suspicionNumerator = sumSuspicion * (100 - policy.preyWeightPercent);
  const preyNumerator = preyObservationCount * 10 * policy.preyWeightPercent;
  const [latestObservation] = [...observations].sort(compareObservationRecency);

  if (!latestObservation) {
    throw new Error("A fox assessment requires at least one observation.");
  }

  return {
    foxId,
    latestObservation,
    meanSuspicion: {
      denominator: observationCount,
      numerator: sumSuspicion,
    },
    observationCount,
    preyContribution: {
      denominator: scoreDenominator,
      numerator: preyNumerator,
    },
    preyObservationCount,
    score: {
      denominator: scoreDenominator,
      numerator: suspicionNumerator + preyNumerator,
    },
    suspicionContribution: {
      denominator: scoreDenominator,
      numerator: suspicionNumerator,
    },
  };
}

function compareAssessments(left: FoxAssessment, right: FoxAssessment): number {
  const scoreComparison = compareFractions(left.score, right.score);

  if (scoreComparison !== 0) {
    return -scoreComparison;
  }

  const meanComparison = compareFractions(
    left.meanSuspicion,
    right.meanSuspicion,
  );

  if (meanComparison !== 0) {
    return -meanComparison;
  }

  const latestTimeComparison = compareOrdinal(
    right.latestObservation.time,
    left.latestObservation.time,
  );

  if (latestTimeComparison !== 0) {
    return latestTimeComparison;
  }

  return compareOrdinal(left.foxId, right.foxId);
}

function compareFractions(left: ExactFraction, right: ExactFraction): number {
  const leftProduct = left.numerator * right.denominator;
  const rightProduct = right.numerator * left.denominator;

  return Math.sign(leftProduct - rightProduct);
}

function compareObservationRecency(
  left: Observation,
  right: Observation,
): number {
  const timeComparison = compareOrdinal(right.time, left.time);

  return timeComparison !== 0
    ? timeComparison
    : compareOrdinal(left.id, right.id);
}

function compareLocationActivity(
  left: LocationActivity,
  right: LocationActivity,
): number {
  return (
    right.observationCount - left.observationCount ||
    compareOrdinal(left.location, right.location)
  );
}

function compareOrdinal(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
