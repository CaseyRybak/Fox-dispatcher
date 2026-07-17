import { describe, expect, it } from "vitest";

import { formatFoxDisplayName } from "./fox-display-name";

describe("fox display names", () => {
  it.each([
    ["fox_001", "Лиса 1"],
    ["fox_002", "Лиса 2"],
    ["fox_010", "Лиса 10"],
  ])("shows %s as %s", (foxId, expected) => {
    expect(formatFoxDisplayName(foxId)).toBe(expected);
  });

  it("keeps a custom identifier visible when it has no numeric fox suffix", () => {
    expect(formatFoxDisplayName("fox_special")).toBe("fox_special");
  });
});
