import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import type {
  EvidenceObservationViewModel,
  LocationActivityViewModel,
  RankedFoxViewModel,
  SelectedFoxViewModel,
  SummaryViewModel,
} from "@/observation-monitoring/application/create-summary-view-model";
import { formatFoxDisplayName } from "@/observation-monitoring/application/fox-display-name";
import {
  DEFAULT_REPORT_FILTERS,
  hasActiveReportFilters,
  type PreyFilter,
  type ReportFilterOptions,
  type ReportFilters,
} from "@/observation-monitoring/application/report-scope";

interface SummaryPageProps {
  readonly filterOptions: ReportFilterOptions;
  readonly filters: ReportFilters;
  readonly onFiltersChange: (filters: ReportFilters) => void;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly onSelectFox: (foxId: string) => void;
  readonly viewModel: SummaryViewModel;
}

interface EvidenceSelection {
  readonly foxId: string;
  readonly observationId: string;
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
  const [evidenceSelection, setEvidenceSelection] =
    useState<EvidenceSelection>();
  const leader = viewModel.leader;
  const selectedFox = viewModel.selectedFox;
  const selectedObservationId = getSelectedObservationId(
    selectedFox,
    evidenceSelection,
  );
  const hasFilters = hasActiveReportFilters(filters);

  const commitCurrentWeight = () => {
    onPreyWeightCommit(viewModel.preyWeightPercent);
  };

  const selectEvidence = (observationId: string) => {
    if (!selectedFox) {
      return;
    }

    setEvidenceSelection({ foxId: selectedFox.foxId, observationId });
  };

  return (
    <div className="page page--summary">
      <ScopeToolbar
        filterOptions={filterOptions}
        filters={filters}
        hasFilters={hasFilters}
        onFiltersChange={onFiltersChange}
        scopeLabel={viewModel.scope.label}
      />

      {!leader || !selectedFox ? (
        <section className="empty-report" aria-labelledby="empty-title">
          <p className="eyebrow">Текущая область</p>
          <h1 className="summary-empty-title" tabIndex={-1}>
            Сводка наблюдений
          </h1>
          <h2 id="empty-title">В этой выборке ничего не найдено</h2>
          <p>
            Измените или сбросьте фильтры — исходный набор остаётся без
            изменений.
          </p>
          {hasFilters && (
            <button
              className="primary-action"
              onClick={() => onFiltersChange(DEFAULT_REPORT_FILTERS)}
              type="button"
            >
              Сбросить фильтры
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="outcome-docket" aria-labelledby="summary-title">
            <div className="outcome-docket__intro">
              <h1
                className="summary-route-title"
                id="summary-title"
                tabIndex={-1}
              >
                Сводка наблюдений
              </h1>
              <p className="eyebrow">Лидер текущей выборки</p>
              <div className="leader-result">
                <h2 className="leader-result__fox" id="leader-title">
                  {formatFoxDisplayName(leader.foxId)}
                </h2>
                <p className="leader-result__score">
                  {leader.scoreLabel} из 10
                </p>
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
                  <dd>
                    {metric.value}
                    {metric.detail && <span>{metric.detail}</span>}
                  </dd>
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
                <p>{formatPositionCount(viewModel.ranking.length)}</p>
              </header>

              <ol
                className="ranking-list"
                aria-label="Рейтинг подозрительности"
              >
                {viewModel.ranking.map((assessment) => (
                  <RankingRow
                    assessment={assessment}
                    isLeader={assessment.foxId === leader.foxId}
                    isSelected={assessment.foxId === selectedFox.foxId}
                    key={assessment.foxId}
                    onSelect={onSelectFox}
                  />
                ))}
              </ol>
            </section>

            <aside
              aria-label={`Расчёт: ${formatFoxDisplayName(selectedFox.foxId)}`}
              className="calculation-panel"
            >
              <div className="calculation-panel__heading">
                <div>
                  <p className="eyebrow">Расчёт выбранной лисы</p>
                  <h2>{formatFoxDisplayName(selectedFox.foxId)}</h2>
                </div>
                <p>
                  Индекс <strong>{selectedFox.scoreLabel}</strong>
                </p>
              </div>

              <div className="contribution-ledger" aria-label="Вклады в индекс">
                <ContributionRow
                  detail={`${selectedFox.meanSuspicionLabel} × ${viewModel.suspicionWeightPercent}%`}
                  label="Оценка смотрителя"
                  percent={selectedFox.suspicionContributionPercent}
                  value={selectedFox.suspicionContributionLabel}
                />
                <ContributionRow
                  detail={`${selectedFox.preyRatioLabel} × 10 × ${viewModel.preyWeightPercent}%`}
                  label="Признак добычи"
                  percent={selectedFox.preyContributionPercent}
                  value={selectedFox.preyContributionLabel}
                />
              </div>

              <PolicyControl
                commitCurrentWeight={commitCurrentWeight}
                onPreyWeightChange={onPreyWeightChange}
                onPreyWeightCommit={onPreyWeightCommit}
                viewModel={viewModel}
              />

              <EvidenceInspector
                onSelectEvidence={selectEvidence}
                selectedFox={selectedFox}
                selectedObservationId={selectedObservationId}
              />
            </aside>
          </div>

          <div className="report-context-grid">
            <LocationActivity
              activeLocation={filters.location}
              locations={viewModel.locationActivity}
              onSelectLocation={(location) =>
                onFiltersChange({
                  ...filters,
                  location: filters.location === location ? "" : location,
                })
              }
              scopeCount={viewModel.scope.filteredObservationCount}
            />
            <RecentObservations viewModel={viewModel} />
          </div>
        </>
      )}
    </div>
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
      aria-label="Область отчёта"
      ref={toolbarRef}
    >
      <div className="scope-toolbar__summary">
        <span aria-hidden="true" className="scope-toolbar__signal" />
        <strong ref={scopeLabelRef} tabIndex={-1}>
          {scopeLabel}
        </strong>
        <span>Все показатели используют одну область.</span>
      </div>

      <div className="scope-toolbar__controls">
        <label className="filter-field filter-field--search">
          <span>Найти fox_id</span>
          <input
            autoComplete="off"
            onChange={(event) => updateFilter("foxQuery", event.target.value)}
            placeholder="например, fox_001"
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
        aria-label={`Показать доказательства: ${formatFoxDisplayName(assessment.foxId)}, индекс ${assessment.scoreLabel}; позиция ${assessment.rank}; оценка ${assessment.meanSuspicionLabel}; добыча ${assessment.preyRatioLabel}; последняя запись ${assessment.latestTime}, ${assessment.latestLocation}; цвет ${assessment.color}; записей ${assessment.observationCount}`}
        aria-pressed={isSelected}
        className="ranking-row__button"
        onClick={() => onSelect(assessment.foxId)}
        type="button"
      >
        <span className="ranking-row__rank">
          {String(assessment.rank).padStart(2, "0")}
        </span>
        <span className="ranking-row__identity">
          <strong>{formatFoxDisplayName(assessment.foxId)}</strong>
          <span className="ranking-row__latest">
            <span
              aria-hidden="true"
              className="color-swatch"
              data-color={assessment.color}
            />
            {assessment.color} · {assessment.latestTime}
          </span>
          <span className="ranking-row__location">
            {assessment.latestLocation}
          </span>
        </span>
        <span className="ranking-row__basis">
          <span>оценка {assessment.meanSuspicionLabel}</span>
          <span>добыча {assessment.preyRatioLabel}</span>
        </span>
        <span className="ranking-row__evidence">
          {assessment.observationCount} зап.
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
  return (
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
        Добыча — настраиваемый сигнал диспетчерского внимания. Остальной вес
        автоматически принадлежит прямой оценке смотрителя.
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
  );
}

function EvidenceInspector({
  onSelectEvidence,
  selectedFox,
  selectedObservationId,
}: {
  readonly onSelectEvidence: (observationId: string) => void;
  readonly selectedFox: SelectedFoxViewModel;
  readonly selectedObservationId: string | undefined;
}) {
  return (
    <section className="evidence-inspector" aria-labelledby="evidence-title">
      <div className="evidence-inspector__heading">
        <div>
          <p className="eyebrow">Исходные записи</p>
          <h3 id="evidence-title">Лента доказательств</h3>
        </div>
        <span>{selectedFox.timeRangeLabel}</span>
      </div>
      <p className="evidence-inspector__help">
        Горизонталь — время, высота — прямая оценка. Линия маршрута не строится.
      </p>

      <div
        aria-label={`Наблюдения: ${formatFoxDisplayName(selectedFox.foxId)}, по времени и оценке`}
        className="evidence-strip"
      >
        <span aria-hidden="true" className="evidence-strip__axis" />
        {selectedFox.evidence.map((observation) => (
          <EvidenceMarker
            isSelected={observation.id === selectedObservationId}
            key={observation.id}
            observation={observation}
            onSelect={onSelectEvidence}
          />
        ))}
      </div>

      <ol
        aria-label={`Исходные наблюдения: ${formatFoxDisplayName(selectedFox.foxId)}`}
        className="evidence-records"
      >
        {selectedFox.observations.map((observation) => {
          const isSelected = observation.id === selectedObservationId;

          return (
            <li
              className={
                isSelected
                  ? "evidence-record evidence-record--selected"
                  : "evidence-record"
              }
              key={observation.id}
            >
              <button
                aria-pressed={isSelected}
                onClick={() => onSelectEvidence(observation.id)}
                type="button"
              >
                <span className="evidence-record__time">
                  <time>{observation.time}</time>
                  <span className="data-id">{observation.id}</span>
                </span>
                <span className="evidence-record__place">
                  <strong>{observation.location}</strong>
                  <span>
                    <span
                      aria-hidden="true"
                      className="color-swatch"
                      data-color={observation.color}
                    />
                    {observation.color}
                  </span>
                </span>
                <span className="evidence-record__facts">
                  <strong>{observation.suspicionLevel} / 10</strong>
                  <span>{observation.preyLabel}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="evidence-inspector__boundary">
        В индекс не входят локация, цвет, время и число появлений сами по себе.
      </p>
    </section>
  );
}

function EvidenceMarker({
  isSelected,
  observation,
  onSelect,
}: {
  readonly isSelected: boolean;
  readonly observation: EvidenceObservationViewModel;
  readonly onSelect: (observationId: string) => void;
}) {
  const style = {
    "--evidence-level": observation.suspicionLevel,
    "--evidence-x": `${observation.timelinePositionPercent}%`,
  } as CSSProperties;

  return (
    <button
      aria-label={observation.accessibleLabel}
      aria-pressed={isSelected}
      className="evidence-marker"
      onClick={() => onSelect(observation.id)}
      style={style}
      type="button"
    >
      <strong>{observation.suspicionLevel}</strong>
      <time>{observation.time}</time>
      {observation.hasPrey && <span aria-hidden="true">добыча</span>}
    </button>
  );
}

function LocationActivity({
  activeLocation,
  locations,
  onSelectLocation,
  scopeCount,
}: {
  readonly activeLocation: string;
  readonly locations: readonly LocationActivityViewModel[];
  readonly onSelectLocation: (location: string) => void;
  readonly scopeCount: number;
}) {
  return (
    <section
      className="context-panel location-panel"
      aria-labelledby="location-activity-title"
    >
      <div className="context-panel__heading">
        <div>
          <p className="eyebrow">Распределение записей</p>
          <h2 id="location-activity-title">Активность по локациям</h2>
        </div>
        <p>Количество наблюдений в текущей выборке.</p>
      </div>
      <ul className="location-list">
        {locations.map((activity) => {
          const style = {
            "--location-width": `${activity.percentage}%`,
          } as CSSProperties;

          return (
            <li key={activity.location}>
              <button
                aria-label={`Фильтровать по локации ${activity.location}, ${activity.observationCount} из ${scopeCount}, ${activity.percentageLabel}`}
                aria-pressed={activeLocation === activity.location}
                onClick={() => onSelectLocation(activity.location)}
                type="button"
              >
                <span className="location-row__label">
                  <strong>{activity.location}</strong>
                  <span>
                    {activity.observationCount} из {scopeCount} ·{" "}
                    {activity.percentageLabel}
                  </span>
                </span>
                <span aria-hidden="true" className="location-row__track">
                  <span style={style} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecentObservations({
  viewModel,
}: {
  readonly viewModel: SummaryViewModel;
}) {
  return (
    <section
      className="context-panel recent-panel"
      aria-labelledby="recent-observations-title"
    >
      <div className="context-panel__heading">
        <div>
          <p className="eyebrow">Текущая область</p>
          <h2 id="recent-observations-title">Последние наблюдения</h2>
        </div>
        <a href="#observations">Все наблюдения</a>
      </div>
      <ol className="recent-list">
        {viewModel.recentObservations.map((observation) => (
          <li key={observation.id}>
            <time>{observation.time}</time>
            <span>
              <strong>{formatFoxDisplayName(observation.foxId)}</strong>
              <span>{observation.location}</span>
            </span>
            <span>
              <strong>{observation.suspicionLevel} / 10</strong>
              <span>{observation.preyLabel}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
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

function getSelectedObservationId(
  selectedFox: SelectedFoxViewModel | undefined,
  evidenceSelection: EvidenceSelection | undefined,
): string | undefined {
  if (
    selectedFox &&
    evidenceSelection?.foxId === selectedFox.foxId &&
    selectedFox.observations.some(
      ({ id }) => id === evidenceSelection.observationId,
    )
  ) {
    return evidenceSelection.observationId;
  }

  return selectedFox?.observations[0]?.id;
}

function formatPositionCount(count: number): string {
  return count === 1 ? "1 позиция" : `${count} позиции`;
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
