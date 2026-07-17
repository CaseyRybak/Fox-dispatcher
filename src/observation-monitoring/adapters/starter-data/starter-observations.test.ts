import { describe, expect, it } from "vitest";

import { starterObservations } from "./starter-observations";

describe("starter observations boundary", () => {
  it("provides the five unmodified starter observations", () => {
    expect(starterObservations).toHaveLength(5);
    expect(starterObservations).toEqual([
      {
        id: "obs_001",
        fox_id: "fox_001",
        location: "Северная поляна",
        color: "рыжая",
        has_prey: true,
        suspicion_level: 8,
        time: "08:20",
      },
      {
        id: "obs_002",
        fox_id: "fox_002",
        location: "Туманная тропа",
        color: "черная",
        has_prey: false,
        suspicion_level: 5,
        time: "09:05",
      },
      {
        id: "obs_003",
        fox_id: "fox_001",
        location: "Северная поляна",
        color: "рыжая",
        has_prey: false,
        suspicion_level: 9,
        time: "10:40",
      },
      {
        id: "obs_004",
        fox_id: "fox_003",
        location: "Моховой овраг",
        color: "серебристая",
        has_prey: true,
        suspicion_level: 7,
        time: "11:15",
      },
      {
        id: "obs_005",
        fox_id: "fox_004",
        location: "Северная поляна",
        color: "рыжая",
        has_prey: false,
        suspicion_level: 3,
        time: "12:10",
      },
    ]);
  });

  it("contains four unique fox identifiers", () => {
    expect(new Set(starterObservations.map(({ fox_id }) => fox_id)).size).toBe(
      4,
    );
  });
});
