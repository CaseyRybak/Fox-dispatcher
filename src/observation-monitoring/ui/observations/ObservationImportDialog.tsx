import { useEffect, useRef, useState } from "react";

import type {
  ObservationImportFile,
  ObservationImportFileResult,
  ObservationImportResult,
} from "@/observation-monitoring/application/observation-transfer";

interface ObservationImportDialogProps {
  readonly onClose: () => void;
  readonly onReadFile: (
    file: ObservationImportFile,
  ) => Promise<ObservationImportFileResult>;
  readonly onReplace: (
    observations: Extract<
      ObservationImportResult,
      { ok: true }
    >["observations"],
  ) => void;
  readonly onValidate: (
    text: string,
    measuredBytes?: number,
  ) => ObservationImportResult;
  readonly open: boolean;
}

interface FileBoundaryError {
  readonly issues: readonly {
    readonly message: string;
    readonly path: string;
  }[];
  readonly summary: string;
}

interface ImportSourceState {
  readonly fileName?: string;
  readonly measuredBytes?: number;
  readonly text: string;
}

export function ObservationImportDialog({
  onClose,
  onReadFile,
  onReplace,
  onValidate,
  open,
}: ObservationImportDialogProps) {
  const [source, setSource] = useState<ImportSourceState>({ text: "" });
  const [fileAttemptName, setFileAttemptName] = useState<string>();
  const [result, setResult] = useState<ObservationImportResult>();
  const [fileError, setFileError] = useState<FileBoundaryError>();
  const [isReading, setIsReading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fileReadIdRef = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      sourceRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if ((result && !result.ok) || fileError) errorRef.current?.focus();
  }, [fileError, result]);

  const validationError = result && !result.ok ? result : fileError;
  const sourceValidationError = result && !result.ok ? result : undefined;
  const preview = result?.ok ? result : undefined;
  const fileStatus = isReading
    ? `Чтение файла: ${fileAttemptName}`
    : fileError
      ? `Не прочитан: ${fileAttemptName}. Сохранённый черновик не изменён.`
      : source.fileName
        ? `Файл: ${source.fileName}`
        : undefined;

  function changeSource(nextSource: string) {
    fileReadIdRef.current += 1;
    setSource({ text: nextSource });
    setFileAttemptName(undefined);
    setIsReading(false);
    setResult(undefined);
    setFileError(undefined);
  }

  async function chooseFile(file: ObservationImportFile | undefined) {
    if (!file) return;
    const readId = fileReadIdRef.current + 1;
    fileReadIdRef.current = readId;
    setFileAttemptName(file.name);
    setFileError(undefined);
    setIsReading(true);
    setResult(undefined);
    const readResult = await onReadFile(file);
    if (fileReadIdRef.current !== readId) return;
    setIsReading(false);
    if (!readResult.ok) {
      setFileError({
        issues: [
          {
            message:
              readResult.reason === "too-large"
                ? "Выберите файл меньше 2 МиБ."
                : "Выберите другой UTF-8 JSON-файл или вставьте текст вручную.",
            path: "[]",
          },
        ],
        summary: readResult.summary,
      });
      return;
    }

    setSource({
      fileName: readResult.fileName,
      measuredBytes: readResult.sourceBytes,
      text: readResult.text,
    });
    setFileAttemptName(undefined);
    setFileError(undefined);
    sourceRef.current?.focus();
  }

  return (
    <dialog
      aria-labelledby="observation-import-title"
      aria-modal="true"
      className="observation-import-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <div className="import-dialog__header">
        <div>
          <p className="eyebrow">Полная замена набора</p>
          <h2 id="observation-import-title">Импорт наблюдений</h2>
        </div>
        <p>JSON проверяется локально. До подтверждения журнал не изменится.</p>
      </div>

      <div className="import-dialog__source">
        <label className="import-file-field">
          <span>Выбрать JSON-файл</span>
          <input
            accept=".json,application/json"
            aria-describedby={joinIds(
              fileStatus ? "observation-import-file-status" : undefined,
              fileError ? "observation-import-error" : undefined,
            )}
            aria-invalid={Boolean(fileError)}
            className="import-file-input"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              void chooseFile(file);
            }}
            type="file"
          />
        </label>
        {fileStatus && (
          <p
            aria-live="polite"
            className="import-file-name"
            id="observation-import-file-status"
          >
            {fileStatus}
          </p>
        )}

        <label
          className="import-source-field"
          htmlFor="observation-import-source"
        >
          JSON наблюдений
        </label>
        <textarea
          aria-describedby={joinIds(
            "observation-import-hint",
            sourceValidationError ? "observation-import-error" : undefined,
          )}
          aria-invalid={Boolean(sourceValidationError)}
          id="observation-import-source"
          onChange={(event) => changeSource(event.target.value)}
          ref={sourceRef}
          spellCheck={false}
          value={source.text}
        />
        <p className="field-hint" id="observation-import-hint">
          Массив до 1000 записей и 2 МиБ UTF-8. Все поля проверяются строго.
        </p>
      </div>

      {validationError && (
        <div
          className="import-error-summary"
          id="observation-import-error"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          <strong>{validationError.summary}</strong>
          <ul>
            {validationError.issues.map((issue, index) => (
              <li key={`${issue.path}-${issue.message}-${index}`}>
                <code>{issue.path}</code> - {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview && (
        <section aria-label="Предпросмотр импорта" className="import-preview">
          <div className="import-preview__heading">
            <div>
              <p className="eyebrow">Данные прошли проверку</p>
              <h3>Перед заменой</h3>
            </div>
            <span>{formatBytes(preview.sourceBytes)}</span>
          </div>
          <dl>
            <div>
              <dt>Записи</dt>
              <dd>
                {pluralize(
                  preview.preview.observationCount,
                  "наблюдение",
                  "наблюдения",
                  "наблюдений",
                )}
              </dd>
            </div>
            <div>
              <dt>Лисы</dt>
              <dd>
                {pluralize(preview.preview.foxCount, "лиса", "лисы", "лис")}
              </dd>
            </div>
            <div>
              <dt>Локации</dt>
              <dd>
                {pluralize(
                  preview.preview.locationCount,
                  "локация",
                  "локации",
                  "локаций",
                )}
              </dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>
                {preview.preview.timeRange
                  ? `${preview.preview.timeRange.start}-${preview.preview.timeRange.end}`
                  : "Нет записей"}
              </dd>
            </div>
          </dl>
          {preview.preview.locations.length > 0 && (
            <p>Локации: {preview.preview.locations.join(" · ")}</p>
          )}
          <p className="import-preview__warning">
            Текущие наблюдения будут заменены. Вес расчёта сохранится, фильтры
            сбросятся.
          </p>
        </section>
      )}

      <div className="import-dialog__footer">
        <button className="secondary-action" onClick={onClose} type="button">
          Закрыть
        </button>
        <button
          className="secondary-action"
          disabled={isReading || Boolean(fileError)}
          onClick={() => {
            setResult(onValidate(source.text, source.measuredBytes));
          }}
          type="button"
        >
          Проверить данные
        </button>
        {preview && (
          <button
            className="danger-action"
            onClick={() => {
              onReplace(preview.observations);
              setSource({ text: "" });
              setFileAttemptName(undefined);
              setResult(undefined);
              setIsReading(false);
            }}
            type="button"
          >
            {replacementLabel(preview.preview.observationCount)}
          </button>
        )}
      </div>
    </dialog>
  );
}

function joinIds(...ids: readonly (string | undefined)[]) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function replacementLabel(count: number) {
  if (count === 0) return "Заменить на пустой набор";
  return `Заменить на ${pluralize(count, "наблюдение", "наблюдения", "наблюдений")}`;
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word =
    mod100 >= 11 && mod100 <= 14
      ? many
      : mod10 === 1
        ? one
        : mod10 >= 2 && mod10 <= 4
          ? few
          : many;
  return `${count} ${word}`;
}

function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} Б` : `${(bytes / 1024).toFixed(1)} КиБ`;
}
