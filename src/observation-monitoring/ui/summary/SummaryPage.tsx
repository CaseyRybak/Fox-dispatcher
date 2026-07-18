import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";

import {
  formatObservationCount,
  type RankedFoxViewModel,
  type SummaryViewModel,
} from "@/observation-monitoring/application/create-summary-view-model";
import {
  formatFoxIdentityLabel,
  hasDistinctFoxDisplayName,
} from "@/observation-monitoring/application/fox-display-name";
import {
  DEFAULT_REPORT_FILTERS,
  hasActiveReportFilters,
  type PreyFilter,
  type ReportFilterOptions,
  type ReportFilters,
} from "@/observation-monitoring/application/report-scope";
import { useMediaQuery } from "@/observation-monitoring/ui/useMediaQuery";

interface SummaryPageProps {
  readonly filterOptions: ReportFilterOptions;
  readonly filters: ReportFilters;
  readonly onFiltersChange: (filters: ReportFilters) => void;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly onSelectFox: (foxId: string) => void;
  readonly viewModel: SummaryViewModel;
}

export function SummaryPage({
  filterOptions,
  filters,
  onFiltersChange,
  onPreyWeightChange,
  onPreyWeightCommit,
  onSelectFox,
  viewModel,
}: SummaryPageProps) {
  const leader = viewModel.leader;
  const leaders = viewModel.leaders;
  const selectedFox = viewModel.selectedFox;
  const hasFilters = hasActiveReportFilters(filters);

  const commitCurrentWeight = () => {
    onPreyWeightCommit(viewModel.preyWeightPercent);
  };

  const focusPolicyControl = () => {
    document.querySelector<HTMLInputElement>("#prey-weight")?.focus();
  };

  const scopeToolbar = (
    <ScopeToolbar
      filterOptions={filterOptions}
      filters={filters}
      hasFilters={hasFilters}
      onFiltersChange={onFiltersChange}
      scopeLabel={viewModel.scope.label}
    />
  );

  return (
    <div className="page page--summary">
      {!leader || !selectedFox ? (
        <>
          <section className="empty-report" aria-labelledby="empty-title">
            <p className="eyebrow">Текущая область</p>
            <h1 id="empty-title" tabIndex={-1}>
              Наблюдений пока нет
            </h1>
            <p>
              В журнале нет записей. Откройте управление данными, чтобы добавить
              наблюдение, импортировать JSON или вернуть стартовый набор.
            </p>
            <a className="primary-action" href="#observations">
              Открыть управление данными
            </a>
          </section>
          {scopeToolbar}
        </>
      ) : (
        <>
          <div className="summary-overview">
            <section className="outcome-docket" aria-labelledby="summary-title">
              <div className="outcome-docket__intro">
                <h1
                  className="outcome-docket__title"
                  id="summary-title"
                  tabIndex={-1}
                >
                  Самая подозрительная лиса
                </h1>
                <div className="leader-result">
                  <div className="leader-result__identity">
                    <h2 className="leader-result__fox" id="leader-title">
                      {formatFoxNameList(leaders.map(({ foxName }) => foxName))}
                    </h2>
                    {leaders.some(({ foxId, foxName }) =>
                      hasDistinctFoxDisplayName(foxId, foxName),
                    ) && (
                      <p className="data-id">
                        {leaders.map(({ foxId }) => foxId).join(" · ")}
                      </p>
                    )}
                  </div>
                  <p
                    aria-label={`Индекс ${leader.scoreLabel} из 10`}
                    className="leader-result__score"
                  >
                    <span>Индекс</span>
                    <strong>{leader.scoreLabel} из 10</strong>
                  </p>
                </div>
                <div
                  className={[
                    "leader-reasons",
                    leaders.length > 1 ? "leader-reasons--multiple" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {leaders.map((currentLeader) => (
                    <LeaderReason
                      key={currentLeader.foxId}
                      leader={currentLeader}
                      showFoxName={leaders.length > 1}
                    />
                  ))}
                </div>
                <dl
                  className="metric-ledger"
                  aria-label="Состав текущего отчёта"
                >
                  {viewModel.metrics.map((metric) => (
                    <div className="metric-ledger__item" key={metric.label}>
                      <dt>{metric.label}</dt>
                      <dd>
                        <strong>{metric.value}</strong>
                        {metric.detail && <span>{metric.detail}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="outcome-docket__actions">
                  <a className="primary-action" href="#observations">
                    Изменить параметры
                  </a>
                  <button
                    className="secondary-action"
                    onClick={focusPolicyControl}
                    type="button"
                  >
                    Изменить вес параметров
                  </button>
                </div>
              </div>
            </section>

            <SuspicionCalculationExplainer
              leaders={leaders}
              viewModel={viewModel}
            />
          </div>

          {scopeToolbar}

          <div className="assessment-workbench">
            <section className="ranking-panel" aria-labelledby="ranking-title">
              <header className="panel-heading">
                <div>
                  <h2 id="ranking-title">Рейтинг лис</h2>
                  <p className="panel-heading__description">
                    Выберите лису для отображения расчетов.
                  </p>
                </div>
                <p>{formatPositionCount(viewModel.ranking.length)}</p>
              </header>

              {viewModel.ranking.length > 0 ? (
                <ol
                  className="ranking-list"
                  aria-label="Рейтинг подозрительности"
                >
                  {viewModel.ranking.map((assessment) => (
                    <RankingRow
                      assessment={assessment}
                      isLeader={leaders.some(
                        ({ foxId }) => foxId === assessment.foxId,
                      )}
                      isSelected={assessment.foxId === selectedFox.foxId}
                      key={assessment.foxId}
                      onSelect={onSelectFox}
                    />
                  ))}
                </ol>
              ) : (
                <div className="ranking-empty">
                  <h3>По фильтрам лисы не найдены</h3>
                  <p>
                    Измените или сбросьте фильтры — итоговый отчёт рассчитан по
                    всем наблюдениям.
                  </p>
                </div>
              )}
            </section>

            <div className="assessment-side">
              <aside
                aria-label={`Расчёт: ${formatFoxIdentityLabel(selectedFox.foxId, selectedFox.foxName)}`}
                className="calculation-panel"
              >
                <div className="calculation-panel__heading">
                  <div>
                    <p className="eyebrow">Расчет индекса</p>
                    <h2>{selectedFox.foxName}</h2>
                    {hasDistinctFoxDisplayName(
                      selectedFox.foxId,
                      selectedFox.foxName,
                    ) && <p className="data-id">{selectedFox.foxId}</p>}
                  </div>
                  <p>
                    Индекс <strong>{selectedFox.scoreLabel}</strong>
                  </p>
                </div>

                <div
                  aria-label="Вклады в индекс"
                  className="contribution-ledger"
                  role="group"
                >
                  <ContributionRow
                    detail={`${selectedFox.meanSuspicionLabel} × ${viewModel.suspicionWeightPercent}%`}
                    label="Средняя подозрительность по всем наблюдениям"
                    percent={selectedFox.suspicionContributionPercent}
                    value={selectedFox.suspicionContributionLabel}
                  />
                  <ContributionRow
                    detail={`${selectedFox.preyRatioLabel} × 10 × ${viewModel.preyWeightPercent}%`}
                    label="Наличие добычи"
                    percent={selectedFox.preyContributionPercent}
                    value={selectedFox.preyContributionLabel}
                  />
                </div>
              </aside>

              <section
                aria-labelledby="parameter-weights-title"
                className="policy-panel"
                role="region"
              >
                <h2 id="parameter-weights-title">Вес параметров</h2>
                <PolicyControl
                  commitCurrentWeight={commitCurrentWeight}
                  onPreyWeightChange={onPreyWeightChange}
                  onPreyWeightCommit={onPreyWeightCommit}
                  viewModel={viewModel}
                />
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LeaderReason({
  leader,
  showFoxName,
}: {
  readonly leader: RankedFoxViewModel;
  readonly showFoxName: boolean;
}) {
  const foxName = leader.foxName;

  return (
    <section
      aria-label={`Почему ${foxName}`}
      className="leader-reason"
      role="region"
    >
      {showFoxName && <h3>{foxName}</h3>}
      <dl className="leader-reason__list">
        <div>
          <dt>Средняя подозрительность по всем наблюдениям</dt>
          <dd>
            <span>
              {leader.meanSuspicionLabel} · {leader.observationCount}{" "}
              {formatObservationCount(leader.observationCount)}
            </span>
            <strong>В индексе {leader.suspicionContributionLabel}</strong>
          </dd>
        </div>
        <div>
          <dt>Наличие добычи</dt>
          <dd>
            <span>
              В {leader.preyObservationCount} из {leader.observationCount}{" "}
              наблюдений
            </span>
            <strong>В индексе {leader.preyContributionLabel}</strong>
          </dd>
        </div>
      </dl>
      <IndexComposition leader={leader} />
    </section>
  );
}

function IndexComposition({ leader }: { readonly leader: RankedFoxViewModel }) {
  const roundedContributionTotal =
    leader.suspicionContributionPercent + leader.preyContributionPercent;
  const suspicionBarPercent =
    roundedContributionTotal === 0
      ? 0
      : (leader.scoreTenths * leader.suspicionContributionPercent) /
        roundedContributionTotal;
  const preyBarPercent = Math.max(0, leader.scoreTenths - suspicionBarPercent);
  const remainderPercent = Math.max(0, 100 - leader.scoreTenths);
  const foxName = leader.foxName;

  return (
    <figure
      aria-label={`Состав индекса ${foxName.replace(/^Лиса /u, "Лисы ")}`}
      className="index-composition"
    >
      <div aria-hidden="true" className="index-composition__track">
        <span
          className="index-composition__segment index-composition__segment--suspicion"
          style={{ width: `${suspicionBarPercent}%` }}
        />
        <span
          className="index-composition__segment index-composition__segment--prey"
          style={{ width: `${preyBarPercent}%` }}
        />
        <span
          className="index-composition__segment index-composition__segment--remainder"
          style={{ width: `${remainderPercent}%` }}
        />
      </div>
      <figcaption className="index-composition__legend">
        <span>
          <i aria-hidden="true" data-signal="suspicion" />
          Подозрительность <strong>{leader.suspicionContributionLabel}</strong>
        </span>
        <span>
          <i aria-hidden="true" data-signal="prey" />
          Добыча <strong>{leader.preyContributionLabel}</strong>
        </span>
        <span>
          <i aria-hidden="true" data-signal="remainder" />
          Итоговый индекс - <strong>{leader.scoreLabel}</strong>
        </span>
      </figcaption>
    </figure>
  );
}

function SuspicionCalculationExplainer({
  leaders,
  viewModel,
}: {
  readonly leaders: readonly RankedFoxViewModel[];
  readonly viewModel: SummaryViewModel;
}) {
  const titleId = "calculation-explanation";
  const hasMultipleLeaders = leaders.length > 1;

  return (
    <section
      aria-labelledby={titleId}
      className="calculation-explainer"
      role="region"
    >
      <header className="calculation-explainer__heading">
        <h2 id={titleId}>Расчет индекса подозрительности</h2>
        <div className="calculation-explainer__intro">
          <p>
            Индекс складывается из двух частей: средней подозрительности по всем
            наблюдениям и наличия добычи.
          </p>
          <p>
            Количество наблюдений не добавляет баллы самостоятельно. Оно влияет
            на среднюю подозрительность и долю наблюдений с добычей.
          </p>
          <p>
            При стартовых настройках средняя подозрительность лисы имеет 80%
            веса в итоговом индексе, а наличие добычи - 20%. Вес параметров
            можно изменить ниже. Параметры наблюдений и количество лис можно
            изменить в разделе <a href="#observations">«Параметры»</a>.
          </p>
        </div>
      </header>

      <h3 className="calculation-explainer__detail-title">
        {hasMultipleLeaders
          ? "Детальный расчет индекса самых подозрительных лис"
          : "Детальный расчет индекса самой подозрительной лисы"}
      </h3>
      {leaders.map((leader) => (
        <div className="calculation-explainer__leader" key={leader.foxId}>
          {hasMultipleLeaders && (
            <header className="calculation-explainer__leader-heading">
              <h4>{leader.foxName}</h4>
              {hasDistinctFoxDisplayName(leader.foxId, leader.foxName) && (
                <p className="data-id">{leader.foxId}</p>
              )}
            </header>
          )}
          <CalculationSteps
            leader={leader}
            nested={hasMultipleLeaders}
            viewModel={viewModel}
          />
        </div>
      ))}

      <p className="calculation-explainer__boundary">
        Цвет, локация и время в расчёте индекса не участвуют.
      </p>
    </section>
  );
}

function CalculationSteps({
  leader,
  nested,
  viewModel,
}: {
  readonly leader: RankedFoxViewModel;
  readonly nested: boolean;
  readonly viewModel: SummaryViewModel;
}) {
  const foxName = leader.foxName;
  const foxNameAfterFor = hasDistinctFoxDisplayName(
    leader.foxId,
    leader.foxName,
  )
    ? foxName.replace(/^Лиса /u, "Лисы ")
    : foxName;
  const StepHeading = nested ? "h5" : "h4";

  return (
    <ol className="calculation-explainer__steps">
      <li>
        <StepHeading>Средняя подозрительность по всем наблюдениям</StepHeading>
        <p>
          <span>
            Для {foxNameAfterFor} проведено наблюдений -{" "}
            {leader.observationCount}.
          </span>
          <br />
          <span>Средняя подозрительность - {leader.meanSuspicionLabel}.</span>
        </p>
        <strong className="calculation-explainer__formula">
          {leader.meanSuspicionLabel} × {viewModel.suspicionWeightPercent}% ={" "}
          {leader.suspicionContributionLabel}
        </strong>
      </li>
      <li>
        <StepHeading>Наличие добычи</StepHeading>
        <p>
          Добыча отмечена в {leader.preyObservationCount} из{" "}
          {leader.observationCount} наблюдений.
        </p>
        <strong className="calculation-explainer__formula">
          {leader.preyRatioLabel} × 10 × {viewModel.preyWeightPercent}% ={" "}
          {leader.preyContributionLabel}
        </strong>
      </li>
      <li>
        <StepHeading>Итоговый индекс</StepHeading>
        <p>Складываем значения двух параметров.</p>
        <strong className="calculation-explainer__formula">
          {leader.calculationIsRounded ? (
            <>Итоговый индекс = {leader.scoreLabel} из 10</>
          ) : (
            <>
              {leader.suspicionContributionLabel} +{" "}
              {leader.preyContributionLabel} = {leader.scoreLabel} из 10
            </>
          )}
        </strong>
        {leader.calculationIsRounded && <p>Значения округлены до десятых.</p>}
      </li>
    </ol>
  );
}

function ScopeToolbar({
  filterOptions,
  filters,
  hasFilters,
  onFiltersChange,
  scopeLabel,
}: {
  readonly filterOptions: ReportFilterOptions;
  readonly filters: ReportFilters;
  readonly hasFilters: boolean;
  readonly onFiltersChange: (filters: ReportFilters) => void;
  readonly scopeLabel: string;
}) {
  const isCompact = useMediaQuery("(max-width: 640px)");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const toolbarRef = useRef<HTMLElement>(null);
  const scopeLabelRef = useRef<HTMLElement>(null);
  const pendingChipFocusIndexRef = useRef<number | undefined>(undefined);
  const updateFilter = <Key extends keyof ReportFilters>(
    key: Key,
    value: ReportFilters[Key],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };
  const activeFilters = [
    filters.foxQuery.trim()
      ? {
          label: `Лиса: ${filters.foxQuery.trim()}`,
          remove: () => updateFilter("foxQuery", ""),
        }
      : undefined,
    filters.location
      ? {
          label: `Локация: ${filters.location}`,
          remove: () => updateFilter("location", ""),
        }
      : undefined,
    filters.color
      ? {
          label: `Цвет: ${filters.color}`,
          remove: () => updateFilter("color", ""),
        }
      : undefined,
    filters.prey !== "all"
      ? {
          label: `Добыча: ${filters.prey === "with-prey" ? "есть" : "нет"}`,
          remove: () => updateFilter("prey", "all"),
        }
      : undefined,
  ].filter(
    (filter): filter is { label: string; remove: () => void } =>
      filter !== undefined,
  );

  useEffect(() => {
    const removedIndex = pendingChipFocusIndexRef.current;

    if (removedIndex === undefined) {
      return;
    }

    pendingChipFocusIndexRef.current = undefined;
    const remainingChips =
      toolbarRef.current?.querySelectorAll<HTMLButtonElement>(".filter-chip");
    const nextChip = remainingChips?.item(
      Math.min(removedIndex, remainingChips.length - 1),
    );

    if (nextChip) {
      nextChip.focus();
      return;
    }

    scopeLabelRef.current?.focus();
  }, [filters]);

  return (
    <section
      className="scope-toolbar"
      aria-label="Фильтры рейтинга"
      ref={toolbarRef}
    >
      <div className="scope-toolbar__summary">
        <span aria-hidden="true" className="scope-toolbar__signal" />
        <strong ref={scopeLabelRef} tabIndex={-1}>
          {scopeLabel}
        </strong>
        {isCompact && (
          <button
            aria-controls="scope-toolbar-controls"
            aria-expanded={filtersExpanded}
            className="secondary-action scope-toolbar__toggle"
            onClick={() => setFiltersExpanded((current) => !current)}
            type="button"
          >
            {filtersExpanded ? "Скрыть фильтры" : "Показать фильтры"}
          </button>
        )}
      </div>

      <div
        className="scope-toolbar__controls"
        hidden={isCompact && !filtersExpanded}
        id="scope-toolbar-controls"
      >
        <label className="filter-field filter-field--search">
          <span>Найти лису</span>
          <input
            autoComplete="off"
            onChange={(event) => updateFilter("foxQuery", event.target.value)}
            placeholder="Например, Лиса 1 или fox_001"
            type="search"
            value={filters.foxQuery}
          />
        </label>

        <label className="filter-field">
          <span>Локация</span>
          <select
            onChange={(event) => updateFilter("location", event.target.value)}
            value={filters.location}
          >
            <option value="">Все локации</option>
            {filterOptions.locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Цвет</span>
          <select
            onChange={(event) => updateFilter("color", event.target.value)}
            value={filters.color}
          >
            <option value="">Все цвета</option>
            {filterOptions.colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="prey-filter">
          <legend>Добыча</legend>
          <div>
            {(
              [
                ["all", "Все"],
                ["with-prey", "Есть"],
                ["without-prey", "Нет"],
              ] as const
            ).map(([value, label]) => (
              <label key={value}>
                <input
                  checked={filters.prey === value}
                  name="prey-filter"
                  onChange={() => updateFilter("prey", value as PreyFilter)}
                  type="radio"
                  value={value}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {hasFilters && (
          <button
            className="text-action scope-toolbar__reset"
            onClick={() => onFiltersChange(DEFAULT_REPORT_FILTERS)}
            type="button"
          >
            Сбросить всё
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="filter-chips" aria-label="Активные фильтры">
          {activeFilters.map((filter, index) => (
            <FilterChip
              key={filter.label}
              label={filter.label}
              onRemove={() => {
                pendingChipFocusIndexRef.current = index;
                filter.remove();
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  readonly label: string;
  readonly onRemove: () => void;
}) {
  return (
    <button
      aria-label={`Удалить фильтр ${label}`}
      className="filter-chip"
      onClick={onRemove}
      type="button"
    >
      <span>{label}</span>
      <span aria-hidden="true">×</span>
    </button>
  );
}

function RankingRow({
  assessment,
  isLeader,
  isSelected,
  onSelect,
}: {
  readonly assessment: RankedFoxViewModel;
  readonly isLeader: boolean;
  readonly isSelected: boolean;
  readonly onSelect: (foxId: string) => void;
}) {
  const className = [
    "ranking-row",
    isLeader ? "ranking-row--leader" : "",
    isSelected ? "ranking-row--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={className}>
      <button
        aria-label={`Показать расчёт: ${assessment.foxName}, индекс ${assessment.scoreLabel}; позиция ${assessment.rank}; подозрительность ${assessment.meanSuspicionLabel}; добыча в ${assessment.preyObservationCount} из ${assessment.observationCount} наблюдений; последняя запись ${assessment.latestTime}; локации: ${assessment.locationSummaryLabel}; цвет ${assessment.colorSummaryLabel}; наблюдений ${assessment.observationCount}; идентификатор ${assessment.foxId}`}
        aria-pressed={isSelected}
        className="ranking-row__button"
        onClick={() => onSelect(assessment.foxId)}
        type="button"
      >
        <span className="ranking-row__rank">
          {String(assessment.rank).padStart(2, "0")}
        </span>
        <span className="ranking-row__identity">
          <span className="ranking-row__name">
            <strong>{assessment.foxName}</strong>
            {hasDistinctFoxDisplayName(
              assessment.foxId,
              assessment.foxName,
            ) && <span className="data-id">{assessment.foxId}</span>}
          </span>
          <span className="ranking-row__latest">
            <span
              aria-hidden="true"
              className="color-swatch"
              data-color={assessment.color}
            />
            {assessment.colorSummaryLabel} · {assessment.latestTime}
          </span>
          <span className="ranking-row__location">
            {assessment.locationSummaryLabel}
          </span>
        </span>
        <span className="ranking-row__basis">
          <span>подозрительность {assessment.meanSuspicionLabel}</span>
          <span>
            добыча в {assessment.preyObservationCount} из{" "}
            {assessment.observationCount}
          </span>
        </span>
        <span className="ranking-row__evidence">
          {assessment.observationCount}{" "}
          {formatObservationCount(assessment.observationCount)}
        </span>
        <strong className="ranking-row__score">{assessment.scoreLabel}</strong>
      </button>
    </li>
  );
}

function PolicyControl({
  commitCurrentWeight,
  onPreyWeightChange,
  onPreyWeightCommit,
  viewModel,
}: {
  readonly commitCurrentWeight: () => void;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly viewModel: SummaryViewModel;
}) {
  const isCompact = useMediaQuery("(max-width: 640px)");
  const keyboardCommitTimerRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const cancelKeyboardCommit = () => {
    if (keyboardCommitTimerRef.current !== undefined) {
      clearTimeout(keyboardCommitTimerRef.current);
      keyboardCommitTimerRef.current = undefined;
    }
  };

  const scheduleKeyboardCommit = (preyWeightPercent: number) => {
    cancelKeyboardCommit();
    keyboardCommitTimerRef.current = setTimeout(() => {
      keyboardCommitTimerRef.current = undefined;
      onPreyWeightCommit(preyWeightPercent);
    }, 250);
  };

  useEffect(
    () => () => {
      if (keyboardCommitTimerRef.current !== undefined) {
        clearTimeout(keyboardCommitTimerRef.current);
      }
    },
    [],
  );

  return (
    <fieldset className="policy-control">
      <legend className="visually-hidden">Настройка веса параметров</legend>
      <div className="policy-control__label-row">
        <label htmlFor="prey-weight">Влияние добычи</label>
        <span>{viewModel.preyWeightPercent}%</span>
      </div>
      <input
        aria-describedby="prey-weight-help"
        aria-valuetext={`${viewModel.preyWeightPercent}% - влияние подозрительности ${viewModel.suspicionWeightPercent}%, наличие добычи ${viewModel.preyWeightPercent}%`}
        id="prey-weight"
        max="100"
        min="0"
        onBlur={() => {
          cancelKeyboardCommit();
          commitCurrentWeight();
        }}
        onChange={handleWeightChange(onPreyWeightChange)}
        onKeyUp={(event) => {
          if (
            [
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "End",
              "Home",
              "PageDown",
              "PageUp",
            ].includes(event.key)
          ) {
            scheduleKeyboardCommit(Number(event.currentTarget.value));
          }
        }}
        onPointerDown={cancelKeyboardCommit}
        onPointerUp={() => {
          cancelKeyboardCommit();
          commitCurrentWeight();
        }}
        step="5"
        type="range"
        value={viewModel.preyWeightPercent}
      />
      <ExactWeightControl
        onPreyWeightChange={onPreyWeightChange}
        onPreyWeightCommit={onPreyWeightCommit}
        preyWeightPercent={viewModel.preyWeightPercent}
      />
      <div className="policy-control__weights">
        <span>
          Влияние подозрительности {viewModel.suspicionWeightPercent}%
        </span>
        <span>Наличие добычи {viewModel.preyWeightPercent}%</span>
      </div>
      {isCompact && viewModel.leader && (
        <section
          aria-label="Текущий результат расчёта"
          className="policy-control__compact-result"
        >
          <span>
            {viewModel.leaders.length > 1 ? "Текущие лидеры" : "Текущий лидер"}
          </span>
          <strong>
            {formatFoxNameList(viewModel.leaders.map(({ foxName }) => foxName))}
          </strong>
          <span>{viewModel.leader.scoreLabel} из 10</span>
        </section>
      )}
      <p id="prey-weight-help">Измените вес параметров</p>
      <button
        className="text-action"
        disabled={viewModel.preyWeightPercent === 20}
        onClick={() => {
          onPreyWeightChange(20);
          onPreyWeightCommit(20);
        }}
        type="button"
      >
        Сбросить значения
      </button>
    </fieldset>
  );
}

function ExactWeightControl({
  onPreyWeightChange,
  onPreyWeightCommit,
  preyWeightPercent,
}: {
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly preyWeightPercent: number;
}) {
  const [draft, setDraft] = useState({
    committedWeight: preyWeightPercent,
    dirty: false,
    error: "",
    value: String(preyWeightPercent),
  });

  if (draft.committedWeight !== preyWeightPercent) {
    setDraft({
      committedWeight: preyWeightPercent,
      dirty: false,
      error: "",
      value: String(preyWeightPercent),
    });
  }

  const commitExactWeight = () => {
    if (!draft.dirty) {
      return;
    }

    const nextWeight = Number(draft.value);

    if (
      draft.value.trim() === "" ||
      !Number.isInteger(nextWeight) ||
      nextWeight < 0 ||
      nextWeight > 100 ||
      nextWeight % 5 !== 0
    ) {
      setDraft((current) => ({
        ...current,
        dirty: false,
        error: "Введите целое число от 0 до 100 с шагом 5.",
      }));
      return;
    }

    setDraft({
      committedWeight: nextWeight,
      dirty: false,
      error: "",
      value: String(nextWeight),
    });
    onPreyWeightChange(nextWeight);
    onPreyWeightCommit(nextWeight);
  };

  return (
    <div className="policy-control__exact">
      <div className="policy-control__exact-copy">
        <label htmlFor="prey-weight-exact">
          Влияние добычи, точное значение
        </label>
        <p className="field-hint" id="prey-weight-exact-hint">
          От 0 до 100%, шаг 5.
        </p>
        {draft.error && (
          <p className="field-error" id="prey-weight-exact-error">
            {draft.error}
          </p>
        )}
      </div>
      <div className="policy-control__exact-input">
        <input
          aria-describedby={`prey-weight-exact-hint${draft.error ? " prey-weight-exact-error" : ""}`}
          aria-invalid={Boolean(draft.error)}
          id="prey-weight-exact"
          max="100"
          min="0"
          onBlur={commitExactWeight}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setDraft((current) => ({
              ...current,
              dirty: true,
              error: "",
              value: nextValue,
            }));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitExactWeight();
            }
          }}
          step="5"
          type="number"
          value={draft.value}
        />
        <span aria-hidden="true">%</span>
      </div>
    </div>
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
      <p>
        <span>{detail}</span> = {value}
      </p>
      <span aria-hidden="true" className="contribution-row__track">
        <span style={style} />
      </span>
    </div>
  );
}

function formatPositionCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word =
    mod100 >= 11 && mod100 <= 14
      ? "позиций"
      : mod10 === 1
        ? "позиция"
        : mod10 >= 2 && mod10 <= 4
          ? "позиции"
          : "позиций";

  return `${count} ${word}`;
}

function formatFoxNameList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";

  const numberedNames = names.map((name) => /^Лиса (.+)$/u.exec(name));
  if (numberedNames.every((match) => match !== null)) {
    return `Лисы ${joinRussianList(
      numberedNames.map((match) => match?.[1] ?? ""),
    )}`;
  }

  return joinRussianList(names);
}

function joinRussianList(values: readonly string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} и ${values[1]}`;

  return `${values.slice(0, -1).join(", ")} и ${values.at(-1)}`;
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
