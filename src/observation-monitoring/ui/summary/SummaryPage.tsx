import type { CSSProperties, ChangeEvent, KeyboardEvent } from "react";

import type {
  RankedFoxViewModel,
  SummaryViewModel,
} from "@/observation-monitoring/application/create-summary-view-model";

interface SummaryPageProps {
  readonly announcement: string;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly viewModel: SummaryViewModel;
}

export function SummaryPage({
  announcement,
  onPreyWeightChange,
  onPreyWeightCommit,
  viewModel,
}: SummaryPageProps) {
  const leader = viewModel.leader;

  if (!leader) {
    return (
      <div className="page page--summary">
        <section className="empty-report">
          <p className="eyebrow">Текущая выборка</p>
          <h1 tabIndex={-1}>Сводка наблюдений</h1>
          <p>В выборке нет наблюдений, поэтому рейтинг пока не рассчитан.</p>
        </section>
      </div>
    );
  }

  const commitCurrentWeight = () => {
    onPreyWeightCommit(viewModel.preyWeightPercent);
  };

  return (
    <div className="page page--summary">
      <section className="outcome-docket" aria-labelledby="summary-title">
        <div className="outcome-docket__intro">
          <h1 className="summary-route-title" id="summary-title" tabIndex={-1}>
            Сводка наблюдений
          </h1>
          <p className="eyebrow">Лидер текущей выборки</p>
          <div className="leader-result">
            <h2 className="leader-result__fox" id="leader-title">
              {leader.foxId}
            </h2>
            <p className="leader-result__score">{leader.scoreLabel} из 10</p>
          </div>
          <p className="leader-result__explanation">{leader.explanation}</p>
          <p className="leader-result__latest">
            Последняя запись лидера: <time>{leader.latestTime}</time> ·{" "}
            {leader.latestLocation}
          </p>
          <p className="leader-result__scope">
            Индекс помогает расставить приоритет наблюдения и не является
            вероятностью опасности.
          </p>
        </div>

        <dl className="metric-ledger" aria-label="Состав текущего отчёта">
          {viewModel.metrics.map((metric) => (
            <div className="metric-ledger__item" key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
              {metric.detail && <span>{metric.detail}</span>}
            </div>
          ))}
        </dl>
      </section>

      <div className="assessment-workbench">
        <section className="ranking-panel" aria-labelledby="ranking-title">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">Порядок внимания</p>
              <h2 id="ranking-title">Рейтинг лис</h2>
            </div>
            <p>{viewModel.ranking.length} позиции</p>
          </header>

          <ol className="ranking-list" aria-label="Рейтинг подозрительности">
            {viewModel.ranking.map((assessment) => (
              <RankingRow assessment={assessment} key={assessment.foxId} />
            ))}
          </ol>
        </section>

        <aside
          className="calculation-panel"
          aria-labelledby="calculation-title"
        >
          <div className="calculation-panel__heading">
            <div>
              <p className="eyebrow">Расчёт лидера</p>
              <h2 id="calculation-title">{leader.foxId}</h2>
            </div>
            <p>
              Индекс <strong>{leader.scoreLabel}</strong>
            </p>
          </div>

          <div className="contribution-ledger" aria-label="Вклады в индекс">
            <ContributionRow
              detail={`${leader.meanSuspicionLabel} × ${viewModel.suspicionWeightPercent}%`}
              label="Оценка смотрителя"
              percent={leader.suspicionContributionPercent}
              value={leader.suspicionContributionLabel}
            />
            <ContributionRow
              detail={`${leader.preyRatioLabel} × 10 × ${viewModel.preyWeightPercent}%`}
              label="Признак добычи"
              percent={leader.preyContributionPercent}
              value={leader.preyContributionLabel}
            />
          </div>

          <fieldset className="policy-control">
            <legend>Политика оценки</legend>
            <div className="policy-control__label-row">
              <label htmlFor="prey-weight">Влияние добычи</label>
              <span>{viewModel.preyWeightPercent}%</span>
            </div>
            <input
              aria-describedby="prey-weight-help"
              aria-valuetext={`${viewModel.preyWeightPercent}% — оценка ${viewModel.suspicionWeightPercent}%, добыча ${viewModel.preyWeightPercent}%`}
              id="prey-weight"
              max="100"
              min="0"
              onBlur={commitCurrentWeight}
              onChange={handleWeightChange(onPreyWeightChange)}
              onKeyUp={handleWeightKeyUp(commitCurrentWeight)}
              onPointerUp={commitCurrentWeight}
              step="5"
              type="range"
              value={viewModel.preyWeightPercent}
            />
            <div className="policy-control__exact">
              <label htmlFor="prey-weight-exact">
                Влияние добычи, точное значение
              </label>
              <div>
                <input
                  id="prey-weight-exact"
                  max="100"
                  min="0"
                  onBlur={commitCurrentWeight}
                  onChange={handleWeightChange(onPreyWeightChange)}
                  step="5"
                  type="number"
                  value={viewModel.preyWeightPercent}
                />
                <span aria-hidden="true">%</span>
              </div>
            </div>
            <div className="policy-control__weights">
              <span>Оценка смотрителя {viewModel.suspicionWeightPercent}%</span>
              <span>Добыча {viewModel.preyWeightPercent}%</span>
            </div>
            <p id="prey-weight-help">
              Добыча — настраиваемый сигнал диспетчерского внимания. Остальной
              вес автоматически принадлежит прямой оценке смотрителя.
            </p>
            <button
              className="text-action"
              disabled={viewModel.preyWeightPercent === 20}
              onClick={() => {
                onPreyWeightChange(20);
                onPreyWeightCommit(20);
              }}
              type="button"
            >
              Вернуть 20%
            </button>
          </fieldset>
        </aside>
      </div>

      <p
        aria-atomic="true"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        {announcement}
      </p>
    </div>
  );
}

function RankingRow({
  assessment,
}: {
  readonly assessment: RankedFoxViewModel;
}) {
  return (
    <li className="ranking-row">
      <span className="ranking-row__rank">
        {String(assessment.rank).padStart(2, "0")}
      </span>
      <div className="ranking-row__identity">
        <strong>{assessment.foxId}</strong>
        <span>
          {assessment.color} · {assessment.latestTime}
        </span>
      </div>
      <div className="ranking-row__basis">
        <span>оценка {assessment.meanSuspicionLabel}</span>
        <span>добыча {assessment.preyRatioLabel}</span>
      </div>
      <span className="ranking-row__evidence">
        {assessment.observationCount} зап.
      </span>
      <strong className="ranking-row__score">{assessment.scoreLabel}</strong>
    </li>
  );
}

function ContributionRow({
  detail,
  label,
  percent,
  value,
}: {
  readonly detail: string;
  readonly label: string;
  readonly percent: number;
  readonly value: string;
}) {
  const style = {
    "--contribution-width": `${Math.min(percent, 100)}%`,
  } as CSSProperties;

  return (
    <div className="contribution-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <p>{detail}</p>
      <span aria-hidden="true" className="contribution-row__track">
        <span style={style} />
      </span>
    </div>
  );
}

function handleWeightChange(
  onPreyWeightChange: (preyWeightPercent: number) => void,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.value === "") {
      return;
    }

    const preyWeightPercent = Number(event.currentTarget.value);

    if (
      Number.isInteger(preyWeightPercent) &&
      preyWeightPercent >= 0 &&
      preyWeightPercent <= 100 &&
      preyWeightPercent % 5 === 0
    ) {
      onPreyWeightChange(preyWeightPercent);
    }
  };
}

function handleWeightKeyUp(commitCurrentWeight: () => void) {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      commitCurrentWeight();
    }
  };
}
