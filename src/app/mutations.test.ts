import { describe, expect, it } from "vitest";

import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  addObservation,
  deleteObservation,
  editObservation,
  resetObservations,
  undoObservationDeletion,
  type ObservationDraft,
} from "@/observation-monitoring/application/observation-management";

const fixedId = "obs_123e4567-e89b-12d3-a456-426614174000";
const draft: ObservationDraft = {
  color: " белая ",
  foxId: " fox_005 ",
  hasPrey: false,
  location: " Речной берег ",
  suspicionLevel: 6,
  time: "13:45",
};

describe("observation management", () => {
  it("adds one normalized observation with an injected unique id", () => {
    const result = addObservation(starterObservations, draft, {
      create: () => fixedId,
    });

    expect(result).toEqual({
      ok: true,
      observations: [
        ...starterObservations,
        {
          color: "белая",
          fox_id: "fox_005",
          has_prey: false,
          id: fixedId,
          location: "Речной берег",
          suspicion_level: 6,
          time: "13:45",
        },
      ],
      observationId: fixedId,
    });
    expect(starterObservations).toHaveLength(5);
  });

  it("rejects invalid input and id generation without changing the set", () => {
    const invalid = addObservation(
      starterObservations,
      {
        ...draft,
        foxId: " ",
        hasPrey: "yes" as unknown as boolean,
        suspicionLevel: 11,
        time: "25:10",
      },
      { create: () => fixedId },
    );
    const collision = addObservation(starterObservations, draft, {
      create: () => "obs_001",
    });
    const unavailable = addObservation(starterObservations, draft, {
      create: () => {
        throw new Error("crypto unavailable");
      },
    });

    expect(invalid).toMatchObject({
      ok: false,
      fieldErrors: {
        foxId: expect.any(String),
        hasPrey: expect.any(String),
        suspicionLevel: expect.any(String),
        time: expect.any(String),
      },
    });
    expect(collision).toMatchObject({
      ok: false,
      formError: expect.any(String),
    });
    expect(unavailable).toMatchObject({
      ok: false,
      formError: "Не удалось создать ID наблюдения. Повторите сохранение.",
    });
  });

  it("does not add beyond the accepted 1000-record boundary", () => {
    const fullSet = Array.from({ length: 1000 }, (_, index) => ({
      ...starterObservations[0]!,
      id: `obs_existing_${index}`,
    }));

    expect(
      addObservation(fullSet, draft, { create: () => fixedId }),
    ).toMatchObject({
      ok: false,
      formError:
        "В журнале уже 1000 наблюдений. Удалите запись перед добавлением.",
    });
  });

  it("rejects wrong runtime field types without throwing", () => {
    const invalidDraft = {
      ...draft,
      color: null,
      foxId: 42,
      location: undefined,
    } as unknown as ObservationDraft;

    expect(() =>
      addObservation(starterObservations, invalidDraft, {
        create: () => fixedId,
      }),
    ).not.toThrow();
    expect(
      addObservation(starterObservations, invalidDraft, {
        create: () => fixedId,
      }),
    ).toMatchObject({
      fieldErrors: {
        color: expect.any(String),
        foxId: expect.any(String),
        location: expect.any(String),
      },
      ok: false,
    });
  });

  it("edits atomically while preserving the technical id", () => {
    const result = editObservation(starterObservations, "obs_005", {
      color: "рыжая",
      foxId: "fox_004",
      hasPrey: false,
      location: "Северная поляна",
      suspicionLevel: 10,
      time: "12:10",
    });

    expect(result).toMatchObject({ ok: true, observationId: "obs_005" });
    if (!result.ok) throw new Error("Expected edit to succeed");
    expect(result.observations[4]).toEqual({
      ...starterObservations[4],
      suspicion_level: 10,
    });
    expect(starterObservations[4]?.suspicion_level).toBe(3);
  });

  it("deletes, restores in the same position, and resets the exact starter set", () => {
    const deletion = deleteObservation(starterObservations, "obs_005");

    expect(deletion).toMatchObject({
      ok: true,
      observations: expect.not.arrayContaining([
        expect.objectContaining({ id: "obs_005" }),
      ]),
      undo: { index: 4, observation: starterObservations[4] },
    });
    if (!deletion.ok) throw new Error("Expected delete to succeed");

    const restored = undoObservationDeletion(
      deletion.observations,
      deletion.undo,
    );
    expect(restored).toEqual(starterObservations);

    const reset = resetObservations(
      [starterObservations[0]!],
      starterObservations,
    );
    expect(reset).toEqual(starterObservations);
    expect(reset).not.toBe(starterObservations);
  });
});
