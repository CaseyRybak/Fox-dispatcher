import { useEffect, useMemo, useRef, useState } from "react";

import { createObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import {
  createPolicyAnnouncement,
  createSummaryViewModel,
  DEFAULT_PREY_WEIGHT_PERCENT,
} from "@/observation-monitoring/application/create-summary-view-model";
import {
  applyReportFilters,
  createReportFilterOptions,
  DEFAULT_REPORT_FILTERS,
  type ReportFilters,
} from "@/observation-monitoring/application/report-scope";
import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  ApplicationShell,
  type Destination,
} from "@/observation-monitoring/ui/ApplicationShell";

const reportFilterOptions = createReportFilterOptions(starterObservations);
const initialSummary = createSummaryViewModel(
  starterObservations,
  DEFAULT_PREY_WEIGHT_PERCENT,
);
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

function readDestination(): Destination {
  const candidate = window.location.hash.slice(1) as Destination;
  return destinations.has(candidate) ? candidate : "summary";
}

export function App() {
  const [destination, setDestination] = useState<Destination>(readDestination);
  const [preyWeightPercent, setPreyWeightPercent] = useState(
    DEFAULT_PREY_WEIGHT_PERCENT,
  );
  const [reportFilters, setReportFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [selectedFoxId, setSelectedFoxId] = useState(
    initialSummary.leader?.foxId,
  );
  const [announcement, setAnnouncement] = useState("");
  const committedWeightRef = useRef(DEFAULT_PREY_WEIGHT_PERCENT);
  const committedLeaderRef = useRef(initialSummary.leader?.foxId);
  const scopedObservations = useMemo(
    () => applyReportFilters(starterObservations, reportFilters),
    [reportFilters],
  );
  const overview = useMemo(
    () => createObservationSetOverview(scopedObservations),
    [scopedObservations],
  );
  const summaryViewModel = useMemo(
    () =>
      createSummaryViewModel(scopedObservations, preyWeightPercent, {
        selectedFoxId,
        totalObservationCount: starterObservations.length,
      }),
    [preyWeightPercent, scopedObservations, selectedFoxId],
  );

  useEffect(() => {
    const handleHashChange = () => {
      setDestination(readDestination());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = "ru";
    document.title = destinationTitles[destination];
    document.querySelector<HTMLElement>("#main-content h1")?.focus();
  }, [destination]);

  function commitPreyWeight(nextPreyWeightPercent: number) {
    if (committedWeightRef.current === nextPreyWeightPercent) {
      return;
    }

    const committedViewModel = createSummaryViewModel(
      scopedObservations,
      nextPreyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: starterObservations.length,
      },
    );

    setAnnouncement(
      createPolicyAnnouncement(committedLeaderRef.current, committedViewModel),
    );
    committedWeightRef.current = nextPreyWeightPercent;
    committedLeaderRef.current = committedViewModel.leader?.foxId;
  }

  function changeReportFilters(nextFilters: ReportFilters) {
    const nextObservations = applyReportFilters(
      starterObservations,
      nextFilters,
    );
    const nextViewModel = createSummaryViewModel(
      nextObservations,
      preyWeightPercent,
      {
        selectedFoxId,
        totalObservationCount: starterObservations.length,
      },
    );
    const nextSelectedFoxId = nextViewModel.selectedFox?.foxId;

    setAnnouncement(
      createFilterAnnouncement(
        nextObservations.length,
        starterObservations.length,
        selectedFoxId,
        nextSelectedFoxId,
      ),
    );

    if (nextSelectedFoxId !== selectedFoxId) {
      setSelectedFoxId(nextSelectedFoxId);
    }

    committedLeaderRef.current = nextViewModel.leader?.foxId;
    setReportFilters(nextFilters);
  }

  function selectFox(foxId: string) {
    setSelectedFoxId(foxId);
    setAnnouncement(`Показаны доказательства ${foxId}.`);
  }

  return (
    <ApplicationShell
      announcement={announcement}
      destination={destination}
      filterOptions={reportFilterOptions}
      filters={reportFilters}
      onFiltersChange={changeReportFilters}
      onPreyWeightChange={setPreyWeightPercent}
      onPreyWeightCommit={commitPreyWeight}
      onSelectFox={selectFox}
      overview={overview}
      summary={summaryViewModel}
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

  if (previousFoxId === nextFoxId) {
    return scope;
  }

  if (nextFoxId) {
    return `${scope} Выбрана лиса ${nextFoxId}.`;
  }

  if (previousFoxId) {
    return `${scope} Выбранная лиса ${previousFoxId} исключена; в области нет наблюдений.`;
  }

  return scope;
}
