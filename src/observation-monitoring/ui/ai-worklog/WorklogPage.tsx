export function WorklogPage() {
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Как создаётся продукт</p>
        <h1 tabIndex={-1}>AI Worklog</h1>
        <p>
          Публичная хронология будет собрана из реальных планов, решений, тестов
          и проверок. Этот раздел уже является частью навигации, а фактические
          checkpoints появятся по мере выполнения срезов.
        </p>
      </header>

      <section
        className="worklog-placeholder"
        aria-labelledby="worklog-source-title"
      >
        <span className="worklog-placeholder__index" aria-hidden="true">
          01
        </span>
        <div>
          <h2 id="worklog-source-title">Источник — проверяемые артефакты</h2>
          <p>
            Контракт, интерфейс, архитектура и execution plan уже находятся в
            репозитории. Worklog не копирует полную переписку и связывает каждый
            будущий вывод с доказательством.
          </p>
        </div>
      </section>
    </div>
  );
}
