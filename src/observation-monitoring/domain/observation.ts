export interface Observation {
  readonly id: string;
  readonly fox_id: string;
  readonly fox_name?: string;
  readonly location: string;
  readonly color: string;
  readonly has_prey: boolean;
  readonly suspicion_level: number;
  readonly time: string;
}

export interface ObservationSetSummary {
  readonly observationCount: number;
  readonly uniqueFoxCount: number;
}

export function summarizeObservationSet(
  observations: readonly Observation[],
): ObservationSetSummary {
  return {
    observationCount: observations.length,
    uniqueFoxCount: new Set(observations.map(({ fox_id }) => fox_id)).size,
  };
}
