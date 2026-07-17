import {
  summarizeObservationSet,
  type Observation,
} from "@/observation-monitoring/domain/observation";
import { formatFoxDisplayName } from "@/observation-monitoring/application/fox-display-name";

export interface ObservationListItem {
  readonly color: string;
  readonly foxId: string;
  readonly foxName: string;
  readonly hasPrey: boolean;
  readonly id: string;
  readonly location: string;
  readonly suspicionLevel: number;
  readonly time: string;
}

export interface ObservationSetOverview {
  readonly observationCount: number;
  readonly observations: readonly ObservationListItem[];
  readonly uniqueFoxCount: number;
}

export function createObservationSetOverview(
  observations: readonly Observation[],
): ObservationSetOverview {
  const summary = summarizeObservationSet(observations);

  return {
    ...summary,
    observations: observations.map((observation) => ({
      color: observation.color,
      foxId: observation.fox_id,
      foxName: observation.fox_name ?? formatFoxDisplayName(observation.fox_id),
      hasPrey: observation.has_prey,
      id: observation.id,
      location: observation.location,
      suspicionLevel: observation.suspicion_level,
      time: observation.time,
    })),
  };
}
