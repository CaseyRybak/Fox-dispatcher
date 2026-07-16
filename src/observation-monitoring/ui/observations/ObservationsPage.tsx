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
  readonly onUndoDelete: () => void;
  readonly overview: ObservationSetOverview;
  readonly persistenceMessage: string;
  readonly scopeLabel: string;
}

type EditorState =
  | { readonly mode: "add" }
  | { readonly mode: "edit"; readonly observation: ObservationListItem };

export function ObservationsPage({
  hasActiveFilters,
  lastDeletion,
  onAdd,
  onDelete,
  onEdit,
  onResetFilters,
  onResetStarter,
  onUndoDelete,
  overview,
  persistenceMessage,
  scopeLabel,
}: ObservationsPageProps) {
  const [editor, setEditor] = useState<EditorState>();
  const [confirmReset, setConfirmReset] = useState(false);
  const scopeLabelRef = useRef<HTMLTableCaptionElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusAfterResetRef = useRef(false);
  const focusAfterRenderRef = useRef<string | undefined>(undefined);

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

  useEffect(() => {
    if (restoreFocusAfterResetRef.current && overview.observationCount > 0) {
      restoreFocusAfterResetRef.current = false;
      scopeLabelRef.current?.focus();
    }
  }, [overview.observationCount]);

  useEffect(() => {
    const targetId = focusAfterRenderRef.current;
    if (!targetId) return;
    focusAfterRenderRef.current = undefined;
    if (targetId === "__add__") {
      addButtonRef.current?.focus();
      return;
    }
    document
      .querySelector<HTMLButtonElement>(`[data-edit-observation="${targetId}"]`)
      ?.focus();
  }, [editor, overview.observations]);

  useEffect(() => {
    if (confirmReset) resetCancelRef.current?.focus();
  }, [confirmReset]);

  function closeEditor() {
    const editedId =
      editor?.mode === "edit" ? editor.observation.id : undefined;
    focusAfterRenderRef.current = editedId ?? "__add__";
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
    const currentIndex = overview.observations.findIndex(
      ({ id }) => id === observationId,
    );
    const focusTarget =
      overview.observations[currentIndex + 1]?.id ??
      overview.observations[currentIndex - 1]?.id;
    focusAfterRenderRef.current = focusTarget;
    if (editor?.mode === "edit" && editor.observation.id === observationId) {
      setEditor(undefined);
    }
    onDelete(observationId);
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
              onClick={() => setConfirmReset(false)}
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
          <button
            className="secondary-action"
            onClick={onUndoDelete}
            type="button"
          >
            Отменить удаление {lastDeletion.observation.id}
          </button>
        </aside>
      )}

      {editor && (
        <ObservationEditor
          colorSuggestions={colorSuggestions}
          initialObservation={
            editor.mode === "edit" ? editor.observation : undefined
          }
          locationSuggestions={locationSuggestions}
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
                <th scope="col">Время</th>
                <th scope="col">Запись</th>
                <th scope="col">Лиса</th>
                <th scope="col">Локация</th>
                <th scope="col">Цвет</th>
                <th scope="col">Добыча</th>
                <th scope="col">Оценка</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {overview.observations.map((observation) => (
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
                        onClick={() => setEditor({ mode: "edit", observation })}
                        type="button"
                      >
                        Изменить
                      </button>
                      <button
                        aria-label={`Удалить ${observation.id}`}
                        className="text-action text-action--danger"
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
