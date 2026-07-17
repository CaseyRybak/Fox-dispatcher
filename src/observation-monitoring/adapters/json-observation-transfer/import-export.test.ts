import { describe, expect, it, vi } from "vitest";

import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import { MAX_IMPORT_BYTES } from "@/observation-monitoring/application/observation-transfer";

import {
  createBrowserObservationExporter,
  createJsonObservationImportParser,
  createObservationExportDocument,
  readObservationImportFile,
} from "./json-observation-transfer";

describe("JSON observation import", () => {
  const parser = createJsonObservationImportParser();

  it("validates and normalizes a complete array before producing preview facts", () => {
    const source = JSON.stringify([
      ...starterObservations,
      {
        color: " белая ",
        fox_id: " fox_005 ",
        has_prey: false,
        id: " obs_006 ",
        location: " Речной берег ",
        suspicion_level: 6,
        time: "13:45",
      },
    ]);

    const result = parser.parse(source);

    expect(result).toMatchObject({
      ok: true,
      preview: {
        foxCount: 5,
        locationCount: 4,
        locations: [
          "Моховой овраг",
          "Речной берег",
          "Северная поляна",
          "Туманная тропа",
        ],
        observationCount: 6,
        timeRange: { end: "13:45", start: "08:20" },
      },
    });
    if (!result.ok) throw new Error("Expected a valid preview");
    expect(result.observations[5]).toMatchObject({
      color: "белая",
      fox_id: "fox_005",
      id: "obs_006",
      location: "Речной берег",
    });
    expect(result.sourceBytes).toBe(new TextEncoder().encode(source).length);
  });

  it("accepts an empty array only as an explicit zero preview", () => {
    expect(parser.parse("[]")).toEqual({
      observations: [],
      ok: true,
      preview: {
        foxCount: 0,
        locationCount: 0,
        locations: [],
        observationCount: 0,
      },
      sourceBytes: 2,
    });
  });

  it("reports stable field paths and keeps strict/duplicate failures atomic", () => {
    const invalid = JSON.stringify([
      starterObservations[0],
      starterObservations[1],
      {
        ...starterObservations[2],
        extra: "must not disappear",
        suspicion_level: 11,
      },
      { ...starterObservations[0] },
    ]);

    const result = parser.parse(invalid);

    expect(result).toMatchObject({ ok: false, reason: "schema" });
    if (result.ok) throw new Error("Expected schema errors");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          message: "ожидается целое число от 0 до 10",
          path: "[2].suspicion_level",
        },
        {
          message: "неизвестное поле: extra",
          path: "[2]",
        },
        { message: "id должен быть уникальным", path: "[3].id" },
      ]),
    );
    expect("observations" in result).toBe(false);
  });

  it("uses correct Russian error grammar for larger imported sets", () => {
    const result = parser.parse(
      JSON.stringify(
        Array.from({ length: 21 }, (_, index) => ({
          ...starterObservations[0],
          extra: true,
          id: `obs_error_${index}`,
        })),
      ),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "schema",
      summary: "Проверьте данные: 21 ошибку",
    });
  });

  it("rejects empty text, malformed JSON, and multibyte text over 2 MiB before parse", () => {
    expect(parser.parse("  ")).toMatchObject({ ok: false, reason: "empty" });
    expect(parser.parse("not json")).toMatchObject({
      ok: false,
      reason: "syntax",
    });

    const oversized = `"${"я".repeat(MAX_IMPORT_BYTES / 2)}"`;
    expect(new TextEncoder().encode(oversized).length).toBeGreaterThan(
      MAX_IMPORT_BYTES,
    );
    expect(parser.parse(oversized)).toMatchObject({
      ok: false,
      reason: "too-large",
      sourceBytes: expect.any(Number),
    });
  });

  it("trusts a premeasured oversized file boundary without parsing its text", () => {
    expect(parser.parse("[]", MAX_IMPORT_BYTES + 1)).toEqual({
      issues: [
        {
          message: "Выберите меньший файл или сократите вставленный текст.",
          path: "[]",
        },
      ],
      ok: false,
      reason: "too-large",
      sourceBytes: MAX_IMPORT_BYTES + 1,
      summary: "JSON больше 2 МиБ",
    });
  });
});

describe("JSON import file boundary", () => {
  it("checks file size before reading and rejects invalid UTF-8", async () => {
    const oversizedRead = vi.fn();
    expect(
      await readObservationImportFile({
        arrayBuffer: oversizedRead,
        name: "large.json",
        size: MAX_IMPORT_BYTES + 1,
      }),
    ).toMatchObject({ fileName: "large.json", ok: false, reason: "too-large" });
    expect(oversizedRead).not.toHaveBeenCalled();

    expect(
      await readObservationImportFile({
        arrayBuffer: async () => new Uint8Array([0xc3, 0x28]).buffer,
        name: "broken.json",
        size: 2,
      }),
    ).toEqual({
      fileName: "broken.json",
      ok: false,
      reason: "invalid-utf8",
      summary: "Файл не является корректным UTF-8 JSON",
    });

    expect(
      await readObservationImportFile({
        arrayBuffer: async () => {
          throw new TypeError("read interrupted");
        },
        name: "unreadable.json",
        size: 128,
      }),
    ).toEqual({
      fileName: "unreadable.json",
      ok: false,
      reason: "read-failed",
      summary: "Файл не удалось прочитать",
    });
  });
});

describe("JSON observation export", () => {
  it("creates a deterministic full-data artifact that round-trips through import", () => {
    const artifact = createObservationExportDocument(starterObservations);

    expect(artifact.fileName).toBe("fox-dispatcher-observations.json");
    expect(artifact.mimeType).toBe("application/json;charset=utf-8");
    expect(artifact.content.endsWith("\n")).toBe(true);
    expect(artifact.content).toBe(
      `${JSON.stringify(starterObservations, null, 2)}\n`,
    );
    expect(
      createJsonObservationImportParser().parse(artifact.content),
    ).toMatchObject({
      ok: true,
      observations: starterObservations,
    });
  });

  it("downloads locally and always revokes the temporary object URL", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const append = vi.fn();
    const revokeObjectURL = vi.fn();
    const exporter = createBrowserObservationExporter({
      appendAnchor: append,
      createAnchor: () => ({ click, download: "", href: "", remove }),
      createObjectURL: () => "blob:fox-export",
      revokeObjectURL,
    });

    expect(exporter.export(starterObservations)).toEqual({
      fileName: "fox-dispatcher-observations.json",
      status: "exported",
    });
    expect(append).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fox-export");
  });

  it("reports a browser failure without throwing", () => {
    const exporter = createBrowserObservationExporter({
      appendAnchor: vi.fn(),
      createAnchor: () => {
        throw new Error("blocked");
      },
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    });

    expect(exporter.export(starterObservations)).toEqual({ status: "failed" });
  });
});
