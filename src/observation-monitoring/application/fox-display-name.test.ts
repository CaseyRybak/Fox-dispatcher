import { describe, expect, it } from "vitest";

import {
  formatFoxDisplayName,
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
    expect(formatFoxDisplayName("fox_special")).toBe("fox_special");
  });

  it("keeps the canonical identifier in an accessible identity label", () => {
    expect(formatFoxIdentityLabel("fox_001")).toBe(
      "Лиса 1, идентификатор fox_001",
    );
    expect(formatFoxIdentityLabel("fox_special")).toBe("fox_special");
  });

  it("only requests a secondary canonical label for friendly names", () => {
    expect(hasDistinctFoxDisplayName("fox_001")).toBe(true);
    expect(hasDistinctFoxDisplayName("fox_special")).toBe(false);
  });
});
