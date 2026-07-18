import type { Observation } from "@/observation-monitoring/domain/observation";
import { formatFoxDisplayName } from "./fox-display-name";

export type PreyFilter = "all" | "with-prey" | "without-prey";

export interface ReportFilters {
  readonly color: string;
  readonly foxQuery: string;
  readonly location: string;
  readonly prey: PreyFilter;
}

export interface ReportFilterOptions {
  readonly colors: readonly string[];
  readonly locations: readonly string[];
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = Object.freeze({
  color: "",
  foxQuery: "",
  location: "",
  prey: "all",
});

export function applyReportFilters(
  observations: readonly Observation[],
  filters: ReportFilters,
): readonly Observation[] {
  const normalizedFoxQuery = filters.foxQuery.trim().toLowerCase();
  const exactFoxIds = collectExactFoxIds(observations, normalizedFoxQuery);

  return observations.filter((observation) => {
    if (
      normalizedFoxQuery !== "" &&
      !matchesFoxQuery(observation, normalizedFoxQuery, exactFoxIds)
    ) {
      return false;
    }

    if (filters.location && observation.location !== filters.location) {
      return false;
    }

    if (filters.color && observation.color !== filters.color) {
      return false;
    }

    if (filters.prey === "with-prey" && !observation.has_prey) {
      return false;
    }

    if (filters.prey === "without-prey" && observation.has_prey) {
      return false;
    }

    return true;
  });
}

export function collectMatchingFoxIds(
  observations: readonly Observation[],
  filters: ReportFilters,
): ReadonlySet<string> {
  return new Set(
    applyReportFilters(observations, filters).map(({ fox_id }) => fox_id),
  );
}

function collectExactFoxIds(
  observations: readonly Observation[],
  normalizedQuery: string,
): ReadonlySet<string> {
  if (normalizedQuery === "") return new Set();

  const exactIdentifierMatches = observations
    .map(({ fox_id }) => fox_id)
    .filter((foxId) => foxId.toLowerCase() === normalizedQuery);

  if (exactIdentifierMatches.length > 0) {
    return new Set(exactIdentifierMatches);
  }

  return new Set(
    observations
      .filter(
        (observation) =>
          formatFoxDisplayName(
            observation.fox_id,
            observation.fox_name,
          ).toLowerCase() === normalizedQuery,
      )
      .map(({ fox_id }) => fox_id),
  );
}

function matchesFoxQuery(
  observation: Observation,
  normalizedQuery: string,
  exactFoxIds: ReadonlySet<string>,
): boolean {
  const foxId = observation.fox_id;
  if (exactFoxIds.size > 0) return exactFoxIds.has(foxId);

  return (
    foxId.toLowerCase().includes(normalizedQuery) ||
    formatFoxDisplayName(foxId, observation.fox_name)
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function createReportFilterOptions(
  observations: readonly Observation[],
): ReportFilterOptions {
  return {
    colors: uniqueOrdinal(observations.map(({ color }) => color)),
    locations: uniqueOrdinal(observations.map(({ location }) => location)),
  };
}

export function hasActiveReportFilters(filters: ReportFilters): boolean {
  return (
    filters.foxQuery.trim() !== "" ||
    filters.location !== "" ||
    filters.color !== "" ||
    filters.prey !== "all"
  );
}

function uniqueOrdinal(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareOrdinal);
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
