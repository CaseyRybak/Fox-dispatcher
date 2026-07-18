import type { Observation } from "@/observation-monitoring/domain/observation";
import {
  formatFoxDisplayName,
  formatFoxIdentityEntries,
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
  readonly calculationIsRounded: boolean;
  readonly color: string;
  readonly colorSummaryLabel: string;
  readonly explanation: string;
  readonly foxId: string;
  readonly foxName: string;
  readonly latestTime: string;
  readonly locationSummaryLabel: string;
  readonly meanSuspicionLabel: string;
  readonly observationCount: number;
  readonly preyContributionLabel: string;
  readonly preyObservationCount: number;
  readonly preyRatioLabel: string;
  readonly rank: number;
  readonly scoreLabel: string;
  readonly scoreTenths: number;
  readonly suspicionContributionLabel: string;
  readonly suspicionContributionPercent: number;
  readonly preyContributionPercent: number;
}

export interface SummaryMetricViewModel {
  readonly detail?: string;
  readonly label: string;
  readonly value: string;
}

export type SelectedFoxViewModel = RankedFoxViewModel;

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
  readonly filteredFoxCount: number;
  readonly label: string;
  readonly totalObservationCount: number;
  readonly totalFoxCount: number;
}

export interface SummaryViewModel {
  readonly leader?: RankedFoxViewModel;
  readonly leaders: readonly RankedFoxViewModel[];
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
  readonly totalFoxCount?: number;
  readonly visibleFoxIds?: ReadonlySet<string>;
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
  const locationsByFox = collectLocationsByFox(observations);
  const completeRanking = report.assessments.map((assessment, index) =>
    createRankedFoxViewModel(
      assessment,
      index,
      colorsByFox.get(assessment.foxId)?.size ?? 1,
      locationsByFox.get(assessment.foxId)?.size ?? 1,
    ),
  );
  const visibleFoxIds = options.visibleFoxIds;
  const ranking = visibleFoxIds
    ? completeRanking.filter(({ foxId }) => visibleFoxIds.has(foxId))
    : completeRanking;
  const leadingLocation = report.locationActivity[0];
  const leaderFoxIds = new Set(report.leaders.map(({ foxId }) => foxId));
  const selectedRankingItem =
    ranking.find(({ foxId }) => foxId === options.selectedFoxId) ??
    ranking[0] ??
    completeRanking.find(({ foxId }) => foxId === options.selectedFoxId) ??
    completeRanking[0];
  const totalObservationCount =
    options.totalObservationCount ?? observations.length;
  const totalFoxCount = options.totalFoxCount ?? report.uniqueFoxCount;

  return {
    leader: completeRanking[0],
    leaders: completeRanking.filter(({ foxId }) => leaderFoxIds.has(foxId)),
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
        detail: leadingLocation
          ? `${leadingLocation.observationCount} из ${report.observationCount} наблюдений`
          : undefined,
        label: "Основная локация",
        value: leadingLocation?.location ?? "Нет данных",
      },
    ],
    preyWeightPercent,
    ranking,
    recentObservations: [...observations]
      .sort(compareObservationRecency)
      .slice(0, 3)
      .map(createRecentObservationViewModel),
    scope: {
      filteredFoxCount: ranking.length,
      label: `Показано лис: ${ranking.length} из ${totalFoxCount}`,
      totalObservationCount,
      totalFoxCount,
    },
    selectedFox: selectedRankingItem,
    suspicionWeightPercent: 100 - preyWeightPercent,
  };
}

export function createPolicyAnnouncement(
  previousPreyWeightPercent: number,
  previousLeaderFoxIds: readonly string[],
  viewModel: SummaryViewModel,
): string {
  const leader = viewModel.leader;
  const leaderFoxIds = viewModel.leaders.map(({ foxId }) => foxId);
  const weightChange = `Вес добычи изменён с ${previousPreyWeightPercent}% до ${viewModel.preyWeightPercent}%.`;

  if (!leader) {
    return `${weightChange} В выборке нет наблюдений.`;
  }

  const leadersAreUnchanged =
    previousLeaderFoxIds.length === leaderFoxIds.length &&
    previousLeaderFoxIds.every((foxId, index) => foxId === leaderFoxIds[index]);

  if (leaderFoxIds.length > 1) {
    return `${weightChange} ${leadersAreUnchanged ? "Лидеры не изменились:" : "Новые лидеры -"} ${formatFoxIdentityEntries(viewModel.leaders)}, индекс ${leader.scoreLabel}.`;
  }

  if (!leadersAreUnchanged) {
    return `${weightChange} Новый лидер - ${formatFoxIdentityLabel(leader.foxId, leader.foxName)}, индекс ${leader.scoreLabel}.`;
  }

  return `${weightChange} Лидер не изменился: ${formatFoxIdentityLabel(leader.foxId, leader.foxName)}, индекс ${leader.scoreLabel}.`;
}

function createRankedFoxViewModel(
  assessment: FoxAssessment,
  index: number,
  colorCount: number,
  locationCount: number,
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
  const scoreLabel = formatTenths(roundFractionToTenths(assessment.score));
  const suspicionContributionLabel = formatCompactTenths(
    suspicionContributionTenths,
  );
  const preyContributionLabel = formatCompactTenths(preyContributionTenths);
  const calculationIsRounded = [
    assessment.meanSuspicion,
    assessment.suspicionContribution,
    assessment.preyContribution,
    assessment.score,
  ].some((fraction) => !isExactAtTenths(fraction));

  return {
    calculationIsRounded,
    color: assessment.latestObservation.color,
    colorSummaryLabel:
      colorCount > 1
        ? `${assessment.latestObservation.color} · ${formatColorCount(colorCount)}`
        : assessment.latestObservation.color,
    explanation: `Средняя оценка по ${assessment.observationCount} ${formatObservationDativeCount(assessment.observationCount)} - ${meanSuspicionLabel}; вклад оценки - ${suspicionContributionLabel}. Добыча отмечена в ${assessment.preyObservationCount} из ${assessment.observationCount} наблюдений; вклад добычи - ${preyContributionLabel}. Итоговый индекс - ${scoreLabel}.`,
    foxId: assessment.foxId,
    foxName: formatFoxDisplayName(assessment.foxId, assessment.foxName),
    latestTime: assessment.latestObservation.time,
    locationSummaryLabel:
      locationCount > 1
        ? "Несколько локаций"
        : assessment.latestObservation.location,
    meanSuspicionLabel,
    observationCount: assessment.observationCount,
    preyContributionLabel,
    preyContributionPercent: preyContributionTenths,
    preyObservationCount: assessment.preyObservationCount,
    preyRatioLabel: `${assessment.preyObservationCount}/${assessment.observationCount}`,
    rank: index + 1,
    scoreLabel,
    scoreTenths: roundFractionToTenths(assessment.score),
    suspicionContributionLabel,
    suspicionContributionPercent: suspicionContributionTenths,
  };
}

function isExactAtTenths(fraction: ExactFraction): boolean {
  return (
    roundFractionToTenths(fraction) * fraction.denominator ===
    fraction.numerator * 10
  );
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

function collectLocationsByFox(
  observations: readonly Observation[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const locationsByFox = new Map<string, Set<string>>();

  for (const observation of observations) {
    const locations =
      locationsByFox.get(observation.fox_id) ?? new Set<string>();
    locations.add(observation.location);
    locationsByFox.set(observation.fox_id, locations);
  }

  return locationsByFox;
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

function formatCompactTenths(tenths: number): string {
  return tenths % 10 === 0 ? String(tenths / 10) : formatTenths(tenths);
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

export function formatObservationCount(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;

  if (remainder100 >= 11 && remainder100 <= 14) {
    return "наблюдений";
  }

  if (remainder10 === 1) {
    return "наблюдение";
  }

  if (remainder10 >= 2 && remainder10 <= 4) {
    return "наблюдения";
  }

  return "наблюдений";
}

function formatObservationDativeCount(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? "наблюдению" : "наблюдениям";
}
