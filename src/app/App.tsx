import { useEffect, useMemo, useRef, useState } from "react";

import { createObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import {
  createPolicyAnnouncement,
  createSummaryViewModel,
  DEFAULT_PREY_WEIGHT_PERCENT,
} from "@/observation-monitoring/application/create-summary-view-model";
import type { PersistedDashboardState } from "@/observation-monitoring/application/dashboard-state-store";
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
import { createBrowserDashboardStateStore } from "@/observation-monitoring/adapters/browser-dashboard-state/browser-dashboard-state";
import { browserObservationIdGenerator } from "@/observation-monitoring/adapters/observation-id/browser-observation-id-generator";
import { publicWorklog } from "@/observation-monitoring/adapters/public-worklog/public-worklog";
import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  ApplicationShell,
  type Destination,
} from "@/observation-monitoring/ui/ApplicationShell";

const dashboardStateStore = createBrowserDashboardStateStore();
const destinations = new Set<Destination>([
  "summary",
  "observations",
  "worklog",
]);
const destinationTitles: Readonly<Record<Destination, string>> = {
  summary: "Сводка — Лисий диспетчер",
  observations: "Наблюдения — Лисий диспетчер",
  worklog: "AI Worklog — Лисий диспетчер",
};

interface BootstrapState {
  readonly dashboard: PersistedDashboardState;
  readonly persistenceBlocked: boolean;
  readonly persistenceMessage: string;
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
        "Хранилище недоступно — изменения останутся до закрытия страницы",
    };
  }
  return {
    dashboard,
    persistenceBlocked: true,
    persistenceMessage:
      "Сохранённые данные не прочитаны — работа продолжается в памяти",
  };
}

export function App() {
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
  const [persistenceMessage, setPersistenceMessage] = useState(
    bootstrap.persistenceMessage,
  );
  const [announcement, setAnnouncement] = useState({
    message: "",
    revision: 0,
  });
  const persistenceBlockedRef = useRef(bootstrap.persistenceBlocked);
  const committedWeightRef = useRef(
    bootstrap.dashboard.scoringPolicy.preyWeightPercent,
  );
  const committedLeaderRef = useRef(initialSummary.leader?.foxId);

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
    document.querySelector<HTMLElement>("#main-content h1")?.focus();
  }, [destination]);

  function changePreyWeight(nextPreyWeightPercent: number) {
    const nextDashboard = {
      ...dashboard,
      scoringPolicy: { preyWeightPercent: nextPreyWeightPercent },
    };
    setDashboard(nextDashboard);
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
      },
    );
    announce(
      createPolicyAnnouncement(committedLeaderRef.current, committedViewModel),
    );
    committedWeightRef.current = nextPreyWeightPercent;
    committedLeaderRef.current = committedViewModel.leader?.foxId;
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
      },
    );
    const nextSelectedFoxId = nextViewModel.selectedFox?.foxId;

    announce(
      createFilterAnnouncement(
        nextObservations.length,
        dashboard.observations.length,
        selectedFoxId,
        nextSelectedFoxId,
      ),
    );
    if (nextSelectedFoxId !== selectedFoxId)
      setSelectedFoxId(nextSelectedFoxId);
    committedLeaderRef.current = nextViewModel.leader?.foxId;
    setReportFilters(nextFilters);
  }

  function addDraft(draft: ObservationDraft) {
    const result = addObservation(
      dashboard.observations,
      draft,
      browserObservationIdGenerator,
    );
    if (result.ok) {
      acceptObservationSet(
        result.observations,
        `Наблюдение ${result.observationId} добавлено. Отчёт пересчитан.`,
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
        `Наблюдение ${observationId} обновлено. Отчёт пересчитан.`,
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
      `Удаление ${observationId} отменено. Отчёт пересчитан.`,
      false,
    );
  }

  function resetStarter() {
    const clearResult = dashboardStateStore.clear();
    persistenceBlockedRef.current = clearResult.status !== "cleared";
    setPersistenceMessage(
      clearResult.status === "cleared"
        ? "Стартовые данные будут сохранены в этом браузере"
        : "Хранилище недоступно — изменения останутся до закрытия страницы",
    );
    acceptObservationSet(
      resetObservations(dashboard.observations, starterObservations),
      "Восстановлены 5 стартовых наблюдений. Отчёт пересчитан.",
    );
  }

  function acceptObservationSet(
    observations: PersistedDashboardState["observations"],
    message: string,
    clearUndo = true,
  ) {
    const nextScopedObservations = applyReportFilters(
      observations,
      reportFilters,
    );
    const nextViewModel = createSummaryViewModel(
      nextScopedObservations,
      dashboard.scoringPolicy.preyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: observations.length,
      },
    );

    const nextDashboard = { ...dashboard, observations };
    setDashboard(nextDashboard);
    persistDashboard(nextDashboard);
    setSelectedFoxId(nextViewModel.selectedFox?.foxId);
    committedLeaderRef.current = nextViewModel.leader?.foxId;
    if (clearUndo) setLastDeletion(undefined);
    announce(message);
  }

  function persistDashboard(state: PersistedDashboardState) {
    if (persistenceBlockedRef.current) return;

    const result = dashboardStateStore.save(state);
    if (result.status === "saved") {
      setPersistenceMessage("Сохранено в этом браузере");
      return;
    }

    persistenceBlockedRef.current = true;
    setPersistenceMessage(
      "Не удалось сохранить — изменения останутся до закрытия страницы",
    );
  }

  function selectFox(foxId: string) {
    setSelectedFoxId(foxId);
    announce(`Показаны доказательства ${foxId}.`);
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
      onEditObservation={editDraft}
      onFiltersChange={changeReportFilters}
      onPreyWeightChange={changePreyWeight}
      onPreyWeightCommit={commitPreyWeight}
      onResetStarter={resetStarter}
      onSelectFox={selectFox}
      onUndoDelete={undoDelete}
      overview={overview}
      persistenceMessage={persistenceMessage}
      summary={summaryViewModel}
      worklog={publicWorklog}
    />
  );
}

function createFilterAnnouncement(
  filteredObservationCount: number,
  totalObservationCount: number,
  previousFoxId: string | undefined,
  nextFoxId: string | undefined,
): string {
  const scope = `Фильтры применены: ${filteredObservationCount} из ${totalObservationCount} наблюдений.`;
  if (previousFoxId === nextFoxId) return scope;
  if (nextFoxId) return `${scope} Выбрана лиса ${nextFoxId}.`;
  if (previousFoxId) {
    return `${scope} Выбранная лиса ${previousFoxId} исключена; в области нет наблюдений.`;
  }
  return scope;
}
