import { z } from "zod";

import type {
  DashboardStateStore,
  PersistedDashboardState,
} from "@/observation-monitoring/application/dashboard-state-store";
import { observationArraySchema } from "@/observation-monitoring/adapters/observation-schema";

export const DASHBOARD_STORAGE_KEY = "fox-dispatcher.dashboard";

const utcInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const utcInstantSchema = z
  .string()
  .regex(utcInstantPattern)
  .refine((value) => {
    const timestamp = Date.parse(value);
    return (
      Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
    );
  });
const scoringPolicySchema = z.strictObject({
  preyWeightPercent: z.number().int().min(0).max(100).multipleOf(5),
});
const envelopeSchema = z.strictObject({
  observations: observationArraySchema,
  schemaVersion: z.literal(1),
  scoringPolicy: scoringPolicySchema,
  updatedAt: utcInstantSchema,
});

interface BrowserDashboardStateDependencies {
  readonly now?: () => string;
  readonly storage?: () => Storage;
}

export function createBrowserDashboardStateStore(
  dependencies: BrowserDashboardStateDependencies = {},
): DashboardStateStore {
  const getStorage = dependencies.storage ?? (() => window.localStorage);
  const now = dependencies.now ?? (() => new Date().toISOString());

  return {
    clear() {
      try {
        getStorage().removeItem(DASHBOARD_STORAGE_KEY);
        return { status: "cleared" };
      } catch {
        return { status: "unavailable" };
      }
    },
    load() {
      let rawValue: string | null;
      try {
        rawValue = getStorage().getItem(DASHBOARD_STORAGE_KEY);
      } catch {
        return { status: "unavailable" };
      }
      if (rawValue === null) return { status: "missing" };

      let candidate: unknown;
      try {
        candidate = JSON.parse(rawValue);
      } catch {
        return { rawValue, status: "corrupt" };
      }
      if (
        typeof candidate === "object" &&
        candidate !== null &&
        "schemaVersion" in candidate &&
        typeof candidate.schemaVersion === "number" &&
        Number.isInteger(candidate.schemaVersion) &&
        candidate.schemaVersion > 1
      ) {
        return {
          rawValue,
          schemaVersion: candidate.schemaVersion,
          status: "unsupported-version",
        };
      }

      const parsed = envelopeSchema.safeParse(candidate);
      if (!parsed.success) return { rawValue, status: "corrupt" };

      return {
        state: {
          observations: parsed.data.observations,
          scoringPolicy: parsed.data.scoringPolicy,
        },
        status: "valid",
        updatedAt: parsed.data.updatedAt,
      };
    },
    save(state: PersistedDashboardState) {
      const updatedAt = now();
      const parsed = envelopeSchema.safeParse({
        observations: state.observations,
        schemaVersion: 1,
        scoringPolicy: state.scoringPolicy,
        updatedAt,
      });
      if (!parsed.success) return { status: "failed" };

      let storage: Storage;
      try {
        storage = getStorage();
      } catch {
        return { status: "unavailable" };
      }

      try {
        storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(parsed.data));
        return { status: "saved", updatedAt };
      } catch {
        return { status: "failed" };
      }
    },
  };
}
