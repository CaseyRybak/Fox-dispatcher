import { useEffect, useRef } from "react";

import type { ObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";

interface ObservationsPageProps {
  readonly hasActiveFilters: boolean;
  readonly onResetFilters: () => void;
  readonly overview: ObservationSetOverview;
  readonly scopeLabel: string;
}

export function ObservationsPage({
  hasActiveFilters,
  onResetFilters,
  overview,
  scopeLabel,
}: ObservationsPageProps) {
  const scopeLabelRef = useRef<HTMLTableCaptionElement>(null);
  const restoreFocusAfterResetRef = useRef(false);

  useEffect(() => {
    if (restoreFocusAfterResetRef.current && overview.observationCount > 0) {
      restoreFocusAfterResetRef.current = false;
      scopeLabelRef.current?.focus();
    }
  }, [overview.observationCount]);

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Проверенный стартовый набор</p>
        <h1 tabIndex={-1}>Наблюдения</h1>
        <p>
          Фильтры сводки сохраняют область журнала. Управление записями появится
          в отдельной фазе и будет использовать тот же доменный контракт.
        </p>
      </header>

      {hasActiveFilters && overview.observationCount === 0 ? (
        <section className="empty-report" aria-labelledby="ledger-empty-title">
          <p className="eyebrow">{scopeLabel}</p>
          <h2 id="ledger-empty-title">В этой выборке ничего не найдено</h2>
          <p>
            Исходный набор не изменён. Сбросьте фильтры, чтобы вернуть все
            наблюдения.
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
