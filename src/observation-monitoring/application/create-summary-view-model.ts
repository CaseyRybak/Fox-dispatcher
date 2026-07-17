import type { Observation } from "@/observation-monitoring/domain/observation";
import {
  formatFoxDisplayName,
  formatFoxIdentityLabel,
} from "@/observation-monitoring/application/fox-display-name";
import {
  createScoringPolicy,
  DEFAULT_SCORING_POLICY,
} from "@/observation-monitoring/domain/scoring-policy";
import {
  calculateSuspicionReport,
  roundFractionToTenths,
  type ExactFraction,
  type FoxAssessment,
} from "@/observation-monitoring/domain/suspicion-report";

export interface RankedFoxViewModel {
  readonly color: string;
  readonly colorSummaryLabel: string;
  readonly explanation: string;
  readonly foxId: string;
  readonly latestLocation: string;
  readonly latestTime: string;
  readonly meanSuspicionLabel: string;
  readonly meanSuspicionExactLabel: string;
  readonly observationCount: number;
  readonly preyContributionExactLabel: string;
  readonly preyObservationCount: number;
  readonly preyRatioLabel: string;
  readonly rank: number;
  readonly scoreLabel: string;
  readonly scoreTenths: number;
  readonly suspicionContributionExactLabel: string;
  readonly suspicionContributionPercent: number;
  readonly preyContributionPercent: number;
}

export interface SummaryMetricViewModel {
  readonly detail?: string;
  readonly label: string;
  readonly value: string;
}

export interface EvidenceObservationViewModel {
  readonly accessibleLabel: string;
  readonly color: string;
  readonly hasPrey: boolean;
  readonly id: string;
  readonly location: string;
  readonly preyLabel: string;
  readonly suspicionLevel: number;
  readonly time: string;
  readonly timelinePositionPercent: number;
}

export interface SelectedFoxViewModel extends RankedFoxViewModel {
  readonly evidence: readonly EvidenceObservationViewModel[];
  readonly observations: readonly EvidenceObservationViewModel[];
  readonly timeRangeLabel: string;
}

export interface LocationActivityViewModel {
  readonly location: string;
  readonly observationCount: number;
  readonly percentage: number;
  readonly percentageLabel: string;
}

export interface RecentObservationViewModel {
  readonly color: string;
  readonly foxId: string;
  readonly hasPrey: boolean;
  readonly id: string;
  readonly location: string;
  readonly preyLabel: string;
  readonly suspicionLevel: number;
  readonly time: string;
}

export interface SummaryScopeViewModel {
  readonly filteredObservationCount: number;
  readonly label: string;
  readonly totalObservationCount: number;
}

export interface SummaryViewModel {
  readonly leader?: RankedFoxViewModel;
  readonly locationActivity: readonly LocationActivityViewModel[];
  readonly metrics: readonly SummaryMetricViewModel[];
  readonly preyWeightPercent: number;
  readonly ranking: readonly RankedFoxViewModel[];
  readonly recentObservations: readonly RecentObservationViewModel[];
  readonly scope: SummaryScopeViewModel;
  readonly selectedFox?: SelectedFoxViewModel;
  readonly suspicionWeightPercent: number;
}

export interface SummaryViewModelOptions {
  readonly selectedFoxId?: string;
  readonly totalObservationCount?: number;
}

export const DEFAULT_PREY_WEIGHT_PERCENT =
  DEFAULT_SCORING_POLICY.preyWeightPercent;

export function createSummaryViewModel(
  observations: readonly Observation[],
  preyWeightPercent: number,
  options: SummaryViewModelOptions = {},
): SummaryViewModel {
  const report = calculateSuspicionReport(
    observations,
    createScoringPolicy(preyWeightPercent),
  );
  const colorsByFox = collectColorsByFox(observations);
  const ranking = report.assessments.map((assessment, index) =>
    createRankedFoxViewModel(
      assessment,
      index,
      colorsByFox.get(assessment.foxId)?.size ?? 1,
    ),
  );
  const leadingLocation = report.locationActivity[0];
  const selectedRankingItem =
    ranking.find(({ foxId }) => foxId === options.selectedFoxId) ?? ranking[0];
  const totalObservationCount =
    options.totalObservationCount ?? observations.length;

  return {
    leader: ranking[0],
    locationActivity: report.locationActivity.map((activity) => ({
      location: activity.location,
      observationCount: activity.observationCount,
      percentage:
        report.observationCount === 0
          ? 0
          : (activity.observationCount / report.observationCount) * 100,
      percentageLabel: formatPercentage(
        activity.observationCount,
        report.observationCount,
      ),
    })),
    metrics: [
      {
        label: "Уникальные лисы",
        value: String(report.uniqueFoxCount),
      },
      {
        label: "Наблюдения",
        value: String(report.observationCount),
      },
      {
        detail: leadingLocation
          ? `${leadingLocation.observationCount} из ${report.observationCount}`
          : undefined,
        label: "Ведущая локация",
        value: leadingLocation?.location ?? "Нет данных",
      },
      {
        detail: report.latestObservation
          ? formatFoxDisplayName(report.latestObservation.fox_id)
          : undefined,
        label: "Последнее событие",
        value: report.latestObservation?.time ?? "Нет данных",
      },
    ],
    preyWeightPercent,
    ranking,
    recentObservations: [...observations]
      .sort(compareObservationRecency)
      .slice(0, 3)
      .map(createRecentObservationViewModel),
    scope: {
      filteredObservationCount: observations.length,
      label: `Отчёт по ${observations.length} из ${totalObservationCount} наблюдений`,
      totalObservationCount,
    },
    selectedFox: selectedRankingItem
      ? createSelectedFoxViewModel(selectedRankingItem, observations)
      : undefined,
    suspicionWeightPercent: 100 - preyWeightPercent,
  };
}

export function createPolicyAnnouncement(
  previousLeaderFoxId: string | undefined,
  viewModel: SummaryViewModel,
): string {
  const leader = viewModel.leader;

  if (!leader) {
    return `Влияние добычи ${viewModel.preyWeightPercent}%. В выборке нет наблюдений.`;
  }

  if (previousLeaderFoxId !== leader.foxId) {
    return `Лидер изменился: ${formatFoxIdentityLabel(leader.foxId)}, ${leader.scoreLabel}.`;
  }

  return `Влияние добычи ${viewModel.preyWeightPercent}%. Лидер ${formatFoxIdentityLabel(leader.foxId)}, индекс ${leader.scoreLabel}.`;
}

function createRankedFoxViewModel(
  assessment: FoxAssessment,
  index: number,
  colorCount: number,
): RankedFoxViewModel {
  const meanSuspicionLabel = formatTenths(
    roundFractionToTenths(assessment.meanSuspicion),
  );
  const suspicionContributionTenths = roundFractionToTenths(
    assessment.suspicionContribution,
  );
  const preyContributionTenths = roundFractionToTenths(
    assessment.preyContribution,
  );
  const meanSuspicionExactLabel = formatExactFraction(assessment.meanSuspicion);
  const suspicionContributionExactLabel = formatExactFraction(
    assessment.suspicionContribution,
  );
  const preyContributionExactLabel = formatExactFraction(
    assessment.preyContribution,
  );
  const scoreExactLabel = formatExactFraction(assessment.score);
  const scoreLabel = formatTenths(roundFractionToTenths(assessment.score));

  return {
    color: assessment.latestObservation.color,
    colorSummaryLabel:
      colorCount > 1
        ? `${assessment.latestObservation.color} · ${formatColorCount(colorCount)}`
        : assessment.latestObservation.color,
    explanation: `Средняя оценка ${meanSuspicionExactLabel} дала точный вклад ${suspicionContributionExactLabel}; добыча в ${assessment.preyObservationCount} из ${assessment.observationCount} ${formatRecordCount(assessment.observationCount)} дала ${preyContributionExactLabel}. Точный итог ${scoreExactLabel}, отображается как ${scoreLabel}.`,
    foxId: assessment.foxId,
    latestLocation: assessment.latestObservation.location,
    latestTime: assessment.latestObservation.time,
    meanSuspicionLabel,
    meanSuspicionExactLabel,
    observationCount: assessment.observationCount,
    preyContributionExactLabel,
    preyContributionPercent: preyContributionTenths,
    preyObservationCount: assessment.preyObservationCount,
    preyRatioLabel: `${assessment.preyObservationCount}/${assessment.observationCount}`,
    rank: index + 1,
    scoreLabel,
    scoreTenths: roundFractionToTenths(assessment.score),
    suspicionContributionExactLabel,
    suspicionContributionPercent: suspicionContributionTenths,
  };
}

function collectColorsByFox(
  observations: readonly Observation[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const colorsByFox = new Map<string, Set<string>>();

  for (const observation of observations) {
    const colors = colorsByFox.get(observation.fox_id) ?? new Set<string>();
    colors.add(observation.color);
    colorsByFox.set(observation.fox_id, colors);
  }

  return colorsByFox;
}

function formatExactFraction(fraction: ExactFraction): string {
  const divisor = greatestCommonDivisor(
    Math.abs(fraction.numerator),
    fraction.denominator,
  );
  const numerator = fraction.numerator / divisor;
  const denominator = fraction.denominator / divisor;
  let finiteDenominator = denominator;
  let powersOfTwo = 0;
  let powersOfFive = 0;

  while (finiteDenominator % 2 === 0) {
    finiteDenominator /= 2;
    powersOfTwo += 1;
  }
  while (finiteDenominator % 5 === 0) {
    finiteDenominator /= 5;
    powersOfFive += 1;
  }

  if (finiteDenominator !== 1) {
    return `${numerator}/${denominator}`;
  }

  const decimalPlaces = Math.max(powersOfTwo, powersOfFive);
  const scale = 10 ** decimalPlaces;
  const scaledValue = (numerator * scale) / denominator;

  if (decimalPlaces === 0) {
    return String(scaledValue);
  }

  const integerPart = Math.floor(scaledValue / scale);
  const decimalPart = String(scaledValue % scale).padStart(decimalPlaces, "0");

  return `${integerPart},${decimalPart}`;
}

function greatestCommonDivisor(left: number, right: number): number {
  let currentLeft = left;
  let currentRight = right;

  while (currentRight !== 0) {
    [currentLeft, currentRight] = [currentRight, currentLeft % currentRight];
  }

  return currentLeft || 1;
}

function formatColorCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word =
    mod100 >= 11 && mod100 <= 14
      ? "цветов"
      : mod10 === 1
        ? "цвет"
        : mod10 >= 2 && mod10 <= 4
          ? "цвета"
          : "цветов";

  return `${count} ${word}`;
}

function formatTenths(tenths: number): string {
  return `${Math.floor(tenths / 10)},${tenths % 10}`;
}

function createSelectedFoxViewModel(
  assessment: RankedFoxViewModel,
  observations: readonly Observation[],
): SelectedFoxViewModel {
  const foxObservations = observations
    .filter(({ fox_id }) => fox_id === assessment.foxId)
    .sort(compareObservationRecency);
  const chronologicalObservations = [...foxObservations].sort(
    compareObservationChronology,
  );
  const observationMinutes = chronologicalObservations.map(({ time }) =>
    timeToMinutes(time),
  );
  const earliestMinutes = observationMinutes[0] ?? 0;
  const latestMinutes = observationMinutes.at(-1) ?? earliestMinutes;
  const timeSpan = latestMinutes - earliestMinutes;
  const evidence = chronologicalObservations.map((observation) =>
    createEvidenceObservationViewModel(
      observation,
      timeSpan === 0
        ? 50
        : 10 +
            ((timeToMinutes(observation.time) - earliestMinutes) / timeSpan) *
              80,
    ),
  );

  return {
    ...assessment,
    evidence,
    observations: foxObservations.map((observation) =>
      createEvidenceObservationViewModel(
        observation,
        evidence.find(({ id }) => id === observation.id)
          ?.timelinePositionPercent ?? 50,
      ),
    ),
    timeRangeLabel:
      evidence.length > 1
        ? `${evidence[0]?.time}–${evidence.at(-1)?.time}`
        : (evidence[0]?.time ?? "Нет наблюдений"),
  };
}

function createEvidenceObservationViewModel(
  observation: Observation,
  timelinePositionPercent: number,
): EvidenceObservationViewModel {
  const preyLabel = observation.has_prey ? "С добычей" : "Без добычи";

  return {
    accessibleLabel: `${observation.id}, ${observation.time}, оценка ${observation.suspicion_level}, ${preyLabel.toLowerCase()}, ${observation.location}`,
    color: observation.color,
    hasPrey: observation.has_prey,
    id: observation.id,
    location: observation.location,
    preyLabel,
    suspicionLevel: observation.suspicion_level,
    time: observation.time,
    timelinePositionPercent,
  };
}

function createRecentObservationViewModel(
  observation: Observation,
): RecentObservationViewModel {
  return {
    color: observation.color,
    foxId: observation.fox_id,
    hasPrey: observation.has_prey,
    id: observation.id,
    location: observation.location,
    preyLabel: observation.has_prey ? "С добычей" : "Без добычи",
    suspicionLevel: observation.suspicion_level,
    time: observation.time,
  };
}

function formatPercentage(count: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  const percentageTenths = Math.round((count / total) * 1000);

  return percentageTenths % 10 === 0
    ? `${percentageTenths / 10}%`
    : `${formatTenths(percentageTenths)}%`;
}

function compareObservationRecency(
  left: Observation,
  right: Observation,
): number {
  if (left.time !== right.time) {
    return left.time < right.time ? 1 : -1;
  }

  if (left.id < right.id) {
    return -1;
  }

  if (left.id > right.id) {
    return 1;
  }

  return 0;
}

function compareObservationChronology(
  left: Observation,
  right: Observation,
): number {
  if (left.time !== right.time) {
    return left.time < right.time ? -1 : 1;
  }

  if (left.id < right.id) {
    return -1;
  }

  if (left.id > right.id) {
    return 1;
  }

  return 0;
}

function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatRecordCount(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;

  if (remainder100 >= 11 && remainder100 <= 14) {
    return "записей";
  }

  if (remainder10 === 1) {
    return "записи";
  }

  if (remainder10 >= 2 && remainder10 <= 4) {
    return "записей";
  }

  return "записей";
}
