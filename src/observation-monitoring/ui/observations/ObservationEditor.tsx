import {
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ObservationListItem } from "@/observation-monitoring/application/create-observation-set-overview";
import type {
  ObservationDraft,
  ObservationDraftErrors,
  ObservationMutationResult,
} from "@/observation-monitoring/application/observation-management";

interface ObservationEditorProps {
  readonly colorSuggestions: readonly string[];
  readonly initialObservation?: ObservationListItem;
  readonly locationSuggestions: readonly string[];
  readonly onCancel: () => void;
  readonly onDelete?: (observationId: string) => void;
  readonly onSave: (draft: ObservationDraft) => ObservationMutationResult;
}

interface EditorValues {
  readonly color: string;
  readonly foxId: string;
  readonly hasPrey: boolean | undefined;
  readonly location: string;
  readonly suspicionLevel: string;
  readonly time: string;
}

const emptyValues: EditorValues = {
  color: "",
  foxId: "",
  hasPrey: undefined,
  location: "",
  suspicionLevel: "",
  time: "",
};

export function ObservationEditor({
  colorSuggestions,
  initialObservation,
  locationSuggestions,
  onCancel,
  onDelete,
  onSave,
}: ObservationEditorProps) {
  const initialValues = useMemo(
    () =>
      initialObservation
        ? {
            color: initialObservation.color,
            foxId: initialObservation.foxId,
            hasPrey: initialObservation.hasPrey,
            location: initialObservation.location,
            suspicionLevel: String(initialObservation.suspicionLevel),
            time: initialObservation.time,
          }
        : emptyValues,
    [initialObservation],
  );
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ObservationDraftErrors>({});
  const [formError, setFormError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const headingId = useId();
  const title = initialObservation
    ? `Изменить наблюдение ${initialObservation.id}`
    : "Новое наблюдение";
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const continueEditingRef = useRef<HTMLButtonElement>(null);
  const restoreEditorFocusRef = useRef(false);
  const closingFromEditorRef = useRef(false);
  const dirtyRef = useRef(dirty);
  const onCancelRef = useRef(onCancel);
  const historyMarkerRef = useRef(`fox-observation-editor-${headingId}`);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const marker = historyMarkerRef.current;
    const markerState = { ...globalThis.history.state, foxEditor: marker };
    if (globalThis.history.state?.foxEditor !== marker) {
      globalThis.history.pushState(markerState, "", globalThis.location.href);
    }

    const handleBack = () => {
      if (closingFromEditorRef.current) return;
      if (dirtyRef.current) {
        globalThis.history.pushState(markerState, "", globalThis.location.href);
        setConfirmDiscard(true);
        return;
      }
      onCancelRef.current();
    };

    globalThis.addEventListener("popstate", handleBack);
    return () => globalThis.removeEventListener("popstate", handleBack);
  }, []);

  useEffect(() => {
    if (confirmDiscard) {
      continueEditingRef.current?.focus();
      return;
    }
    if (restoreEditorFocusRef.current) {
      restoreEditorFocusRef.current = false;
      firstFieldRef.current?.focus();
    }
  }, [confirmDiscard]);

  useEffect(() => {
    if (formError || Object.keys(fieldErrors).length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [fieldErrors, formError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSave({
      color: values.color,
      foxId: values.foxId,
      hasPrey: values.hasPrey,
      location: values.location,
      suspicionLevel:
        values.suspicionLevel === ""
          ? Number.NaN
          : Number(values.suspicionLevel),
      time: values.time,
    });

    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      setFormError(result.formError ?? "");
    } else {
      releaseEditorHistoryEntry();
    }
  }

  function releaseEditorHistoryEntry() {
    if (globalThis.history.state?.foxEditor === historyMarkerRef.current) {
      closingFromEditorRef.current = true;
      globalThis.history.back();
    }
  }

  function finishClose() {
    releaseEditorHistoryEntry();
    onCancel();
  }

  function requestClose() {
    if (dirty) {
      setConfirmDiscard(true);
    } else {
      finishClose();
    }
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (confirmDiscard) {
      restoreEditorFocusRef.current = true;
      setConfirmDiscard(false);
      return;
    }
    requestClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (!confirmDiscard || event.key !== "Tab") return;
    const actions = continueEditingRef.current?.closest(
      ".inline-confirmation__actions",
    );
    const buttons = actions?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons?.length) return;
    const first = buttons.item(0);
    const last = buttons.item(buttons.length - 1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function focusInvalidField(
    event: MouseEvent<HTMLAnchorElement>,
    field: string,
  ) {
    event.preventDefault();
    document.getElementById(`observation-${field}`)?.focus();
  }

  const errorEntries = Object.entries(fieldErrors);

  return (
    <dialog
      aria-modal="true"
      aria-labelledby={headingId}
      className="observation-editor"
      onCancel={handleDialogCancel}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div className="observation-editor__content" inert={confirmDiscard}>
        <div className="observation-editor__heading">
          <div>
            <p className="eyebrow">Редактор полевой записи</p>
            <h2 id={headingId}>{title}</h2>
          </div>
          <p className="data-id">
            {initialObservation?.id ?? "ID будет создан автоматически"}
          </p>
        </div>

        {(formError || errorEntries.length > 0) && (
          <div
            className="form-error-summary"
            ref={errorSummaryRef}
            role="alert"
            tabIndex={-1}
          >
            <strong>
              {formError ||
                `Проверьте ${errorEntries.length} ${pluralizeFields(errorEntries.length)}`}
            </strong>
            {errorEntries.length > 0 && (
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a
                      href={`#observation-${field}`}
                      onClick={(event) => focusInvalidField(event, field)}
                    >
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="observation-form__required-note">Все поля обязательны.</p>

        <form className="observation-form" noValidate onSubmit={submit}>
          <EditorField
            error={fieldErrors.foxId}
            hint="Идентификатор лисы, до 64 символов."
            id="foxId"
            label="Лиса"
          >
            <input
              aria-describedby={describedBy("foxId", fieldErrors.foxId)}
              aria-invalid={Boolean(fieldErrors.foxId)}
              id="observation-foxId"
              maxLength={64}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  foxId: event.target.value,
                }))
              }
              ref={firstFieldRef}
              required
              type="text"
              value={values.foxId}
            />
          </EditorField>

          <EditorField
            error={fieldErrors.location}
            hint="Место наблюдения, до 80 символов."
            id="location"
            label="Локация"
          >
            <input
              aria-describedby={describedBy("location", fieldErrors.location)}
              aria-invalid={Boolean(fieldErrors.location)}
              id="observation-location"
              list="observation-location-suggestions"
              maxLength={80}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              required
              type="text"
              value={values.location}
            />
            <SuggestionList
              id="observation-location-suggestions"
              values={locationSuggestions}
            />
          </EditorField>

          <EditorField
            error={fieldErrors.color}
            hint="Наблюдаемый цвет, до 80 символов."
            id="color"
            label="Цвет"
          >
            <input
              aria-describedby={describedBy("color", fieldErrors.color)}
              aria-invalid={Boolean(fieldErrors.color)}
              id="observation-color"
              list="observation-color-suggestions"
              maxLength={80}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
              required
              type="text"
              value={values.color}
            />
            <SuggestionList
              id="observation-color-suggestions"
              values={colorSuggestions}
            />
          </EditorField>

          <fieldset
            aria-describedby={describedBy("hasPrey", fieldErrors.hasPrey)}
            aria-invalid={Boolean(fieldErrors.hasPrey)}
            className="editor-field editor-field--prey"
            id="observation-hasPrey"
            tabIndex={-1}
          >
            <legend>Добыча</legend>
            <p className="field-hint" id="observation-hasPrey-hint">
              Была ли лиса замечена с добычей.
            </p>
            <div className="editor-radio-group">
              <label>
                <input
                  checked={values.hasPrey === true}
                  name="hasPrey"
                  onChange={() =>
                    setValues((current) => ({ ...current, hasPrey: true }))
                  }
                  required
                  type="radio"
                />
                Да
              </label>
              <label>
                <input
                  checked={values.hasPrey === false}
                  name="hasPrey"
                  onChange={() =>
                    setValues((current) => ({ ...current, hasPrey: false }))
                  }
                  required
                  type="radio"
                />
                Нет
              </label>
            </div>
            {fieldErrors.hasPrey && (
              <p className="field-error" id="observation-hasPrey-error">
                {fieldErrors.hasPrey}
              </p>
            )}
          </fieldset>

          <EditorField
            error={fieldErrors.suspicionLevel}
            hint="Целое число от 0 до 10."
            id="suspicionLevel"
            label="Оценка подозрительности"
          >
            <input
              aria-describedby={describedBy(
                "suspicionLevel",
                fieldErrors.suspicionLevel,
              )}
              aria-invalid={Boolean(fieldErrors.suspicionLevel)}
              id="observation-suspicionLevel"
              max={10}
              min={0}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  suspicionLevel: event.target.value,
                }))
              }
              required
              step={1}
              type="number"
              value={values.suspicionLevel}
            />
          </EditorField>

          <EditorField
            error={fieldErrors.time}
            hint="Время наблюдения в 24-часовом формате."
            id="time"
            label="Время"
          >
            <input
              aria-describedby={describedBy("time", fieldErrors.time)}
              aria-invalid={Boolean(fieldErrors.time)}
              id="observation-time"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              required
              type="time"
              value={values.time}
            />
          </EditorField>

          <div className="observation-editor__footer">
            <button
              className="secondary-action"
              onClick={requestClose}
              type="button"
            >
              Отменить
            </button>
            <button className="primary-action" type="submit">
              Сохранить наблюдение
            </button>
          </div>
        </form>

        {initialObservation && onDelete && (
          <div className="observation-editor__danger-zone">
            <div>
              <strong>Удалить запись</strong>
              <p>Удаление можно отменить одним действием в журнале.</p>
            </div>
            <button
              className="danger-action"
              onClick={() => {
                releaseEditorHistoryEntry();
                onDelete(initialObservation.id);
              }}
              type="button"
            >
              Удалить {initialObservation.id}
            </button>
          </div>
        )}
      </div>

      {confirmDiscard && (
        <div
          aria-labelledby="discard-editor-title"
          className="inline-confirmation"
          role="alertdialog"
        >
          <strong id="discard-editor-title">
            Отменить несохранённые изменения?
          </strong>
          <p>Поля вернутся к состоянию до открытия редактора.</p>
          <div className="inline-confirmation__actions">
            <button
              className="secondary-action"
              onClick={() => {
                restoreEditorFocusRef.current = true;
                setConfirmDiscard(false);
              }}
              ref={continueEditingRef}
              type="button"
            >
              Продолжить редактирование
            </button>
            <button
              className="danger-action"
              onClick={finishClose}
              type="button"
            >
              Отменить изменения
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function EditorField({
  children,
  error,
  hint,
  id,
  label,
}: {
  readonly children: React.ReactNode;
  readonly error?: string;
  readonly hint: string;
  readonly id: string;
  readonly label: string;
}) {
  return (
    <div className="editor-field">
      <label htmlFor={`observation-${id}`}>{label}</label>
      <p className="field-hint" id={`observation-${id}-hint`}>
        {hint}
      </p>
      {children}
      {error && (
        <p className="field-error" id={`observation-${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function SuggestionList({
  id,
  values,
}: {
  readonly id: string;
  readonly values: readonly string[];
}) {
  return (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  );
}

function describedBy(field: string, error?: string) {
  return `observation-${field}-hint${error ? ` observation-${field}-error` : ""}`;
}

function pluralizeFields(count: number) {
  return count === 1 ? "поле" : count < 5 ? "поля" : "полей";
}
