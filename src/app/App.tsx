import { useEffect, useMemo, useRef, useState } from "react";

import { createObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import {
  createPolicyAnnouncement,
  createSummaryViewModel,
  DEFAULT_PREY_WEIGHT_PERCENT,
} from "@/observation-monitoring/application/create-summary-view-model";
import type {
  DashboardStateRecovery,
  PersistedDashboardState,
} from "@/observation-monitoring/application/dashboard-state-store";
import type {
  ObservationExporter,
  ObservationImportFile,
  ObservationImportResult,
} from "@/observation-monitoring/application/observation-transfer";
import {
  addObservation,
  deleteObservation,
  editObservation,
  resetObservations,
  undoObservationDeletion,
  type ObservationDeletionUndo,
  type ObservationDraft,
} from "@/observation-monitoring/application/observation-management";
import {
  applyReportFilters,
  createReportFilterOptions,
  DEFAULT_REPORT_FILTERS,
  type ReportFilters,
} from "@/observation-monitoring/application/report-scope";
import {
  formatFoxIdentityEntries,
  formatFoxIdentityLabel,
} from "@/observation-monitoring/application/fox-display-name";
import { createBrowserDashboardStateStore } from "@/observation-monitoring/adapters/browser-dashboard-state/browser-dashboard-state";
import {
  createBrowserObservationExporter,
  createJsonObservationImportParser,
  readObservationImportFile,
} from "@/observation-monitoring/adapters/json-observation-transfer/json-observation-transfer";
import { publicWorklog } from "@/observation-monitoring/adapters/public-worklog/public-worklog";
import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  ApplicationShell,
  type Destination,
} from "@/observation-monitoring/ui/ApplicationShell";

const dashboardStateStore = createBrowserDashboardStateStore();
const observationImportParser = createJsonObservationImportParser();
const defaultObservationExporter = createBrowserObservationExporter();
const destinations = new Set<Destination>([
  "summary",
  "observations",
  "worklog",
]);
const destinationTitles: Readonly<Record<Destination, string>> = {
  summary: "Сводка - Лисий диспетчер",
  observations: "Параметры - Лисий диспетчер",
  worklog: "AI Worklog - Лисий диспетчер",
};

interface BootstrapState {
  readonly dashboard: PersistedDashboardState;
  readonly persistenceBlocked: boolean;
  readonly persistenceMessage: string;
  readonly recovery?: DashboardStateRecovery;
}

interface AppProps {
  readonly observationExporter?: ObservationExporter;
}

function readDestination(): Destination {
  const candidate = window.location.hash.slice(1) as Destination;
  return destinations.has(candidate) ? candidate : "summary";
}

function initializeDashboard(): BootstrapState {
  const loaded = dashboardStateStore.load();
  if (loaded.status === "valid") {
    return {
      dashboard: loaded.state,
      persistenceBlocked: false,
      persistenceMessage: "Сохранено в этом браузере",
    };
  }

  const dashboard = {
    observations: starterObservations,
    scoringPolicy: { preyWeightPercent: DEFAULT_PREY_WEIGHT_PERCENT },
  };
  if (loaded.status === "missing") {
    return {
      dashboard,
      persistenceBlocked: false,
      persistenceMessage: "Готово к сохранению в этом браузере",
    };
  }
  if (loaded.status === "unavailable") {
    return {
      dashboard,
      persistenceBlocked: true,
      persistenceMessage:
        "Хранилище недоступно - изменения останутся до закрытия страницы",
    };
  }
  if (loaded.status === "unsupported-version") {
    return {
      dashboard,
      persistenceBlocked: true,
      persistenceMessage: `Сохранение версии ${loaded.schemaVersion} не открыто - автосохранение приостановлено`,
      recovery: {
        kind: "unsupported-version",
        rawValue: loaded.rawValue,
        schemaVersion: loaded.schemaVersion,
      },
    };
  }
  return {
    dashboard,
    persistenceBlocked: true,
    persistenceMessage:
      "Сохранённые данные повреждены - автосохранение приостановлено",
    recovery: { kind: "corrupt", rawValue: loaded.rawValue },
  };
}

export function App({
  observationExporter = defaultObservationExporter,
}: AppProps = {}) {
  const [bootstrap] = useState(initializeDashboard);
  const [dashboard, setDashboard] = useState(bootstrap.dashboard);
  const initialSummary = useMemo(
    () =>
      createSummaryViewModel(
        bootstrap.dashboard.observations,
        bootstrap.dashboard.scoringPolicy.preyWeightPercent,
      ),
    [bootstrap.dashboard],
  );
  const [destination, setDestination] = useState<Destination>(readDestination);
  const [reportFilters, setReportFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [selectedFoxId, setSelectedFoxId] = useState(
    initialSummary.leader?.foxId,
  );
  const [lastDeletion, setLastDeletion] = useState<ObservationDeletionUndo>();
  const [recovery, setRecovery] = useState(bootstrap.recovery);
  const [persistenceMessage, setPersistenceMessage] = useState(
    bootstrap.persistenceMessage,
  );
  const [persistenceBlocked, setPersistenceBlocked] = useState(
    bootstrap.persistenceBlocked,
  );
  const [announcement, setAnnouncement] = useState({
    message: "",
    revision: 0,
  });
  const persistenceBlockedRef = useRef(bootstrap.persistenceBlocked);
  const pendingPolicyPersistenceWarningRef = useRef<string | undefined>(
    undefined,
  );
  const committedWeightRef = useRef(
    bootstrap.dashboard.scoringPolicy.preyWeightPercent,
  );
  const committedLeaderRef = useRef(
    initialSummary.leaders.map(({ foxId }) => foxId),
  );
  const initialDestinationRef = useRef(destination);

  const reportFilterOptions = useMemo(
    () => createReportFilterOptions(dashboard.observations),
    [dashboard.observations],
  );
  const scopedObservations = useMemo(
    () => applyReportFilters(dashboard.observations, reportFilters),
    [dashboard.observations, reportFilters],
  );
  const overview = useMemo(
    () => createObservationSetOverview(scopedObservations),
    [scopedObservations],
  );
  const summaryViewModel = useMemo(
    () =>
      createSummaryViewModel(
        scopedObservations,
        dashboard.scoringPolicy.preyWeightPercent,
        {
          selectedFoxId,
          totalObservationCount: dashboard.observations.length,
          totalFoxCount: countUniqueFoxes(dashboard.observations),
        },
      ),
    [dashboard, scopedObservations, selectedFoxId],
  );

  useEffect(() => {
    const handleHashChange = () => setDestination(readDestination());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = "ru";
    document.title = destinationTitles[destination];
    if (destination !== initialDestinationRef.current) {
      document.querySelector<HTMLElement>("#main-content h1")?.focus();
    }
  }, [destination]);

  function changePreyWeight(nextPreyWeightPercent: number) {
    const nextDashboard = {
      ...dashboard,
      scoringPolicy: { preyWeightPercent: nextPreyWeightPercent },
    };
    setDashboard(nextDashboard);
    pendingPolicyPersistenceWarningRef.current =
      persistDashboard(nextDashboard);
  }

  function commitPreyWeight(nextPreyWeightPercent: number) {
    if (committedWeightRef.current === nextPreyWeightPercent) return;

    const committedViewModel = createSummaryViewModel(
      scopedObservations,
      nextPreyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: dashboard.observations.length,
        totalFoxCount: countUniqueFoxes(dashboard.observations),
      },
    );
    const persistenceWarning = pendingPolicyPersistenceWarningRef.current;
    pendingPolicyPersistenceWarningRef.current = undefined;
    announce(
      `${createPolicyAnnouncement(committedWeightRef.current, committedLeaderRef.current, committedViewModel)}${persistenceWarning ? ` ${persistenceWarning}` : ""}`,
    );
    committedWeightRef.current = nextPreyWeightPercent;
    committedLeaderRef.current = committedViewModel.leaders.map(
      ({ foxId }) => foxId,
    );
  }

  function changeReportFilters(nextFilters: ReportFilters) {
    const nextObservations = applyReportFilters(
      dashboard.observations,
      nextFilters,
    );
    const nextViewModel = createSummaryViewModel(
      nextObservations,
      dashboard.scoringPolicy.preyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: dashboard.observations.length,
        totalFoxCount: countUniqueFoxes(dashboard.observations),
      },
    );
    const nextSelectedFoxId = nextViewModel.selectedFox?.foxId;

    announce(
      createFilterAnnouncement(
        nextViewModel.scope.filteredFoxCount,
        nextViewModel.scope.totalFoxCount,
        selectedFoxId,
        nextSelectedFoxId,
      ),
    );
    if (nextSelectedFoxId !== selectedFoxId)
      setSelectedFoxId(nextSelectedFoxId);
    committedLeaderRef.current = nextViewModel.leaders.map(
      ({ foxId }) => foxId,
    );
    setReportFilters(nextFilters);
  }

  function addDraft(draft: ObservationDraft) {
    const result = addObservation(dashboard.observations, draft);
    if (result.ok) {
      acceptObservationSet(
        result.observations,
        `Наблюдение ${result.observationId} добавлено.`,
      );
    }
    return result;
  }

  function editDraft(observationId: string, draft: ObservationDraft) {
    const result = editObservation(
      dashboard.observations,
      observationId,
      draft,
    );
    if (result.ok) {
      acceptObservationSet(
        result.observations,
        `Наблюдение ${observationId} сохранено.`,
      );
    }
    return result;
  }

  function removeObservation(observationId: string) {
    const result = deleteObservation(dashboard.observations, observationId);
    if (!result.ok) return;

    setLastDeletion(result.undo);
    acceptObservationSet(
      result.observations,
      `Наблюдение ${observationId} удалено.`,
      false,
    );
  }

  function undoDelete() {
    if (!lastDeletion) return;
    const restored = undoObservationDeletion(
      dashboard.observations,
      lastDeletion,
    );
    const observationId = lastDeletion.observation.id;
    setLastDeletion(undefined);
    acceptObservationSet(
      restored,
      `Удаление ${observationId} отменено.`,
      false,
    );
  }

  function resetStarter() {
    const clearResult = dashboardStateStore.clear();
    persistenceBlockedRef.current = clearResult.status !== "cleared";
    setPersistenceBlocked(persistenceBlockedRef.current);
    if (clearResult.status === "cleared") setRecovery(undefined);
    setPersistenceMessage(
      clearResult.status === "cleared"
        ? "Стартовые данные будут сохранены в этом браузере"
        : "Хранилище недоступно - изменения останутся до закрытия страницы",
    );
    acceptObservationSet(
      resetObservations(dashboard.observations, starterObservations),
      "Восстановлены 5 стартовых наблюдений.",
    );
  }

  function validateImport(text: string, measuredBytes?: number) {
    return observationImportParser.parse(text, measuredBytes);
  }

  function replaceImportedObservations(
    observations: Extract<
      ObservationImportResult,
      { ok: true }
    >["observations"],
  ) {
    setReportFilters(DEFAULT_REPORT_FILTERS);
    acceptObservationSet(
      observations,
      `Импорт применён: ${observations.length} ${observationCountWord(observations.length)}.`,
      true,
      DEFAULT_REPORT_FILTERS,
    );
  }

  function exportObservations() {
    const result = observationExporter.export(dashboard.observations);
    announce(
      result.status === "exported"
        ? `Экспорт подготовлен: ${dashboard.observations.length} ${observationCountWord(dashboard.observations.length)}.`
        : "Экспорт не удалось подготовить. Данные не изменены - повторите действие.",
    );
  }

  function acceptObservationSet(
    observations: PersistedDashboardState["observations"],
    message: string,
    clearUndo = true,
    filters = reportFilters,
  ) {
    const nextScopedObservations = applyReportFilters(observations, filters);
    const nextViewModel = createSummaryViewModel(
      nextScopedObservations,
      dashboard.scoringPolicy.preyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: observations.length,
        totalFoxCount: countUniqueFoxes(observations),
      },
    );

    const nextDashboard = { ...dashboard, observations };
    setDashboard(nextDashboard);
    const persistenceWarning = persistDashboard(nextDashboard);
    setSelectedFoxId(nextViewModel.selectedFox?.foxId);
    committedLeaderRef.current = nextViewModel.leaders.map(
      ({ foxId }) => foxId,
    );
    if (clearUndo) setLastDeletion(undefined);
    announce(
      createObservationMutationAnnouncement(
        message,
        selectedFoxId,
        nextViewModel,
        persistenceWarning,
      ),
    );
  }

  function persistDashboard(state: PersistedDashboardState) {
    if (persistenceBlockedRef.current) {
      return "Изменения остаются только в памяти.";
    }

    const result = dashboardStateStore.save(state);
    if (result.status === "saved") {
      setPersistenceMessage("Сохранено в этом браузере");
      return undefined;
    }

    persistenceBlockedRef.current = true;
    setPersistenceBlocked(true);
    setPersistenceMessage(
      "Не удалось сохранить - изменения останутся до закрытия страницы",
    );
    return "Не удалось сохранить: изменения остаются только в памяти.";
  }

  function selectFox(foxId: string) {
    setSelectedFoxId(foxId);
    const foxName = summaryViewModel.ranking.find(
      (assessment) => assessment.foxId === foxId,
    )?.foxName;
    announce(
      `Показаны доказательства: ${formatFoxIdentityLabel(foxId, foxName)}.`,
    );
  }

  function announce(message: string) {
    setAnnouncement(({ revision }) => ({
      message,
      revision: revision + 1,
    }));
  }

  return (
    <ApplicationShell
      announcement={announcement.message}
      announcementRevision={announcement.revision}
      destination={destination}
      filterOptions={reportFilterOptions}
      filters={reportFilters}
      lastDeletion={lastDeletion}
      onAddObservation={addDraft}
      onDeleteObservation={removeObservation}
      onDismissUndo={() => setLastDeletion(undefined)}
      onEditObservation={editDraft}
      onExportObservations={exportObservations}
      onFiltersChange={changeReportFilters}
      onPreyWeightChange={changePreyWeight}
      onPreyWeightCommit={commitPreyWeight}
      onResetStarter={resetStarter}
      onReadImportFile={(file: ObservationImportFile) =>
        readObservationImportFile(file)
      }
      onReplaceImportedObservations={replaceImportedObservations}
      onSelectFox={selectFox}
      onUndoDelete={undoDelete}
      overview={overview}
      persistenceMessage={persistenceMessage}
      persistenceBlocked={persistenceBlocked}
      recovery={recovery}
      summary={summaryViewModel}
      worklog={publicWorklog}
      onSelectRecoveryRaw={() =>
        announce(
          "Сохранённый JSON выделен. Скопируйте его обычной командой браузера.",
        )
      }
      onValidateImport={validateImport}
    />
  );
}

function observationCountWord(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return "наблюдений";
  if (mod10 === 1) return "наблюдение";
  if (mod10 >= 2 && mod10 <= 4) return "наблюдения";
  return "наблюдений";
}

function countUniqueFoxes(
  observations: PersistedDashboardState["observations"],
): number {
  return new Set(observations.map(({ fox_id }) => fox_id)).size;
}

function createObservationMutationAnnouncement(
  message: string,
  previousSelectedFoxId: string | undefined,
  viewModel: ReturnType<typeof createSummaryViewModel>,
  persistenceWarning: string | undefined,
) {
  const leaderResult = viewModel.leader
    ? viewModel.leaders.length > 1
      ? `Теперь лидируют ${formatFoxIdentityEntries(viewModel.leaders)}, ${viewModel.leader.scoreLabel}.`
      : `Теперь лидирует ${formatFoxIdentityLabel(viewModel.leader.foxId, viewModel.leader.foxName)}, ${viewModel.leader.scoreLabel}.`
    : "В текущей выборке нет лидера.";
  const nextSelectedFoxId = viewModel.selectedFox?.foxId;
  const selectionResult =
    previousSelectedFoxId !== nextSelectedFoxId && nextSelectedFoxId
      ? ` Выбрана ${formatFoxIdentityLabel(
          nextSelectedFoxId,
          viewModel.selectedFox?.foxName,
        )}.`
      : previousSelectedFoxId && !nextSelectedFoxId
        ? ` ${formatFoxIdentityLabel(previousSelectedFoxId)} больше не входит в выборку.`
        : "";

  return `${message} ${leaderResult}${selectionResult}${persistenceWarning ? ` ${persistenceWarning}` : ""}`;
}

function createFilterAnnouncement(
  filteredFoxCount: number,
  totalFoxCount: number,
  previousFoxId: string | undefined,
  nextFoxId: string | undefined,
): string {
  const scope = `Фильтры применены: ${filteredFoxCount} лис из ${totalFoxCount}.`;
  if (previousFoxId === nextFoxId) return scope;
  if (nextFoxId)
    return `${scope} Выбрана ${formatFoxIdentityLabel(nextFoxId)}.`;
  if (previousFoxId) {
    return `${scope} ${formatFoxIdentityLabel(previousFoxId)} исключена; в области нет лис.`;
  }
  return scope;
}
