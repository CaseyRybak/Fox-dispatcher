import type { z } from "zod";

import {
  MAX_IMPORT_BYTES,
  OBSERVATION_EXPORT_FILE_NAME,
  OBSERVATION_EXPORT_MIME_TYPE,
  type ObservationExportDocument,
  type ObservationExporter,
  type ObservationImportFile,
  type ObservationImportFileResult,
  type ObservationImportIssue,
  type ObservationImportParser,
  type ObservationImportPreview,
  type ObservationImportResult,
} from "@/observation-monitoring/application/observation-transfer";
import { observationArraySchema } from "@/observation-monitoring/adapters/observation-schema";

interface AnchorLike {
  download: string;
  href: string;
  click(): void;
  remove(): void;
}

interface BrowserExporterDependencies {
  readonly appendAnchor?: (anchor: AnchorLike) => void;
  readonly createAnchor?: () => AnchorLike;
  readonly createObjectURL?: (blob: Blob) => string;
  readonly revokeObjectURL?: (url: string) => void;
}

type AcceptedObservation = z.infer<typeof observationArraySchema>[number];

export function createJsonObservationImportParser(): ObservationImportParser {
  return {
    parse(text, measuredBytes) {
      const sourceBytes =
        measuredBytes ?? new TextEncoder().encode(text).byteLength;
      if (sourceBytes > MAX_IMPORT_BYTES) {
        return importFailure(
          "too-large",
          "JSON больше 2 МиБ",
          "Выберите меньший файл или сократите вставленный текст.",
          sourceBytes,
        );
      }
      if (text.trim().length === 0) {
        return importFailure(
          "empty",
          "Добавьте JSON для проверки",
          "Вставьте массив наблюдений или выберите JSON-файл.",
          sourceBytes,
        );
      }

      let candidate: unknown;
      try {
        candidate = JSON.parse(text);
      } catch {
        return importFailure(
          "syntax",
          "JSON не удалось прочитать",
          "Проверьте скобки, запятые и кавычки.",
          sourceBytes,
        );
      }

      const parsed = observationArraySchema.safeParse(candidate);
      if (!parsed.success) {
        const issues = parsed.error.issues.map(toImportIssue);
        for (const duplicate of findDuplicateIdIssues(candidate)) {
          if (
            !issues.some(
              ({ message, path }) =>
                message === duplicate.message && path === duplicate.path,
            )
          ) {
            issues.push(duplicate);
          }
        }
        return {
          issues,
          ok: false,
          reason: "schema",
          sourceBytes,
          summary: `Проверьте данные: ${issues.length} ${pluralizeErrors(issues.length)}`,
        };
      }

      return {
        observations: parsed.data,
        ok: true,
        preview: createPreview(parsed.data),
        sourceBytes,
      };
    },
  };
}

export async function readObservationImportFile(
  file: ObservationImportFile,
): Promise<ObservationImportFileResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    return {
      fileName: file.name,
      ok: false,
      reason: "too-large",
      summary: "JSON больше 2 МиБ",
    };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return {
      fileName: file.name,
      ok: false,
      reason: "read-failed",
      summary: "Файл не удалось прочитать",
    };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return {
      fileName: file.name,
      ok: true,
      sourceBytes: file.size,
      text,
    };
  } catch {
    return {
      fileName: file.name,
      ok: false,
      reason: "invalid-utf8",
      summary: "Файл не является корректным UTF-8 JSON",
    };
  }
}

export function createObservationExportDocument(
  observations: readonly AcceptedObservation[],
): ObservationExportDocument {
  return {
    content: `${JSON.stringify(observations, null, 2)}\n`,
    fileName: OBSERVATION_EXPORT_FILE_NAME,
    mimeType: OBSERVATION_EXPORT_MIME_TYPE,
  };
}

export function createBrowserObservationExporter(
  dependencies: BrowserExporterDependencies = {},
): ObservationExporter {
  const createAnchor =
    dependencies.createAnchor ?? (() => document.createElement("a"));
  const appendAnchor =
    dependencies.appendAnchor ??
    ((anchor) => document.body.append(anchor as HTMLAnchorElement));
  const createObjectURL =
    dependencies.createObjectURL ?? ((blob) => URL.createObjectURL(blob));
  const revokeObjectURL =
    dependencies.revokeObjectURL ?? ((url) => URL.revokeObjectURL(url));

  return {
    export(observations) {
      let objectUrl: string | undefined;
      let anchor: AnchorLike | undefined;
      try {
        const artifact = createObservationExportDocument(observations);
        objectUrl = createObjectURL(
          new Blob([artifact.content], { type: artifact.mimeType }),
        );
        anchor = createAnchor();
        anchor.href = objectUrl;
        anchor.download = artifact.fileName;
        appendAnchor(anchor);
        anchor.click();
        return { fileName: artifact.fileName, status: "exported" };
      } catch {
        return { status: "failed" };
      } finally {
        anchor?.remove();
        if (objectUrl) revokeObjectURL(objectUrl);
      }
    },
  };
}

function createPreview(
  observations: readonly AcceptedObservation[],
): ObservationImportPreview {
  const locations = [
    ...new Set(observations.map(({ location }) => location)),
  ].sort(compareText);
  const times = observations.map(({ time }) => time).sort(compareText);

  return {
    foxCount: new Set(observations.map(({ fox_id }) => fox_id)).size,
    locationCount: locations.length,
    locations,
    observationCount: observations.length,
    ...(times.length > 0
      ? { timeRange: { end: times.at(-1)!, start: times[0]! } }
      : {}),
  };
}

function toImportIssue(issue: z.core.$ZodIssue): ObservationImportIssue {
  const path = formatPath(issue.path);
  const field = issue.path.at(-1);

  if (issue.code === "unrecognized_keys") {
    const keys = issue.keys.join(", ");
    return {
      message: `${issue.keys.length === 1 ? "неизвестное поле" : "неизвестные поля"}: ${keys}`,
      path,
    };
  }
  if (issue.code === "custom" && field === "id") {
    return { message: "id должен быть уникальным", path };
  }

  const messages: Readonly<Record<string, string>> = {
    color: "ожидается непустая строка до 80 символов",
    fox_id: "ожидается непустая строка до 64 символов",
    has_prey: "ожидается true или false",
    id: "ожидается непустая строка до 64 символов",
    location: "ожидается непустая строка до 80 символов",
    suspicion_level: "ожидается целое число от 0 до 10",
    time: "ожидается время в формате ЧЧ:ММ",
  };

  return {
    message:
      typeof field === "string"
        ? (messages[field] ?? "некорректное значение")
        : issue.code === "too_big"
          ? "допустимо не более 1000 наблюдений"
          : "ожидается массив наблюдений",
    path,
  };
}

function formatPath(path: readonly PropertyKey[]) {
  if (path.length === 0) return "[]";
  return path
    .map((segment) =>
      typeof segment === "number" ? `[${segment}]` : `.${String(segment)}`,
    )
    .join("")
    .replace(/^\./, "");
}

function findDuplicateIdIssues(candidate: unknown): ObservationImportIssue[] {
  if (!Array.isArray(candidate)) return [];
  const seen = new Set<string>();
  const issues: ObservationImportIssue[] = [];

  candidate.forEach((record, index) => {
    if (typeof record !== "object" || record === null || !("id" in record)) {
      return;
    }
    const id = record.id;
    if (typeof id !== "string") return;
    const normalizedId = id.trim();
    if (seen.has(normalizedId)) {
      issues.push({
        message: "id должен быть уникальным",
        path: `[${index}].id`,
      });
    }
    seen.add(normalizedId);
  });

  return issues;
}

function importFailure(
  reason: "empty" | "syntax" | "too-large",
  summary: string,
  message: string,
  sourceBytes: number,
): ObservationImportResult {
  return {
    issues: [{ message, path: "[]" }],
    ok: false,
    reason,
    sourceBytes,
    summary,
  };
}

function pluralizeErrors(count: number) {
  return count === 1 ? "ошибку" : count > 1 && count < 5 ? "ошибки" : "ошибок";
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}
