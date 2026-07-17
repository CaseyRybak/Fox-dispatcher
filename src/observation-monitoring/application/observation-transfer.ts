import type { Observation } from "@/observation-monitoring/domain/observation";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const OBSERVATION_EXPORT_FILE_NAME = "fox-dispatcher-observations.json";
export const OBSERVATION_EXPORT_MIME_TYPE = "application/json;charset=utf-8";

export interface ObservationImportIssue {
  readonly message: string;
  readonly path: string;
}

export interface ObservationImportPreview {
  readonly foxCount: number;
  readonly locationCount: number;
  readonly locations: readonly string[];
  readonly observationCount: number;
  readonly timeRange?: {
    readonly end: string;
    readonly start: string;
  };
}

export type ObservationImportResult =
  | {
      readonly observations: readonly Observation[];
      readonly ok: true;
      readonly preview: ObservationImportPreview;
      readonly sourceBytes: number;
    }
  | {
      readonly issues: readonly ObservationImportIssue[];
      readonly ok: false;
      readonly reason: "empty" | "schema" | "syntax" | "too-large";
      readonly sourceBytes: number;
      readonly summary: string;
    };

export interface ObservationImportParser {
  parse(text: string, measuredBytes?: number): ObservationImportResult;
}

export interface ObservationImportFile {
  readonly name: string;
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type ObservationImportFileResult =
  | {
      readonly fileName: string;
      readonly ok: true;
      readonly sourceBytes: number;
      readonly text: string;
    }
  | {
      readonly fileName: string;
      readonly ok: false;
      readonly reason: "invalid-utf8" | "read-failed" | "too-large";
      readonly summary: string;
    };

export interface ObservationExportDocument {
  readonly content: string;
  readonly fileName: string;
  readonly mimeType: string;
}

export type ObservationExportResult =
  | { readonly fileName: string; readonly status: "exported" }
  | { readonly status: "failed" };

export interface ObservationExporter {
  export(observations: readonly Observation[]): ObservationExportResult;
}
