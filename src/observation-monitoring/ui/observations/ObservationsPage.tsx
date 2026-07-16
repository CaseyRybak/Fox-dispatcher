import type { ObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";

interface ObservationsPageProps {
  readonly overview: ObservationSetOverview;
}

export function ObservationsPage({ overview }: ObservationsPageProps) {
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Проверенный стартовый набор</p>
        <h1 tabIndex={-1}>Наблюдения</h1>
        <p>
          Сейчас журнал доступен для чтения. Управление записями появится в
          отдельной фазе и будет использовать тот же доменный контракт.
        </p>
      </header>

      <div className="table-frame">
        <table>
          <caption>{overview.observationCount} исходных наблюдений</caption>
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
    </div>
  );
}
