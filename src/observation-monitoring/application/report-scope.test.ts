import { describe, expect, it } from "vitest";

import type { Observation } from "@/observation-monitoring/domain/observation";

import {
  applyReportFilters,
  collectMatchingFoxIds,
  createReportFilterOptions,
  DEFAULT_REPORT_FILTERS,
} from "./report-scope";
import { createSummaryViewModel } from "./create-summary-view-model";

const reportObservations = [
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
] satisfies readonly Observation[];

describe("ranking filters", () => {
  it("matches 3 observations and 2 foxes for North Clearing", () => {
    const observations = applyReportFilters(reportObservations, {
      ...DEFAULT_REPORT_FILTERS,
      location: "Северная поляна",
    });

    expect(observations.map(({ id }) => id)).toEqual([
      "obs_001",
      "obs_003",
      "obs_005",
    ]);
    expect(new Set(observations.map(({ fox_id }) => fox_id)).size).toBe(2);
  });

  it("combines fox, color, and prey filters without mutating input order", () => {
    const observations = applyReportFilters(reportObservations, {
      color: "рыжая",
      foxQuery: "  FOX_001  ",
      location: "",
      prey: "without-prey",
    });

    expect(observations.map(({ id }) => id)).toEqual(["obs_003"]);
    expect(reportObservations).toHaveLength(5);
  });

  it("finds a fox by its unique display name or canonical identifier", () => {
    const byDisplayName = applyReportFilters(reportObservations, {
      ...DEFAULT_REPORT_FILTERS,
      foxQuery: "  лИсА 1  ",
    });
    const byIdentifier = applyReportFilters(reportObservations, {
      ...DEFAULT_REPORT_FILTERS,
      foxQuery: "FOX_001",
    });

    expect(byDisplayName.map(({ id }) => id)).toEqual(["obs_001", "obs_003"]);
    expect(byIdentifier.map(({ id }) => id)).toEqual(["obs_001", "obs_003"]);
  });

  it("treats a full display name as an exact name instead of a numeric prefix", () => {
    const observations = applyReportFilters(
      [
        reportObservations[0]!,
        { ...reportObservations[1]!, fox_id: "fox_010" },
        { ...reportObservations[3]!, fox_id: "fox_012" },
      ],
      { ...DEFAULT_REPORT_FILTERS, foxQuery: "Лиса 1" },
    );

    expect(observations.map(({ fox_id }) => fox_id)).toEqual(["fox_001"]);
  });

  it("derives deterministic filter options from the full dataset", () => {
    expect(createReportFilterOptions(reportObservations)).toEqual({
      colors: ["рыжая", "серебристая", "черная"],
      locations: ["Моховой овраг", "Северная поляна", "Туманная тропа"],
    });
  });

  it("builds a full report with a filtered visible ranking", () => {
    const visibleFoxIds = collectMatchingFoxIds(reportObservations, {
      ...DEFAULT_REPORT_FILTERS,
      location: "Северная поляна",
    });
    const viewModel = createSummaryViewModel(reportObservations, 20, {
      selectedFoxId: "fox_004",
      totalObservationCount: reportObservations.length,
      totalFoxCount: 4,
      visibleFoxIds,
    });

    expect(viewModel.scope).toEqual({
      filteredFoxCount: 2,
      label: "Показано лис: 2 из 4",
      totalObservationCount: 5,
      totalFoxCount: 4,
    });
    expect(viewModel.ranking.map(({ foxId }) => foxId)).toEqual([
      "fox_001",
      "fox_004",
    ]);
    expect(viewModel.selectedFox?.foxId).toBe("fox_004");
    expect(viewModel.leader).toMatchObject({
      foxId: "fox_001",
      scoreLabel: "7,8",
    });
    expect(viewModel.metrics).toEqual([
      { label: "Уникальные лисы", value: "4" },
      {
        detail: "3 из 5 наблюдений",
        label: "Основная локация",
        value: "Северная поляна",
      },
    ]);
    expect(viewModel.locationActivity[0]).toEqual(
      expect.objectContaining({
        location: "Северная поляна",
        observationCount: 3,
        percentageLabel: "60%",
      }),
    );
    expect(viewModel.locationActivity).toHaveLength(3);
    expect(viewModel.recentObservations.map(({ id }) => id)).toEqual([
      "obs_005",
      "obs_004",
      "obs_003",
    ]);
  });

  it("falls back to the first visible fox when the requested fox is hidden", () => {
    const visibleFoxIds = collectMatchingFoxIds(reportObservations, {
      ...DEFAULT_REPORT_FILTERS,
      location: "Северная поляна",
    });
    const viewModel = createSummaryViewModel(reportObservations, 20, {
      selectedFoxId: "fox_003",
      totalObservationCount: reportObservations.length,
      totalFoxCount: 4,
      visibleFoxIds,
    });

    expect(viewModel.leader?.foxId).toBe("fox_001");
    expect(viewModel.selectedFox?.foxId).toBe("fox_001");
  });
});
