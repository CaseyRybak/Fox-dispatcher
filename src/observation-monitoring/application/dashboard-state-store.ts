import type { Observation } from "@/observation-monitoring/domain/observation";
import type { ScoringPolicy } from "@/observation-monitoring/domain/scoring-policy";

export interface PersistedDashboardState {
  readonly observations: readonly Observation[];
  readonly scoringPolicy: ScoringPolicy;
}

export type DashboardStateRecovery =
  | { readonly kind: "corrupt"; readonly rawValue: string }
  | {
      readonly kind: "unsupported-version";
      readonly rawValue: string;
      readonly schemaVersion: number;
    };

export type DashboardStateLoadResult =
  | { readonly status: "missing" }
  | {
      readonly status: "valid";
      readonly state: PersistedDashboardState;
      readonly updatedAt: string;
    }
  | { readonly rawValue: string; readonly status: "corrupt" }
  | {
      readonly rawValue: string;
      readonly schemaVersion: number;
      readonly status: "unsupported-version";
    }
  | { readonly status: "unavailable" };

export type DashboardStateSaveResult =
  | { readonly status: "saved"; readonly updatedAt: string }
  | { readonly status: "failed" }
  | { readonly status: "unavailable" };

export type DashboardStateClearResult =
  { readonly status: "cleared" } | { readonly status: "unavailable" };

export interface DashboardStateStore {
  load(): DashboardStateLoadResult;
  save(state: PersistedDashboardState): DashboardStateSaveResult;
  clear(): DashboardStateClearResult;
}
