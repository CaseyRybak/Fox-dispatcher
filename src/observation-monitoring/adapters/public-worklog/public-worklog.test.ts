import { describe, expect, it } from "vitest";

import { parsePublicWorklog, publicWorklog } from "./public-worklog";

const validCheckpoint = {
  id: "scope-and-contract",
  stage: "01 · Постановка задачи",
  date: "2026-07-16",
  goal: "Зафиксировать проверяемый результат.",
  aiContribution: "AI сопоставил требования с продуктовой структурой.",
  humanDecision: "Выбран сценарий «Лисий диспетчер».",
  change: "Появился продуктовый контракт.",
  verification: "Требования связаны с приёмочными примерами.",
  evidence: [
    {
      label: "Продуктовый контракт",
      kind: "specification",
      href: "https://github.com/CaseyRybak/Fox-dispatcher/blob/cbaf165bda86ab629b30ed19f226d81af14ed35e/docs/product-specs/fox-dispatcher.md",
    },
  ],
};

describe("public AI Worklog boundary", () => {
  it("loads six immutable, evidence-backed public checkpoints", () => {
    expect(publicWorklog).toHaveLength(6);
    expect(Object.isFrozen(publicWorklog)).toBe(true);

    for (const checkpoint of publicWorklog) {
      expect(Object.isFrozen(checkpoint)).toBe(true);
      expect(Object.isFrozen(checkpoint.evidence)).toBe(true);
      expect(checkpoint.evidence.length).toBeGreaterThan(0);
      expect(checkpoint.evidence[0]?.href).toMatch(
        /^https:\/\/github\.com\/CaseyRybak\/Fox-dispatcher\/blob\/[0-9a-f]{40}\//,
      );
    }
  });

  it("rejects an incomplete timeline and mutable evidence URLs", () => {
    expect(() => parsePublicWorklog([validCheckpoint])).toThrow();

    expect(() =>
      parsePublicWorklog(
        Array.from({ length: 5 }, (_, index) => ({
          ...validCheckpoint,
          id: `checkpoint-${index}`,
          evidence: [
            {
              ...validCheckpoint.evidence[0],
              href: "https://github.com/CaseyRybak/Fox-dispatcher/blob/main/README.md",
            },
          ],
        })),
      ),
    ).toThrow();
  });

  it("rejects private paths and credential-shaped content", () => {
    for (const unsafeText of [
      "/home/example/private-notes.txt",
      "github_pat_AAAAAAAAAAAAAAAAAAAA",
    ]) {
      expect(() =>
        parsePublicWorklog(
          Array.from({ length: 5 }, (_, index) => ({
            ...validCheckpoint,
            id: `checkpoint-${index}`,
            aiContribution: unsafeText,
          })),
        ),
      ).toThrow();
    }
  });
});
