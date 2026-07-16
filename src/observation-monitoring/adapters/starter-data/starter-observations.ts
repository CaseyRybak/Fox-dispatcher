import { observationArraySchema } from "@/observation-monitoring/adapters/observation-schema";

import starterObservationJson from "./starter-observations.json";

const starterObservationSchema = observationArraySchema.refine(
  (observations) => observations.length === 5,
  "Expected the five assignment observations.",
);

const parsedStarterObservations = starterObservationSchema.parse(
  starterObservationJson,
);

export const starterObservations = Object.freeze(
  parsedStarterObservations.map((observation) => Object.freeze(observation)),
);
