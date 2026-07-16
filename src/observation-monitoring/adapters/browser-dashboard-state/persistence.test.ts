import { describe, expect, it } from "vitest";

import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  DASHBOARD_STORAGE_KEY,
  createBrowserDashboardStateStore,
} from "@/observation-monitoring/adapters/browser-dashboard-state/browser-dashboard-state";

const timestamp = "2026-07-16T10:20:30.000Z";

describe("browser dashboard state adapter", () => {
  it("distinguishes missing data and restores a strict version 1 envelope", () => {
    const storage = new MemoryStorage();
    const store = createBrowserDashboardStateStore({
      now: () => timestamp,
      storage: () => storage,
    });

    expect(store.load()).toEqual({ status: "missing" });
    expect(
      store.save({
        observations: starterObservations,
        scoringPolicy: { preyWeightPercent: 30 },
      }),
    ).toEqual({ status: "saved", updatedAt: timestamp });
    expect(store.load()).toEqual({
      status: "valid",
      state: {
        observations: starterObservations,
        scoringPolicy: { preyWeightPercent: 30 },
      },
      updatedAt: timestamp,
    });
  });

  it("rejects corrupt and unsupported values without overwriting them", () => {
    const corruptStorage = new MemoryStorage({
      [DASHBOARD_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        observations: starterObservations,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: timestamp,
        leakedField: true,
      }),
    });
    const unsupportedStorage = new MemoryStorage({
      [DASHBOARD_STORAGE_KEY]: JSON.stringify({ schemaVersion: 2 }),
    });

    expect(
      createBrowserDashboardStateStore({
        now: () => timestamp,
        storage: () => corruptStorage,
      }).load(),
    ).toEqual({ status: "corrupt" });
    expect(
      createBrowserDashboardStateStore({
        now: () => timestamp,
        storage: () => unsupportedStorage,
      }).load(),
    ).toEqual({ status: "unsupported-version" });
    expect(corruptStorage.getItem(DASHBOARD_STORAGE_KEY)).toContain(
      "leakedField",
    );
  });

  it("classifies malformed versions as corrupt and future integers as unsupported", () => {
    const createStore = (schemaVersion: unknown) =>
      createBrowserDashboardStateStore({
        storage: () =>
          new MemoryStorage({
            [DASHBOARD_STORAGE_KEY]: JSON.stringify({ schemaVersion }),
          }),
      });

    expect(createStore("1").load()).toEqual({ status: "corrupt" });
    expect(createStore(null).load()).toEqual({ status: "corrupt" });
    expect(createStore(2).load()).toEqual({ status: "unsupported-version" });
  });

  it.each([
    [
      "duplicate observation ids",
      {
        observations: [starterObservations[0], starterObservations[0]],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: timestamp,
      },
    ],
    [
      "more than 1000 observations",
      {
        observations: Array.from({ length: 1001 }, (_, index) => ({
          ...starterObservations[0],
          id: `obs_${index}`,
        })),
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: timestamp,
      },
    ],
    [
      "an invalid observation time",
      {
        observations: [{ ...starterObservations[0], time: "24:00" }],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: timestamp,
      },
    ],
    [
      "an invalid policy step",
      {
        observations: starterObservations,
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 21 },
        updatedAt: timestamp,
      },
    ],
    [
      "a non-canonical UTC timestamp",
      {
        observations: starterObservations,
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: "2026-07-16T10:20:30Z",
      },
    ],
  ])("rejects %s", (_description, envelope) => {
    const storage = new MemoryStorage({
      [DASHBOARD_STORAGE_KEY]: JSON.stringify(envelope),
    });

    expect(
      createBrowserDashboardStateStore({ storage: () => storage }).load(),
    ).toEqual({ status: "corrupt" });
  });

  it("reports unavailable storage and failed saves without throwing", () => {
    const unavailable = createBrowserDashboardStateStore({
      now: () => timestamp,
      storage: () => {
        throw new Error("blocked");
      },
    });
    const failedSave = createBrowserDashboardStateStore({
      now: () => timestamp,
      storage: () =>
        new MemoryStorage({}, () => {
          throw new Error("quota");
        }),
    });

    expect(unavailable.load()).toEqual({ status: "unavailable" });
    expect(unavailable.clear()).toEqual({ status: "unavailable" });
    expect(
      unavailable.save({
        observations: starterObservations,
        scoringPolicy: { preyWeightPercent: 20 },
      }),
    ).toEqual({ status: "unavailable" });
    expect(
      failedSave.save({
        observations: starterObservations,
        scoringPolicy: { preyWeightPercent: 20 },
      }),
    ).toEqual({ status: "failed" });
  });
});

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();
  readonly #onSet?: () => void;

  constructor(
    values: Readonly<Record<string, string>> = {},
    onSet?: () => void,
  ) {
    Object.entries(values).forEach(([key, value]) =>
      this.#values.set(key, value),
    );
    this.#onSet = onSet;
  }

  get length() {
    return this.#values.size;
  }

  clear() {
    this.#values.clear();
  }

  getItem(key: string) {
    return this.#values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.#values.delete(key);
  }

  setItem(key: string, value: string) {
    this.#onSet?.();
    this.#values.set(key, value);
  }
}
