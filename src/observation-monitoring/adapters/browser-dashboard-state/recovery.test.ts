import { describe, expect, it } from "vitest";

import {
  DASHBOARD_STORAGE_KEY,
  createBrowserDashboardStateStore,
} from "./browser-dashboard-state";

describe("browser dashboard advanced recovery", () => {
  it("returns the exact corrupt raw value without overwriting it", () => {
    const rawValue = "{not valid json";
    const storage = new MemoryStorage(rawValue);
    const store = createBrowserDashboardStateStore({ storage: () => storage });

    expect(store.load()).toEqual({ rawValue, status: "corrupt" });
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBe(rawValue);
  });

  it("returns the exact future-version envelope for explicit recovery", () => {
    const rawValue = JSON.stringify({
      observations: [{ privateFutureField: "preserve exactly" }],
      schemaVersion: 42,
    });
    const storage = new MemoryStorage(rawValue);
    const store = createBrowserDashboardStateStore({ storage: () => storage });

    expect(store.load()).toEqual({
      rawValue,
      schemaVersion: 42,
      status: "unsupported-version",
    });
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBe(rawValue);
  });
});

class MemoryStorage implements Storage {
  #rawValue: string | null;

  constructor(rawValue: string) {
    this.#rawValue = rawValue;
  }

  get length() {
    return this.#rawValue === null ? 0 : 1;
  }

  clear() {
    this.#rawValue = null;
  }

  getItem(key: string) {
    return key === DASHBOARD_STORAGE_KEY ? this.#rawValue : null;
  }

  key(index: number) {
    return index === 0 && this.#rawValue !== null
      ? DASHBOARD_STORAGE_KEY
      : null;
  }

  removeItem(key: string) {
    if (key === DASHBOARD_STORAGE_KEY) this.#rawValue = null;
  }

  setItem(key: string, value: string) {
    if (key === DASHBOARD_STORAGE_KEY) this.#rawValue = value;
  }
}
