import { type MouseEvent, useRef } from "react";

import type { ObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import type { SummaryViewModel } from "@/observation-monitoring/application/create-summary-view-model";
import { WorklogPage } from "@/observation-monitoring/ui/ai-worklog/WorklogPage";
import { ObservationsPage } from "@/observation-monitoring/ui/observations/ObservationsPage";
import { SummaryPage } from "@/observation-monitoring/ui/summary/SummaryPage";

export type Destination = "observations" | "summary" | "worklog";

interface ApplicationShellProps {
  readonly announcement: string;
  readonly destination: Destination;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly overview: ObservationSetOverview;
  readonly summary: SummaryViewModel;
}

const destinations: readonly {
  readonly id: Destination;
  readonly label: string;
}[] = [
  { id: "summary", label: "Сводка" },
  { id: "observations", label: "Наблюдения" },
  { id: "worklog", label: "AI Worklog" },
];

export function ApplicationShell({
  announcement,
  destination,
  onPreyWeightChange,
  onPreyWeightCommit,
  overview,
  summary,
}: ApplicationShellProps) {
  const mainContentRef = useRef<HTMLElement>(null);

  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainContentRef.current?.focus();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={focusMainContent}>
        Перейти к содержанию
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <a
            className="brand"
            href="#summary"
            aria-label="Лисий диспетчер — сводка"
          >
            <span className="brand__mark" aria-hidden="true">
              ЛД
            </span>
            <span>
              <span className="brand__name">Лисий диспетчер</span>
              <span className="brand__caption">Полевой журнал наблюдений</span>
            </span>
          </a>

          <nav className="primary-nav" aria-label="Основная навигация">
            {destinations.map(({ id, label }) => (
              <a
                aria-current={destination === id ? "page" : undefined}
                className="primary-nav__link"
                href={`#${id}`}
                key={id}
              >
                {label}
              </a>
            ))}
          </nav>

          <p className="dataset-status">
            <span className="dataset-status__signal" aria-hidden="true" />
            Расчёт {summary.suspicionWeightPercent}/{summary.preyWeightPercent}
          </p>
        </div>
      </header>

      <main
        className="main-content"
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
      >
        {destination === "summary" && (
          <SummaryPage
            announcement={announcement}
            onPreyWeightChange={onPreyWeightChange}
            onPreyWeightCommit={onPreyWeightCommit}
            viewModel={summary}
          />
        )}
        {destination === "observations" && (
          <ObservationsPage overview={overview} />
        )}
        {destination === "worklog" && <WorklogPage />}
      </main>

      <footer className="site-footer">
        <p>Fox Dispatcher · explainable scoring</p>
        <p>Индекс рассчитывается локально из оценки и признака добычи.</p>
        <p>
          <a href="/third-party-notices.txt">Лицензии компонентов</a>
        </p>
      </footer>
    </div>
  );
}
