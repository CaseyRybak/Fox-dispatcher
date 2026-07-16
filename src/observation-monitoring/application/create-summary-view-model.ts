import type { Observation } from "@/observation-monitoring/domain/observation";
import {
  createScoringPolicy,
  DEFAULT_SCORING_POLICY,
} from "@/observation-monitoring/domain/scoring-policy";
import {
  calculateSuspicionReport,
  roundFractionToTenths,
  type FoxAssessment,
} from "@/observation-monitoring/domain/suspicion-report";

export interface RankedFoxViewModel {
  readonly color: string;
  readonly explanation: string;
  readonly foxId: string;
  readonly latestLocation: string;
  readonly latestTime: string;
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

export interface SummaryViewModel {
  readonly leader?: RankedFoxViewModel;
  readonly metrics: readonly SummaryMetricViewModel[];
  readonly preyWeightPercent: number;
  readonly ranking: readonly RankedFoxViewModel[];
  readonly suspicionWeightPercent: number;
}

export const DEFAULT_PREY_WEIGHT_PERCENT =
  DEFAULT_SCORING_POLICY.preyWeightPercent;

export function createSummaryViewModel(
  observations: readonly Observation[],
  preyWeightPercent: number,
): SummaryViewModel {
  const report = calculateSuspicionReport(
    observations,
    createScoringPolicy(preyWeightPercent),
  );
  const ranking = report.assessments.map(createRankedFoxViewModel);
  const leadingLocation = report.locationActivity[0];

  return {
    leader: ranking[0],
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
        detail: report.latestObservation?.fox_id,
        label: "Последнее событие",
        value: report.latestObservation?.time ?? "Нет данных",
      },
    ],
    preyWeightPercent,
    ranking,
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
    return `Лидер изменился: ${leader.foxId}, ${leader.scoreLabel}.`;
  }

  return `Влияние добычи ${viewModel.preyWeightPercent}%. Лидер ${leader.foxId}, индекс ${leader.scoreLabel}.`;
}

function createRankedFoxViewModel(
  assessment: FoxAssessment,
  index: number,
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
  const suspicionContributionLabel = formatTenths(suspicionContributionTenths);
  const preyContributionLabel = formatTenths(preyContributionTenths);

  return {
    color: assessment.latestObservation.color,
    explanation: `Средняя оценка ${meanSuspicionLabel} дала ${suspicionContributionLabel} балла; добыча в ${assessment.preyObservationCount} из ${assessment.observationCount} ${formatRecordCount(assessment.observationCount)} добавила ${preyContributionLabel}.`,
    foxId: assessment.foxId,
    latestLocation: assessment.latestObservation.location,
    latestTime: assessment.latestObservation.time,
    meanSuspicionLabel,
    observationCount: assessment.observationCount,
    preyContributionLabel,
    preyContributionPercent: preyContributionTenths,
    preyObservationCount: assessment.preyObservationCount,
    preyRatioLabel: `${assessment.preyObservationCount}/${assessment.observationCount}`,
    rank: index + 1,
    scoreLabel: formatTenths(roundFractionToTenths(assessment.score)),
    scoreTenths: roundFractionToTenths(assessment.score),
    suspicionContributionLabel,
    suspicionContributionPercent: suspicionContributionTenths,
  };
}

function formatTenths(tenths: number): string {
  return `${Math.floor(tenths / 10)},${tenths % 10}`;
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
