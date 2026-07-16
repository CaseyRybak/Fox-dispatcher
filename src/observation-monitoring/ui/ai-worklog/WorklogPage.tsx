import type {
  PublicWorklogCheckpoint,
  WorklogEvidenceKind,
} from "@/observation-monitoring/application/public-worklog";

interface WorklogPageProps {
  readonly checkpoints: readonly PublicWorklogCheckpoint[];
}

const evidenceKindLabels: Readonly<Record<WorklogEvidenceKind, string>> = {
  architecture: "Архитектура",
  decision: "Решение",
  plan: "План",
  screenshot: "Скриншот",
  specification: "Спецификация",
  test: "Тест",
  verification: "Проверка",
};

export function WorklogPage({ checkpoints }: WorklogPageProps) {
  return (
    <div className="page worklog-page">
      <header className="worklog-hero">
        <div className="worklog-hero__copy">
          <p className="eyebrow">Как создаётся продукт</p>
          <h1 tabIndex={-1}>AI Worklog</h1>
          <p>
            Короткая хронология постановки задачи, решений, исправлений и
            проверок. Здесь разделены вклад AI и ответственность человека, а
            каждый вывод связан с опубликованным доказательством.
          </p>
        </div>

        <aside className="worklog-manifest" aria-label="Состав AI Worklog">
          <strong>{checkpoints.length} ключевых чекпоинтов</strong>
          <span>Без полной переписки и приватных данных</span>
          <span>Доказательства закреплены за ревизиями GitHub</span>
        </aside>
      </header>

      <section aria-label="Хронология работы с AI" className="worklog-timeline">
        <ol className="worklog-list">
          {checkpoints.map((checkpoint, index) => (
            <li className="worklog-entry" key={checkpoint.id}>
              <span className="worklog-entry__marker" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <article
                aria-labelledby={`worklog-${checkpoint.id}`}
                className="worklog-card"
              >
                <header className="worklog-card__header">
                  <div>
                    <p>{checkpoint.stage}</p>
                    <h2 id={`worklog-${checkpoint.id}`}>{checkpoint.goal}</h2>
                  </div>
                  <time dateTime={checkpoint.date}>
                    {formatWorklogDate(checkpoint.date)}
                  </time>
                </header>

                <div className="worklog-card__responsibility">
                  <section>
                    <h3>Вклад AI</h3>
                    <p>{checkpoint.aiContribution}</p>
                  </section>
                  <section>
                    <h3>Решение человека</h3>
                    <p>{checkpoint.humanDecision}</p>
                  </section>
                </div>

                <div className="worklog-card__outcome">
                  <section>
                    <h3>Что изменилось</h3>
                    <p>{checkpoint.change}</p>
                  </section>
                  <section>
                    <h3>Как проверено</h3>
                    <p>{checkpoint.verification}</p>
                  </section>
                </div>

                <footer className="worklog-card__evidence">
                  <p>Доказательства</p>
                  <ul>
                    {checkpoint.evidence.map((item) => (
                      <li key={item.href}>
                        <a href={item.href} rel="noreferrer" target="_blank">
                          <span>{evidenceKindLabels[item.kind]}</span>
                          {item.label}
                          <span className="visually-hidden">
                            {" "}
                            (откроется в новой вкладке)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </footer>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function formatWorklogDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}
