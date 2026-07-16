import { describe, expect, it } from "vitest";

import type { Observation } from "./observation";
import { DEFAULT_SCORING_POLICY, createScoringPolicy } from "./scoring-policy";
import {
  calculateSuspicionReport,
  roundFractionToTenths,
} from "./suspicion-report";

const starterObservations = [
  observation({
    id: "obs_001",
    fox_id: "fox_001",
    location: "Северная поляна",
    has_prey: true,
    suspicion_level: 8,
    time: "08:20",
  }),
  observation({
    id: "obs_002",
    fox_id: "fox_002",
    location: "Туманная тропа",
    color: "черная",
    suspicion_level: 5,
    time: "09:05",
  }),
  observation({
    id: "obs_003",
    fox_id: "fox_001",
    location: "Северная поляна",
    suspicion_level: 9,
    time: "10:40",
  }),
  observation({
    id: "obs_004",
    fox_id: "fox_003",
    location: "Моховой овраг",
    color: "серебристая",
    has_prey: true,
    suspicion_level: 7,
    time: "11:15",
  }),
  observation({
    id: "obs_005",
    fox_id: "fox_004",
    location: "Северная поляна",
    suspicion_level: 3,
    time: "12:10",
  }),
] satisfies readonly Observation[];

describe("explainable suspicion scoring", () => {
  it("produces the exact starter ranking and contributions at 80/20", () => {
    const report = calculateSuspicionReport(
      starterObservations,
      DEFAULT_SCORING_POLICY,
    );

    expect(report.assessments.map(({ foxId }) => foxId)).toEqual([
      "fox_001",
      "fox_003",
      "fox_002",
      "fox_004",
    ]);
    expect(report.leader?.foxId).toBe("fox_001");
    expect(report.leader).toMatchObject({
      meanSuspicion: { numerator: 17, denominator: 2 },
      observationCount: 2,
      preyObservationCount: 1,
      score: { numerator: 1560, denominator: 200 },
      suspicionContribution: { numerator: 1360, denominator: 200 },
      preyContribution: { numerator: 200, denominator: 200 },
    });
    expect(roundFractionToTenths(report.leader!.score)).toBe(78);
  });

  it("changes the leader at 70/30 and rounds exact 7.45 half-up", () => {
    const report = calculateSuspicionReport(
      starterObservations,
      createScoringPolicy(30),
    );
    const fox001 = report.assessments.find(({ foxId }) => foxId === "fox_001");

    expect(report.leader?.foxId).toBe("fox_003");
    expect(report.leader?.score).toEqual({ numerator: 790, denominator: 100 });
    expect(roundFractionToTenths(report.leader!.score)).toBe(79);
    expect(fox001?.score).toEqual({ numerator: 1490, denominator: 200 });
    expect(roundFractionToTenths(fox001!.score)).toBe(75);
  });

  it("treats 0% and 100% as literal policy boundaries", () => {
    const directOnly = calculateSuspicionReport(
      starterObservations,
      createScoringPolicy(0),
    );
    const preyOnly = calculateSuspicionReport(
      starterObservations,
      createScoringPolicy(100),
    );

    expect(directOnly.leader?.foxId).toBe("fox_001");
    expect(roundFractionToTenths(directOnly.leader!.score)).toBe(85);
    expect(preyOnly.assessments.map(({ foxId }) => foxId)).toEqual([
      "fox_003",
      "fox_001",
      "fox_002",
      "fox_004",
    ]);
    expect(roundFractionToTenths(preyOnly.leader!.score)).toBe(100);
  });

  it("returns no fabricated leader for an empty selection", () => {
    const report = calculateSuspicionReport([], DEFAULT_SCORING_POLICY);

    expect(report.assessments).toEqual([]);
    expect(report.locationActivity).toEqual([]);
    expect(report.latestObservation).toBeUndefined();
    expect(report.leader).toBeUndefined();
  });

  it("calculates one observation without a special case", () => {
    const report = calculateSuspicionReport(
      [observation({ suspicion_level: 6, has_prey: true })],
      DEFAULT_SCORING_POLICY,
    );

    expect(report.leader).toMatchObject({
      meanSuspicion: { numerator: 6, denominator: 1 },
      score: { numerator: 680, denominator: 100 },
    });
    expect(roundFractionToTenths(report.leader!.score)).toBe(68);
  });

  it("compares mathematically equal fractions before deterministic tie-breaks", () => {
    const report = calculateSuspicionReport(
      [
        observation({
          id: "a_1",
          fox_id: "fox_a",
          suspicion_level: 4,
          time: "10:00",
        }),
        observation({
          id: "a_2",
          fox_id: "fox_a",
          suspicion_level: 6,
          time: "11:00",
        }),
        observation({
          id: "b_1",
          fox_id: "fox_b",
          suspicion_level: 5,
          time: "12:00",
        }),
      ],
      createScoringPolicy(0),
    );

    expect(report.assessments.map(({ foxId }) => foxId)).toEqual([
      "fox_b",
      "fox_a",
    ]);
  });

  it("uses observation id ascending when a fox has equal latest times", () => {
    const report = calculateSuspicionReport(
      [
        observation({
          id: "obs_b",
          fox_id: "fox_equal",
          color: "рыжая",
          time: "10:00",
        }),
        observation({
          id: "obs_a",
          fox_id: "fox_equal",
          color: "серебристая",
          time: "10:00",
        }),
      ],
      DEFAULT_SCORING_POLICY,
    );

    expect(report.leader?.latestObservation.id).toBe("obs_a");
    expect(report.leader?.latestObservation.color).toBe("серебристая");
  });

  it("uses locale-independent UTF-16 ordinal order for tied fox ids", () => {
    const report = calculateSuspicionReport(
      [
        observation({ id: "obs_ya", fox_id: "fox_Я" }),
        observation({ id: "obs_z", fox_id: "fox_Z" }),
      ],
      DEFAULT_SCORING_POLICY,
    );

    expect(report.assessments.map(({ foxId }) => foxId)).toEqual([
      "fox_Z",
      "fox_Я",
    ]);
  });

  it("sorts tied locations by UTF-16 ordinal name", () => {
    const report = calculateSuspicionReport(
      [
        observation({ id: "obs_1", location: "Ясная поляна" }),
        observation({ id: "obs_2", location: "Альфа" }),
        observation({ id: "obs_3", location: "Ясная поляна" }),
        observation({ id: "obs_4", location: "Альфа" }),
      ],
      DEFAULT_SCORING_POLICY,
    );

    expect(report.locationActivity).toEqual([
      { location: "Альфа", observationCount: 2 },
      { location: "Ясная поляна", observationCount: 2 },
    ]);
  });

  it("is invariant to the order of input observations", () => {
    const forward = calculateSuspicionReport(
      starterObservations,
      DEFAULT_SCORING_POLICY,
    );
    const reversed = calculateSuspicionReport(
      [...starterObservations].reverse(),
      DEFAULT_SCORING_POLICY,
    );

    expect(reversed).toEqual(forward);
  });

  it("accepts only integer policy steps from 0 through 100", () => {
    expect(createScoringPolicy(25)).toEqual({ preyWeightPercent: 25 });

    for (const invalidValue of [-5, 21, 105, 20.5, Number.NaN]) {
      expect(() => createScoringPolicy(invalidValue)).toThrow(RangeError);
    }
  });
});

function observation(overrides: Partial<Observation> = {}): Observation {
  return {
    id: "obs_default",
    fox_id: "fox_default",
    location: "Северная поляна",
    color: "рыжая",
    has_prey: false,
    suspicion_level: 5,
    time: "09:00",
    ...overrides,
  };
}
