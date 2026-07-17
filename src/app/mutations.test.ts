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

const draft: ObservationDraft = {
  color: " белая ",
  foxName: " Лиса 5 ",
  hasPrey: false,
  location: " Речной берег ",
  suspicionLevel: 6,
  time: "13:45",
};

describe("observation management", () => {
  it("adds a new named fox with the nearest free sequential ids", () => {
    const result = addObservation(starterObservations, draft);

    expect(result).toEqual({
      ok: true,
      observations: [
        ...starterObservations,
        {
          color: "белая",
          fox_id: "fox_005",
          fox_name: "Лиса 5",
          has_prey: false,
          id: "obs_006",
          location: "Речной берег",
          suspicion_level: 6,
          time: "13:45",
        },
      ],
      observationId: "obs_006",
    });
    expect(starterObservations).toHaveLength(5);
  });

  it("reuses the id of an existing fox when its name is entered", () => {
    const result = addObservation(starterObservations, {
      ...draft,
      color: "серебристая",
      foxName: "  лиса 1  ",
    });

    expect(result).toMatchObject({ ok: true, observationId: "obs_006" });
    if (!result.ok) throw new Error("Expected add to succeed");
    expect(result.observations.at(-1)).toMatchObject({
      color: "рыжая",
      fox_id: "fox_001",
      fox_name: "Лиса 1",
    });
  });

  it("fills the nearest free fox and observation id gaps without losing the entered name", () => {
    const observationsWithGaps = starterObservations
      .filter(({ id }) => id !== "obs_002")
      .map((observation) =>
        observation.fox_id === "fox_002"
          ? { ...observation, fox_id: "fox_006" }
          : observation,
      );
    const result = addObservation(observationsWithGaps, {
      ...draft,
      foxName: "Лиса 12",
    });

    expect(result).toMatchObject({ ok: true, observationId: "obs_002" });
    if (!result.ok) throw new Error("Expected add to succeed");
    expect(result.observations.at(-1)).toMatchObject({
      fox_id: "fox_002",
      fox_name: "Лиса 12",
    });
  });

  it("rejects invalid input without changing the set", () => {
    const invalid = addObservation(starterObservations, {
      ...draft,
      foxName: " ",
      hasPrey: "yes" as unknown as boolean,
      suspicionLevel: 11,
      time: "25:10",
    });

    expect(invalid).toMatchObject({
      ok: false,
      fieldErrors: {
        foxName: expect.any(String),
        hasPrey: expect.any(String),
        suspicionLevel: expect.any(String),
        time: expect.any(String),
      },
    });
  });

  it("does not add beyond the accepted 1000-record boundary", () => {
    const fullSet = Array.from({ length: 1000 }, (_, index) => ({
      ...starterObservations[0]!,
      id: `obs_existing_${index}`,
    }));

    expect(addObservation(fullSet, draft)).toMatchObject({
      ok: false,
      formError:
        "В журнале уже 1000 наблюдений. Удалите запись перед добавлением.",
    });
  });

  it("rejects wrong runtime field types without throwing", () => {
    const invalidDraft = {
      ...draft,
      color: null,
      foxName: 42,
      location: undefined,
    } as unknown as ObservationDraft;

    expect(() =>
      addObservation(starterObservations, invalidDraft),
    ).not.toThrow();
    expect(addObservation(starterObservations, invalidDraft)).toMatchObject({
      fieldErrors: {
        color: expect.any(String),
        foxName: expect.any(String),
        location: expect.any(String),
      },
      ok: false,
    });
  });

  it("edits atomically while preserving the technical id", () => {
    const result = editObservation(starterObservations, "obs_005", {
      color: "серебристая",
      foxName: "Лиса 4",
      hasPrey: false,
      location: "Северная поляна",
      suspicionLevel: 10,
      time: "12:10",
    });

    expect(result).toMatchObject({ ok: true, observationId: "obs_005" });
    if (!result.ok) throw new Error("Expected edit to succeed");
    expect(result.observations[4]).toEqual({
      ...starterObservations[4],
      color: "рыжая",
      fox_name: "Лиса 4",
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
