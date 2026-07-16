import { z } from "zod";

import starterObservationJson from "./starter-observations.json";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const observationSchema = z.strictObject({
  id: z.string().trim().min(1).max(64),
  fox_id: z.string().trim().min(1).max(64),
  location: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  has_prey: z.boolean(),
  suspicion_level: z.number().int().min(0).max(10),
  time: z.string().regex(timePattern),
});

const starterObservationSchema = z
  .array(observationSchema)
  .length(5)
  .superRefine((observations, context) => {
    const ids = new Set<string>();

    observations.forEach(({ id }, index) => {
      if (ids.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate observation id: ${id}`,
          path: [index, "id"],
        });
      }

      ids.add(id);
    });
  });

const parsedStarterObservations = starterObservationSchema.parse(
  starterObservationJson,
);

export const starterObservations = Object.freeze(
  parsedStarterObservations.map((observation) => Object.freeze(observation)),
);
