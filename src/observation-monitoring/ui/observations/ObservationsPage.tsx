import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ObservationListItem,
  ObservationSetOverview,
} from "@/observation-monitoring/application/create-observation-set-overview";
import type {
  ObservationDeletionUndo,
  ObservationDraft,
  ObservationMutationResult,
} from "@/observation-monitoring/application/observation-management";
import { ObservationEditor } from "@/observation-monitoring/ui/observations/ObservationEditor";

interface ObservationsPageProps {
  readonly hasActiveFilters: boolean;
  readonly lastDeletion?: ObservationDeletionUndo;
  readonly onAdd: (draft: ObservationDraft) => ObservationMutationResult;
  readonly onDelete: (observationId: string) => void;
  readonly onEdit: (
    observationId: string,
    draft: ObservationDraft,
  ) => ObservationMutationResult;
  readonly onResetFilters: () => void;
  readonly onResetStarter: () => void;
  readonly onDismissUndo: () => void;
  readonly onUndoDelete: () => void;
  readonly overview: ObservationSetOverview;
  readonly persistenceMessage: string;
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
  onDismissUndo,
  onResetFilters,
  onResetStarter,
  onUndoDelete,
  overview,
  persistenceMessage,
  scopeLabel,
}: ObservationsPageProps) {
  const [editor, setEditor] = useState<EditorState>();
  const [confirmReset, setConfirmReset] = useState(false);
  const [sort, setSort] = useState<ObservationSort>({
    direction: "descending",
    field: "time",
  });
  const scopeLabelRef = useRef<HTMLTableCaptionElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusAfterResetRef = useRef(false);
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
    if (confirmReset) resetCancelRef.current?.focus();
  }, [confirmReset]);

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
        <button
          className="text-action"
          onClick={() => setConfirmReset(true)}
          ref={resetButtonRef}
          type="button"
        >
          Вернуть стартовые данные
        </button>
      </section>

      {confirmReset && (
        <section
          aria-labelledby="reset-starter-title"
          className="inline-confirmation reset-confirmation"
          role="alertdialog"
        >
          <div>
            <strong id="reset-starter-title">Вернуть стартовые данные?</strong>
            <p>Текущие записи будут заменены пятью исходными наблюдениями.</p>
          </div>
          <div className="inline-confirmation__actions">
            <button
              className="secondary-action"
              onClick={() => {
                setConfirmReset(false);
                resetButtonRef.current?.focus();
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
                setConfirmReset(false);
                restoreFocusAfterResetRef.current = true;
                onResetStarter();
              }}
              type="button"
            >
              Вернуть 5 стартовых наблюдений
            </button>
          </div>
        </section>
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
      ) : (
        <div className="table-frame">
          <table>
            <caption ref={scopeLabelRef} tabIndex={-1}>
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
                  <td>{observation.foxId}</td>
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
