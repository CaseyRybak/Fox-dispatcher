import { describe, expect, it } from "vitest";

import { reserveAvailablePort } from "./browser-preview-port.mjs";

describe("browser preview port allocation", () => {
  it("falls back to an owned available port when the preferred port is busy", async () => {
    const probedPorts = [];
    const probe = async (port) => {
      probedPorts.push(port);
      if (port === 4173) {
        throw Object.assign(new Error("busy"), { code: "EADDRINUSE" });
      }
      return 49152;
    };

    const port = await reserveAvailablePort(4173, probe);

    expect(port).toBe(49152);
    expect(probedPorts).toEqual([4173, 0]);
  });
});
