import { z } from "zod";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const observationSchema = z.strictObject({
  id: z.string().trim().min(1).max(64),
  fox_id: z.string().trim().min(1).max(64),
  fox_name: z.string().trim().min(1).max(64).optional(),
  location: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  has_prey: z.boolean(),
  suspicion_level: z.number().int().min(0).max(10),
  time: z.string().trim().regex(timePattern),
});

export const observationArraySchema = z
  .array(observationSchema)
  .max(1000)
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
