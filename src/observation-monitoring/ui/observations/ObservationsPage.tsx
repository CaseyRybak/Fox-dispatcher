import { useEffect, useMemo, useRef, useState } from "react";

import type { DashboardStateRecovery } from "@/observation-monitoring/application/dashboard-state-store";
import type {
  ObservationImportFile,
  ObservationImportFileResult,
  ObservationImportResult,
} from "@/observation-monitoring/application/observation-transfer";
import type {
  ObservationListItem,
  ObservationSetOverview,
} from "@/observation-monitoring/application/create-observation-set-overview";
import type {
  ObservationDeletionUndo,
  ObservationDraft,
  ObservationMutationResult,
} from "@/observation-monitoring/application/observation-management";
import { formatFoxDisplayName } from "@/observation-monitoring/application/fox-display-name";
import { ObservationEditor } from "@/observation-monitoring/ui/observations/ObservationEditor";
import { ObservationImportDialog } from "@/observation-monitoring/ui/observations/ObservationImportDialog";

interface ObservationsPageProps {
  readonly hasActiveFilters: boolean;
  readonly lastDeletion?: ObservationDeletionUndo;
  readonly onAdd: (draft: ObservationDraft) => ObservationMutationResult;
  readonly onDelete: (observationId: string) => void;
  readonly onEdit: (
    observationId: string,
    draft: ObservationDraft,
  ) => ObservationMutationResult;
  readonly onExport: () => void;
  readonly onReadImportFile: (
    file: ObservationImportFile,
  ) => Promise<ObservationImportFileResult>;
  readonly onResetFilters: () => void;
  readonly onResetStarter: () => void;
  readonly onReplaceImportedObservations: (
    observations: Extract<
      ObservationImportResult,
      { ok: true }
    >["observations"],
  ) => void;
  readonly onSelectRecoveryRaw: () => void;
  readonly onValidateImport: (
    text: string,
    measuredBytes?: number,
  ) => ObservationImportResult;
  readonly onDismissUndo: () => void;
  readonly onUndoDelete: () => void;
  readonly overview: ObservationSetOverview;
  readonly persistenceMessage: string;
  readonly recovery?: DashboardStateRecovery;
  readonly scopeLabel: string;
}

type EditorState =
  | { readonly mode: "add" }
  | { readonly mode: "edit"; readonly observation: ObservationListItem };

type ObservationSortField =
  "color" | "foxId" | "hasPrey" | "location" | "suspicionLevel" | "time";

interface ObservationSort {
  readonly direction: "ascending" | "descending";
  readonly field: ObservationSortField;
}

type PendingFocus =
  | { readonly kind: "add" }
  | { readonly id: string; readonly kind: "observation" };

export function ObservationsPage({
  hasActiveFilters,
  lastDeletion,
  onAdd,
  onDelete,
  onEdit,
  onExport,
  onReadImportFile,
  onDismissUndo,
  onResetFilters,
  onResetStarter,
  onReplaceImportedObservations,
  onSelectRecoveryRaw,
  onUndoDelete,
  overview,
  persistenceMessage,
  recovery,
  scopeLabel,
  onValidateImport,
}: ObservationsPageProps) {
  const [editor, setEditor] = useState<EditorState>();
  const [confirmReset, setConfirmReset] = useState<"normal" | "recovery">();
  const [importOpen, setImportOpen] = useState(false);
  const [sort, setSort] = useState<ObservationSort>({
    direction: "descending",
    field: "time",
  });
  const isMobileLedger = useMediaQuery("(max-width: 767px)");
  const scopeLabelRef = useRef<HTMLElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const recoveryRawRef = useRef<HTMLTextAreaElement>(null);
  const restoreResetFocusRef = useRef(false);
  const restoreFocusAfterResetRef = useRef(false);
  const restoreImportFocusRef = useRef(false);
  const focusAfterRenderRef = useRef<PendingFocus | undefined>(undefined);

  const locationSuggestions = useMemo(
    () =>
      [
        ...new Set(overview.observations.map(({ location }) => location)),
      ].sort(),
    [overview.observations],
  );
  const colorSuggestions = useMemo(
    () => [...new Set(overview.observations.map(({ color }) => color))].sort(),
    [overview.observations],
  );
  const sortedObservations = useMemo(
    () =>
      [...overview.observations].sort((left, right) =>
        compareRows(left, right, sort),
      ),
    [overview.observations, sort],
  );

  useEffect(() => {
    if (!restoreFocusAfterResetRef.current) return;
    restoreFocusAfterResetRef.current = false;
    (scopeLabelRef.current ?? addButtonRef.current)?.focus();
  }, [overview.observationCount, overview.observations]);

  useEffect(() => {
    const target = focusAfterRenderRef.current;
    if (!target) return;
    focusAfterRenderRef.current = undefined;
    if (target.kind === "add") {
      addButtonRef.current?.focus();
      return;
    }
    const editButton = [
      ...document.querySelectorAll<HTMLButtonElement>(
        "[data-edit-observation]",
      ),
    ].find(({ dataset }) => dataset.editObservation === target.id);
    if (editButton && !editButton.disabled) {
      editButton.focus();
      return;
    }
    focusEditorOrLedger();
  }, [editor, overview.observations]);

  useEffect(() => {
    if (confirmReset) {
      const dialog = resetDialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
      resetCancelRef.current?.focus();
      return;
    }
    if (restoreResetFocusRef.current) {
      restoreResetFocusRef.current = false;
      resetButtonRef.current?.focus();
    }
  }, [confirmReset]);

  useEffect(() => {
    if (!importOpen && restoreImportFocusRef.current) {
      restoreImportFocusRef.current = false;
      importButtonRef.current?.focus();
    }
  }, [importOpen]);

  function closeEditor() {
    const editedId =
      editor?.mode === "edit" ? editor.observation.id : undefined;
    focusAfterRenderRef.current = editedId
      ? { id: editedId, kind: "observation" }
      : { kind: "add" };
    setEditor(undefined);
  }

  function saveEditor(draft: ObservationDraft) {
    const result =
      editor?.mode === "edit"
        ? onEdit(editor.observation.id, draft)
        : onAdd(draft);
    if (result.ok) closeEditor();
    return result;
  }

  function deleteRecord(observationId: string) {
    const currentIndex = sortedObservations.findIndex(
      ({ id }) => id === observationId,
    );
    const focusTarget =
      sortedObservations[currentIndex + 1]?.id ??
      sortedObservations[currentIndex - 1]?.id;
    focusAfterRenderRef.current = focusTarget
      ? { id: focusTarget, kind: "observation" }
      : { kind: "add" };
    if (editor?.mode === "edit" && editor.observation.id === observationId) {
      setEditor(undefined);
    }
    onDelete(observationId);
  }

  function changeSort(field: ObservationSortField) {
    setSort((current) => ({
      direction:
        current.field === field && current.direction === "ascending"
          ? "descending"
          : "ascending",
      field,
    }));
  }

  function focusEditorOrLedger() {
    const editorFirstField = document.getElementById("observation-foxId");
    if (editorFirstField instanceof HTMLElement) {
      editorFirstField.focus();
      return;
    }
    (scopeLabelRef.current ?? addButtonRef.current)?.focus();
  }

  return (
    <div className="page observations-page">
      <header className="page-heading observation-page-heading">
        <div>
          <p className="eyebrow">Редактируемый полевой журнал</p>
          <h1 tabIndex={-1}>Наблюдения</h1>
          <p>
            Добавляйте и уточняйте записи — сводка, рейтинг и активность
            пересчитываются из одного набора.
          </p>
        </div>
        <button
          className="primary-action"
          disabled={Boolean(editor)}
          onClick={() => setEditor({ mode: "add" })}
          ref={addButtonRef}
          type="button"
        >
          Добавить наблюдение
        </button>
      </header>

      <section aria-label="Состояние данных" className="data-management-bar">
        <p>
          <span className="data-management-bar__signal" aria-hidden="true" />
          {persistenceMessage}
        </p>
        <div className="data-management-actions">
          <button
            className="secondary-action"
            disabled={Boolean(editor)}
            onClick={() => setImportOpen(true)}
            ref={importButtonRef}
            type="button"
          >
            Импортировать JSON
          </button>
          <button className="secondary-action" onClick={onExport} type="button">
            Экспортировать все наблюдения
          </button>
          <button
            className="text-action"
            onClick={() => setConfirmReset("normal")}
            ref={resetButtonRef}
            type="button"
          >
            Вернуть стартовые данные
          </button>
        </div>
      </section>

      {recovery && (
        <section
          aria-labelledby="storage-recovery-title"
          className="storage-recovery"
        >
          <div>
            <p className="eyebrow">Автосохранение приостановлено</p>
            <h2 id="storage-recovery-title">
              Восстановление сохранённых данных
            </h2>
            <p>
              {recovery.kind === "unsupported-version"
                ? `Найдена более новая версия ${recovery.schemaVersion}. Приложение не будет её изменять автоматически.`
                : "Сохранённое значение повреждено. Оно останется без изменений, пока вы явно не начнёте со стартовых данных."}
            </p>
          </div>
          <details>
            <summary>Показать сохранённый JSON</summary>
            <label htmlFor="storage-recovery-raw">Сохранённое значение</label>
            <textarea
              id="storage-recovery-raw"
              readOnly
              ref={recoveryRawRef}
              value={recovery.rawValue}
            />
            <button
              className="secondary-action"
              onClick={() => {
                recoveryRawRef.current?.focus();
                recoveryRawRef.current?.select();
                onSelectRecoveryRaw();
              }}
              type="button"
            >
              Выделить сохранённый JSON для копирования
            </button>
          </details>
          <button
            className="danger-action"
            onClick={() => setConfirmReset("recovery")}
            type="button"
          >
            Удалить сохранение и начать со стартовых данных
          </button>
        </section>
      )}

      <ObservationImportDialog
        onClose={() => {
          restoreImportFocusRef.current = true;
          setImportOpen(false);
        }}
        onReadFile={onReadImportFile}
        onReplace={(observations) => {
          restoreFocusAfterResetRef.current = true;
          setImportOpen(false);
          onReplaceImportedObservations(observations);
        }}
        onValidate={onValidateImport}
        open={importOpen}
      />

      {confirmReset && (
        <dialog
          aria-modal="true"
          aria-labelledby="reset-starter-title"
          className="inline-confirmation reset-confirmation"
          onCancel={(event) => {
            event.preventDefault();
            restoreResetFocusRef.current = true;
            setConfirmReset(undefined);
          }}
          ref={resetDialogRef}
          role="alertdialog"
        >
          <div>
            <strong id="reset-starter-title">
              {confirmReset === "recovery"
                ? "Удалить повреждённое сохранение?"
                : "Вернуть стартовые данные?"}
            </strong>
            <p>
              {confirmReset === "recovery"
                ? "Исходное сохранённое значение будет удалено, а журнал начнётся с пяти наблюдений."
                : "Текущие записи будут заменены пятью исходными наблюдениями."}
            </p>
          </div>
          <div className="inline-confirmation__actions">
            <button
              className="secondary-action"
              onClick={() => {
                restoreResetFocusRef.current = true;
                setConfirmReset(undefined);
              }}
              ref={resetCancelRef}
              type="button"
            >
              Оставить текущие данные
            </button>
            <button
              className="danger-action"
              onClick={() => {
                setEditor(undefined);
                setConfirmReset(undefined);
                restoreFocusAfterResetRef.current = true;
                onResetStarter();
              }}
              type="button"
            >
              {confirmReset === "recovery"
                ? "Удалить сохранение и восстановить 5 наблюдений"
                : "Вернуть 5 стартовых наблюдений"}
            </button>
          </div>
        </dialog>
      )}

      {lastDeletion && (
        <aside className="undo-banner">
          <p>Наблюдение {lastDeletion.observation.id} удалено</p>
          <div className="inline-confirmation__actions">
            <button
              className="secondary-action"
              onClick={() => {
                focusAfterRenderRef.current = {
                  id: lastDeletion.observation.id,
                  kind: "observation",
                };
                onUndoDelete();
              }}
              type="button"
            >
              Отменить удаление {lastDeletion.observation.id}
            </button>
            <button
              className="text-action"
              onClick={() => {
                focusEditorOrLedger();
                onDismissUndo();
              }}
              type="button"
            >
              Закрыть сообщение
            </button>
          </div>
        </aside>
      )}

      {editor && (
        <ObservationEditor
          colorSuggestions={colorSuggestions}
          initialObservation={
            editor.mode === "edit" ? editor.observation : undefined
          }
          locationSuggestions={locationSuggestions}
          key={editor.mode === "edit" ? editor.observation.id : "__add__"}
          onCancel={closeEditor}
          onDelete={deleteRecord}
          onSave={saveEditor}
        />
      )}

      {hasActiveFilters && overview.observationCount === 0 ? (
        <section className="empty-report" aria-labelledby="ledger-empty-title">
          <p className="eyebrow">{scopeLabel}</p>
          <h2 id="ledger-empty-title">В этой выборке ничего не найдено</h2>
          <p>
            Набор не изменён. Сбросьте фильтры, чтобы вернуть все наблюдения.
          </p>
          <button
            className="primary-action"
            onClick={() => {
              restoreFocusAfterResetRef.current = true;
              onResetFilters();
            }}
            type="button"
          >
            Сбросить фильтры
          </button>
        </section>
      ) : overview.observationCount === 0 ? (
        <section className="empty-report" aria-labelledby="ledger-empty-title">
          <p className="eyebrow">Пустой журнал</p>
          <h2 id="ledger-empty-title">Наблюдений пока нет</h2>
          <p>Добавьте новую запись или верните пять стартовых наблюдений.</p>
        </section>
      ) : isMobileLedger ? (
        <MobileObservationLedger
          editorOpen={Boolean(editor)}
          observations={sortedObservations}
          onDelete={deleteRecord}
          onEdit={(observation) => setEditor({ mode: "edit", observation })}
          onSortChange={setSort}
          scopeLabel={scopeLabel}
          setScopeLabelElement={(element) => {
            scopeLabelRef.current = element;
          }}
          sort={sort}
        />
      ) : (
        <div className="table-frame">
          <table>
            <caption
              ref={(element) => {
                scopeLabelRef.current = element;
              }}
              tabIndex={-1}
            >
              {scopeLabel}
            </caption>
            <thead>
              <tr>
                <SortableHeader
                  field="time"
                  label="Время"
                  onChange={changeSort}
                  sort={sort}
                />
                <th scope="col">Запись</th>
                <SortableHeader
                  field="foxId"
                  label="Лиса"
                  onChange={changeSort}
                  sort={sort}
                />
                <SortableHeader
                  field="location"
                  label="Локация"
                  onChange={changeSort}
                  sort={sort}
                />
                <SortableHeader
                  field="color"
                  label="Цвет"
                  onChange={changeSort}
                  sort={sort}
                />
                <SortableHeader
                  field="hasPrey"
                  label="Добыча"
                  onChange={changeSort}
                  sort={sort}
                />
                <SortableHeader
                  field="suspicionLevel"
                  label="Оценка"
                  onChange={changeSort}
                  sort={sort}
                />
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedObservations.map((observation) => (
                <tr key={observation.id}>
                  <td>
                    <time dateTime={observation.time}>{observation.time}</time>
                  </td>
                  <td className="data-id">{observation.id}</td>
                  <td>{formatFoxDisplayName(observation.foxId)}</td>
                  <td>{observation.location}</td>
                  <td>{observation.color}</td>
                  <td>{observation.hasPrey ? "Есть" : "Нет"}</td>
                  <td>{observation.suspicionLevel} / 10</td>
                  <td>
                    <div className="row-actions">
                      <button
                        aria-label={`Изменить ${observation.id}`}
                        className="text-action"
                        data-edit-observation={observation.id}
                        disabled={Boolean(editor)}
                        onClick={() => setEditor({ mode: "edit", observation })}
                        type="button"
                      >
                        Изменить
                      </button>
                      <button
                        aria-label={`Удалить ${observation.id}`}
                        className="text-action text-action--danger"
                        disabled={Boolean(editor)}
                        onClick={() => deleteRecord(observation.id)}
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  field,
  label,
  onChange,
  sort,
}: {
  readonly field: ObservationSortField;
  readonly label: string;
  readonly onChange: (field: ObservationSortField) => void;
  readonly sort: ObservationSort;
}) {
  const current = sort.field === field;
  return (
    <th aria-sort={current ? sort.direction : undefined} scope="col">
      <button onClick={() => onChange(field)} type="button">
        {label}
        {current && (
          <span aria-hidden="true">
            {sort.direction === "ascending" ? " ↑" : " ↓"}
          </span>
        )}
      </button>
    </th>
  );
}

const mobileSortOptions: readonly {
  readonly label: string;
  readonly sort: ObservationSort;
  readonly value: string;
}[] = [
  {
    label: "Время: сначала поздние",
    sort: { direction: "descending", field: "time" },
    value: "time-descending",
  },
  {
    label: "Время: сначала ранние",
    sort: { direction: "ascending", field: "time" },
    value: "time-ascending",
  },
  {
    label: "Лиса: от А до Я",
    sort: { direction: "ascending", field: "foxId" },
    value: "foxId-ascending",
  },
  {
    label: "Лиса: от Я до А",
    sort: { direction: "descending", field: "foxId" },
    value: "foxId-descending",
  },
  {
    label: "Локация: от А до Я",
    sort: { direction: "ascending", field: "location" },
    value: "location-ascending",
  },
  {
    label: "Локация: от Я до А",
    sort: { direction: "descending", field: "location" },
    value: "location-descending",
  },
  {
    label: "Цвет: от А до Я",
    sort: { direction: "ascending", field: "color" },
    value: "color-ascending",
  },
  {
    label: "Цвет: от Я до А",
    sort: { direction: "descending", field: "color" },
    value: "color-descending",
  },
  {
    label: "Добыча: сначала нет",
    sort: { direction: "ascending", field: "hasPrey" },
    value: "hasPrey-ascending",
  },
  {
    label: "Добыча: сначала есть",
    sort: { direction: "descending", field: "hasPrey" },
    value: "hasPrey-descending",
  },
  {
    label: "Оценка: сначала низкая",
    sort: { direction: "ascending", field: "suspicionLevel" },
    value: "suspicionLevel-ascending",
  },
  {
    label: "Оценка: сначала высокая",
    sort: { direction: "descending", field: "suspicionLevel" },
    value: "suspicionLevel-descending",
  },
];

function MobileObservationLedger({
  editorOpen,
  observations,
  onDelete,
  onEdit,
  onSortChange,
  scopeLabel,
  setScopeLabelElement,
  sort,
}: {
  readonly editorOpen: boolean;
  readonly observations: readonly ObservationListItem[];
  readonly onDelete: (observationId: string) => void;
  readonly onEdit: (observation: ObservationListItem) => void;
  readonly onSortChange: (sort: ObservationSort) => void;
  readonly scopeLabel: string;
  readonly setScopeLabelElement: (element: HTMLElement | null) => void;
  readonly sort: ObservationSort;
}) {
  const value = `${sort.field}-${sort.direction}`;

  return (
    <section
      className="mobile-observation-ledger"
      aria-labelledby="mobile-ledger-scope"
    >
      <div className="mobile-observation-ledger__toolbar">
        <p id="mobile-ledger-scope" ref={setScopeLabelElement} tabIndex={-1}>
          {scopeLabel}
        </p>
        <label>
          <span>Сортировка наблюдений</span>
          <select
            onChange={(event) => {
              const selected = mobileSortOptions.find(
                ({ value: optionValue }) => optionValue === event.target.value,
              );
              if (selected) onSortChange(selected.sort);
            }}
            value={value}
          >
            {mobileSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ol
        aria-label="Наблюдения текущей выборки"
        className="observation-card-list"
      >
        {observations.map((observation) => (
          <li className="observation-card" key={observation.id}>
            <div className="observation-card__heading">
              <div>
                <time dateTime={observation.time}>{observation.time}</time>
                <strong>{formatFoxDisplayName(observation.foxId)}</strong>
              </div>
              <span className="observation-card__score">
                {observation.suspicionLevel} / 10
              </span>
            </div>
            <p className="data-id">{observation.id}</p>
            <dl className="observation-card__facts">
              <div>
                <dt>Локация</dt>
                <dd>{observation.location}</dd>
              </div>
              <div>
                <dt>Цвет</dt>
                <dd>{observation.color}</dd>
              </div>
              <div>
                <dt>Добыча</dt>
                <dd>{observation.hasPrey ? "Есть" : "Нет"}</dd>
              </div>
            </dl>
            <div className="row-actions">
              <button
                aria-label={`Изменить ${observation.id}`}
                className="secondary-action"
                data-edit-observation={observation.id}
                disabled={editorOpen}
                onClick={() => onEdit(observation)}
                type="button"
              >
                Изменить
              </button>
              <button
                aria-label={`Удалить ${observation.id}`}
                className="text-action text-action--danger"
                disabled={editorOpen}
                onClick={() => onDelete(observation.id)}
                type="button"
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function compareRows(
  left: ObservationListItem,
  right: ObservationListItem,
  sort: ObservationSort,
) {
  const leftValue = left[sort.field];
  const rightValue = right[sort.field];
  const primary = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
  const directed = sort.direction === "ascending" ? primary : -primary;
  return directed || compareText(left.id, right.id);
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}
