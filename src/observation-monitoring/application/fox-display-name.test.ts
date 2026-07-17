import { describe, expect, it } from "vitest";

import {
  formatFoxDisplayName,
  formatFoxDisplayNameList,
  formatFoxIdentityLabel,
  hasDistinctFoxDisplayName,
} from "./fox-display-name";

describe("fox display names", () => {
  it.each([
    ["fox_001", "Лиса 1"],
    ["fox_002", "Лиса 2"],
    ["fox_010", "Лиса 10"],
  ])("shows %s as %s", (foxId, expected) => {
    expect(formatFoxDisplayName(foxId)).toBe(expected);
  });

  it("keeps a custom identifier visible when it has no numeric fox suffix", () => {
    expect(formatFoxDisplayName("fox_special")).toBe("Лиса «fox_special»");
  });

  it("never gives distinct identifiers the same display name", () => {
    const foxIds = ["fox_1", "fox_01", "fox_001", "fox_012", "fox_special"];
    const displayNames = foxIds.map((foxId) => formatFoxDisplayName(foxId));

    expect(new Set(displayNames).size).toBe(foxIds.length);
    expect(formatFoxDisplayName("fox_001")).toBe("Лиса 1");
    expect(formatFoxDisplayName("fox_012")).toBe("Лиса 12");
  });

  it("lists every numbered fox in natural Russian", () => {
    expect(formatFoxDisplayNameList(["fox_003", "fox_005"])).toBe("Лисы 3 и 5");
    expect(formatFoxDisplayNameList(["fox_002", "fox_003", "fox_005"])).toBe(
      "Лисы 2, 3 и 5",
    );
  });

  it("keeps the canonical identifier in an accessible identity label", () => {
    expect(formatFoxIdentityLabel("fox_001")).toBe(
      "Лиса 1, идентификатор fox_001",
    );
    expect(formatFoxIdentityLabel("fox_special")).toBe(
      "Лиса «fox_special», идентификатор fox_special",
    );
  });

  it("only requests a secondary canonical label for friendly names", () => {
    expect(hasDistinctFoxDisplayName("fox_001")).toBe(true);
    expect(hasDistinctFoxDisplayName("fox_special")).toBe(true);
  });
});
