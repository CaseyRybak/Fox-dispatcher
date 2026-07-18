import { type MouseEvent, useRef } from "react";

import type { ObservationSetOverview } from "@/observation-monitoring/application/create-observation-set-overview";
import type { SummaryViewModel } from "@/observation-monitoring/application/create-summary-view-model";
import type { PublicWorklogCheckpoint } from "@/observation-monitoring/application/public-worklog";
import type { DashboardStateRecovery } from "@/observation-monitoring/application/dashboard-state-store";
import type {
  ObservationImportFile,
  ObservationImportFileResult,
  ObservationImportResult,
} from "@/observation-monitoring/application/observation-transfer";
import type {
  ObservationDeletionUndo,
  ObservationDraft,
  ObservationMutationResult,
} from "@/observation-monitoring/application/observation-management";
import type {
  ReportFilterOptions,
  ReportFilters,
} from "@/observation-monitoring/application/report-scope";
import { WorklogPage } from "@/observation-monitoring/ui/ai-worklog/WorklogPage";
import { ObservationsPage } from "@/observation-monitoring/ui/observations/ObservationsPage";
import { SummaryPage } from "@/observation-monitoring/ui/summary/SummaryPage";

export type Destination = "observations" | "summary" | "worklog";

interface ApplicationShellProps {
  readonly announcement: string;
  readonly announcementRevision: number;
  readonly destination: Destination;
  readonly filterOptions: ReportFilterOptions;
  readonly filters: ReportFilters;
  readonly onFiltersChange: (filters: ReportFilters) => void;
  readonly onAddObservation: (
    draft: ObservationDraft,
  ) => ObservationMutationResult;
  readonly onDeleteObservation: (observationId: string) => void;
  readonly onDismissUndo: () => void;
  readonly onEditObservation: (
    observationId: string,
    draft: ObservationDraft,
  ) => ObservationMutationResult;
  readonly onExportObservations: () => void;
  readonly onPreyWeightChange: (preyWeightPercent: number) => void;
  readonly onPreyWeightCommit: (preyWeightPercent: number) => void;
  readonly onSelectFox: (foxId: string) => void;
  readonly onResetStarter: () => void;
  readonly onReadImportFile: (
    file: ObservationImportFile,
  ) => Promise<ObservationImportFileResult>;
  readonly onReplaceImportedObservations: (
    observations: Extract<
      ObservationImportResult,
      { ok: true }
    >["observations"],
  ) => void;
  readonly onSelectRecoveryRaw: () => void;
  readonly onValidateImport: (
    text: string,
    measuredBytes?: number,
  ) => ObservationImportResult;
  readonly onUndoDelete: () => void;
  readonly overview: ObservationSetOverview;
  readonly lastDeletion?: ObservationDeletionUndo;
  readonly persistenceBlocked: boolean;
  readonly persistenceMessage: string;
  readonly recovery?: DashboardStateRecovery;
  readonly summary: SummaryViewModel;
  readonly worklog: readonly PublicWorklogCheckpoint[];
}

const destinations: readonly {
  readonly id: Destination;
  readonly label: string;
}[] = [
  { id: "summary", label: "Сводка" },
  { id: "observations", label: "Параметры" },
  { id: "worklog", label: "AI Worklog" },
];

export function ApplicationShell({
  announcement,
  announcementRevision,
  destination,
  filterOptions,
  filters,
  lastDeletion,
  onAddObservation,
  onDeleteObservation,
  onDismissUndo,
  onEditObservation,
  onExportObservations,
  onFiltersChange,
  onPreyWeightChange,
  onPreyWeightCommit,
  onSelectFox,
  onResetStarter,
  onReadImportFile,
  onReplaceImportedObservations,
  onSelectRecoveryRaw,
  onUndoDelete,
  overview,
  persistenceBlocked,
  persistenceMessage,
  recovery,
  summary,
  worklog,
  onValidateImport,
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
            aria-label="Лисий диспетчер - сводка"
          >
            <img
              alt=""
              aria-hidden="true"
              className="brand__mark"
              height="42"
              src="/favicon.svg"
              width="42"
            />
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
        </div>
      </header>

      <main
        className="main-content"
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
      >
        {destination !== "observations" && persistenceBlocked && (
          <section
            aria-label="Состояние данных"
            className="global-persistence-warning"
          >
            <span className="report-update__signal" aria-hidden="true" />
            <p>{persistenceMessage}</p>
          </section>
        )}
        {destination === "summary" && announcement && (
          <section
            aria-label="Последнее изменение на Сводке"
            className="global-report-update"
          >
            <span className="report-update__signal" aria-hidden="true" />
            <p>{announcement}</p>
          </section>
        )}
        {destination === "summary" && (
          <SummaryPage
            filterOptions={filterOptions}
            filters={filters}
            onFiltersChange={onFiltersChange}
            onPreyWeightChange={onPreyWeightChange}
            onPreyWeightCommit={onPreyWeightCommit}
            onSelectFox={onSelectFox}
            viewModel={summary}
          />
        )}
        {destination === "observations" && (
          <ObservationsPage
            lastDeletion={lastDeletion}
            onAdd={onAddObservation}
            onDelete={onDeleteObservation}
            onDismissUndo={onDismissUndo}
            onEdit={onEditObservation}
            onExport={onExportObservations}
            onReadImportFile={onReadImportFile}
            onResetStarter={onResetStarter}
            onReplaceImportedObservations={onReplaceImportedObservations}
            onSelectRecoveryRaw={onSelectRecoveryRaw}
            onUndoDelete={onUndoDelete}
            overview={overview}
            persistenceMessage={persistenceMessage}
            recovery={recovery}
            onValidateImport={onValidateImport}
          />
        )}
        {destination === "worklog" && <WorklogPage checkpoints={worklog} />}
      </main>

      <p
        aria-atomic="true"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        {announcement ? (
          <span key={announcementRevision}>{announcement}</span>
        ) : null}
      </p>

      <footer className="site-footer">
        <p className="site-footer__brand">
          <img
            alt=""
            aria-hidden="true"
            height="18"
            src="/favicon.svg"
            width="18"
          />
          <span lang="en">Fox Dispatcher · explainable scoring</span>
        </p>
        <p>© 2026 Лисий диспетчер - полевой журнал наблюдений</p>
      </footer>
    </div>
  );
}
