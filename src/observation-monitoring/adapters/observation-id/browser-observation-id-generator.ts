import type { ObservationIdGenerator } from "@/observation-monitoring/application/observation-management";

export const browserObservationIdGenerator: ObservationIdGenerator = {
  create: () => `obs_${crypto.randomUUID()}`,
};
