import { useEffect, useMemo, useRef, useState } from "react";

import { createObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import {
  createPolicyAnnouncement,
  createSummaryViewModel,
  DEFAULT_PREY_WEIGHT_PERCENT,
} from "@/observation-monitoring/application/create-summary-view-model";
import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import {
  ApplicationShell,
  type Destination,
} from "@/observation-monitoring/ui/ApplicationShell";

const initialOverview = createObservationSetOverview(starterObservations);
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
  const [announcement, setAnnouncement] = useState("");
  const committedWeightRef = useRef(DEFAULT_PREY_WEIGHT_PERCENT);
  const committedLeaderRef = useRef(
    createSummaryViewModel(starterObservations, DEFAULT_PREY_WEIGHT_PERCENT)
      .leader?.foxId,
  );
  const summaryViewModel = useMemo(
    () => createSummaryViewModel(starterObservations, preyWeightPercent),
    [preyWeightPercent],
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
      starterObservations,
      nextPreyWeightPercent,
    );

    setAnnouncement(
      createPolicyAnnouncement(committedLeaderRef.current, committedViewModel),
    );
    committedWeightRef.current = nextPreyWeightPercent;
    committedLeaderRef.current = committedViewModel.leader?.foxId;
  }

  return (
    <ApplicationShell
      announcement={announcement}
      destination={destination}
      onPreyWeightChange={setPreyWeightPercent}
      onPreyWeightCommit={commitPreyWeight}
      overview={initialOverview}
      summary={summaryViewModel}
    />
  );
}
