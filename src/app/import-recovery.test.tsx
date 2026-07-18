import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ObservationExporter,
  ObservationImportFileResult,
} from "@/observation-monitoring/application/observation-transfer";
import { starterObservations } from "@/observation-monitoring/adapters/starter-data/starter-observations";
import { ObservationImportDialog } from "@/observation-monitoring/ui/observations/ObservationImportDialog";

import { App } from "./App";

describe("observation import and export", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, "", "#observations");
  });

  it("keeps invalid JSON atomic, reports field paths, and preserves the draft on reopen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Импорт наблюдений" });
    const source = within(dialog).getByRole("textbox", {
      name: "JSON наблюдений",
    });
    const invalid = JSON.stringify([
      ...starterObservations.slice(0, 2),
      { ...starterObservations[2], suspicion_level: 11 },
    ]);
    fireEvent.change(source, { target: { value: invalid } });
    await user.click(
      within(dialog).getByRole("button", { name: "Проверить данные" }),
    );

    const alert = within(dialog).getByRole("alert");
    expect(alert).toHaveFocus();
    expect(alert).toHaveTextContent(
      "[2].suspicion_level - ожидается целое число от 0 до 10",
    );
    expect(
      within(dialog).queryByRole("button", { name: /Заменить/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("obs_005", { selector: "td" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Закрыть" }));
    expect(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    ).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    );
    expect(
      within(
        screen.getByRole("dialog", { name: "Импорт наблюдений" }),
      ).getByRole("textbox", { name: "JSON наблюдений" }),
    ).toHaveValue(invalid);
  });

  it("previews and explicitly replaces observations while preserving policy and clearing filters", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.pointerUp(slider);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));

    await user.click(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Импорт наблюдений" });
    const imported = [starterObservations[1], starterObservations[3]];
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "JSON наблюдений" }),
      { target: { value: JSON.stringify(imported) } },
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Проверить данные" }),
    );

    const preview = within(dialog).getByRole("region", {
      name: "Предпросмотр импорта",
    });
    expect(preview).toHaveTextContent("2 наблюдения");
    expect(preview).toHaveTextContent("2 лисы");
    expect(preview).toHaveTextContent("2 локации");
    expect(preview).toHaveTextContent("09:05-11:15");

    await user.click(
      within(dialog).getByRole("button", { name: "Заменить на 2 наблюдения" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Импорт наблюдений" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Всего наблюдений: 2", { selector: "caption" }),
    ).toHaveFocus();
    expect(
      screen.queryByText("obs_001", { selector: "td" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("obs_002", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Импорт применён: 2 наблюдения. Теперь лидирует Лиса 3, идентификатор fox_003, 7,9.",
    );

    const stored = JSON.parse(
      window.localStorage.getItem("fox-dispatcher.dashboard") ?? "null",
    );
    expect(stored.observations).toEqual(imported);
    expect(stored.scoringPolicy).toEqual({ preyWeightPercent: 30 });
  });

  it("exports the full authoritative array regardless of active filters", async () => {
    const user = userEvent.setup();
    const exporter: ObservationExporter = {
      export: vi.fn(() => ({
        fileName: "fox-dispatcher-observations.json",
        status: "exported" as const,
      })),
    };
    window.history.replaceState(null, "", "#summary");
    render(<App observationExporter={exporter} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));
    expect(
      screen.queryByRole("region", { name: "Активная область наблюдений" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Экспортировать все наблюдения" }),
    );

    expect(exporter.export).toHaveBeenCalledWith(starterObservations);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Экспорт подготовлен: 5 наблюдений.",
    );
  });

  it("keeps a manual draft authoritative when an earlier file read finishes", async () => {
    const user = userEvent.setup();
    let resolveRead!: (result: ObservationImportFileResult) => void;
    const onReadFile = vi.fn(
      () =>
        new Promise<ObservationImportFileResult>((resolve) => {
          resolveRead = resolve;
        }),
    );

    render(
      <ObservationImportDialog
        onClose={vi.fn()}
        onReadFile={onReadFile}
        onReplace={vi.fn()}
        onValidate={vi.fn(() => ({
          issues: [],
          ok: false as const,
          reason: "empty" as const,
          sourceBytes: 0,
          summary: "Добавьте JSON для проверки",
        }))}
        open
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Импорт наблюдений" });
    const source = within(dialog).getByRole("textbox", {
      name: "JSON наблюдений",
    });
    const validate = within(dialog).getByRole("button", {
      name: "Проверить данные",
    });
    const file = new File(["[]"], "observations.json", {
      type: "application/json",
    });

    await user.upload(within(dialog).getByLabelText("Выбрать JSON-файл"), file);
    expect(validate).toBeDisabled();

    fireEvent.change(source, { target: { value: "manual draft" } });
    await act(async () => {
      resolveRead({
        fileName: file.name,
        ok: true,
        sourceBytes: 2,
        text: "[]",
      });
      await Promise.resolve();
    });

    expect(source).toHaveValue("manual draft");
    expect(validate).toBeEnabled();
  });

  it("keeps source provenance atomic after a failed file read", async () => {
    const user = userEvent.setup();
    const observation = starterObservations[0];
    if (!observation) throw new Error("Expected a starter observation");
    const draft = JSON.stringify([observation]);
    const onValidate = vi.fn(() => ({
      observations: [observation],
      ok: true as const,
      preview: {
        foxCount: 1,
        locationCount: 1,
        locations: [observation.location],
        observationCount: 1,
        timeRange: {
          end: observation.time,
          start: observation.time,
        },
      },
      sourceBytes: new TextEncoder().encode(draft).length,
    }));

    render(
      <ObservationImportDialog
        onClose={vi.fn()}
        onReadFile={vi.fn(async () => ({
          fileName: "broken.json",
          ok: false as const,
          reason: "invalid-utf8" as const,
          summary: "Файл не является корректным UTF-8 JSON",
        }))}
        onReplace={vi.fn()}
        onValidate={onValidate}
        open
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Импорт наблюдений" });
    const source = within(dialog).getByRole("textbox", {
      name: "JSON наблюдений",
    });
    const validate = within(dialog).getByRole("button", {
      name: "Проверить данные",
    });
    fireEvent.change(source, { target: { value: draft } });
    await user.click(validate);
    expect(
      within(dialog).getByRole("button", { name: "Заменить на 1 наблюдение" }),
    ).toBeInTheDocument();

    await user.upload(
      within(dialog).getByLabelText("Выбрать JSON-файл"),
      new File([new Uint8Array([0xc3, 0x28])], "broken.json", {
        type: "application/json",
      }),
    );

    expect(source).toHaveValue(draft);
    expect(
      within(dialog).getByText(
        "Не прочитан: broken.json. Сохранённый черновик не изменён.",
      ),
    ).toBeInTheDocument();
    expect(validate).toBeDisabled();
    expect(
      within(dialog).queryByRole("button", { name: /Заменить/ }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Выбрать JSON-файл")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      within(dialog).getByLabelText("Выбрать JSON-файл"),
    ).toHaveAccessibleDescription(/Файл не является корректным UTF-8 JSON/);

    fireEvent.change(source, { target: { value: `${draft} ` } });
    expect(validate).toBeEnabled();
    expect(
      within(dialog).queryByText(/Не прочитан: broken\.json/),
    ).not.toBeInTheDocument();
  });

  it("connects JSON validation errors to the source control", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Импорт наблюдений" });
    const source = within(dialog).getByRole("textbox", {
      name: "JSON наблюдений",
    });
    fireEvent.change(source, { target: { value: "not json" } });
    await user.click(
      within(dialog).getByRole("button", { name: "Проверить данные" }),
    );

    expect(source).toHaveAttribute("aria-invalid", "true");
    expect(source).toHaveAccessibleDescription(/JSON не удалось прочитать/);
  });
});

describe("advanced storage recovery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, "", "#observations");
  });

  it("keeps corrupt raw storage selectable until confirmed starter recovery", async () => {
    const user = userEvent.setup();
    const rawValue = "{future or corrupt private local value";
    window.localStorage.setItem("fox-dispatcher.dashboard", rawValue);
    render(<App />);

    expect(
      screen.getByText(
        "Сохранённые данные повреждены - автосохранение приостановлено",
      ),
    ).toBeInTheDocument();
    const recovery = screen.getByRole("region", {
      name: "Восстановление сохранённых данных",
    });
    expect(
      screen.queryByRole("button", { name: "Вернуть стартовые данные" }),
    ).not.toBeInTheDocument();
    const dataManagement = screen.getByRole("region", {
      name: "Состояние данных",
    });
    expect(
      recovery.compareDocumentPosition(dataManagement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const raw = within(recovery).getByRole("textbox", {
      name: "Сохранённое значение",
    });
    expect(raw).toHaveValue(rawValue);
    expect(window.localStorage.getItem("fox-dispatcher.dashboard")).toBe(
      rawValue,
    );

    await user.click(
      within(recovery).getByRole("button", {
        name: "Выделить сохранённый JSON для копирования",
      }),
    );
    expect(raw).toHaveFocus();
    expect(raw).toHaveProperty("selectionStart", 0);
    expect(raw).toHaveProperty("selectionEnd", rawValue.length);

    await user.click(
      within(recovery).getByRole("button", {
        name: "Удалить сохранение и начать со стартовых данных",
      }),
    );
    const confirmation = screen.getByRole("alertdialog", {
      name: "Удалить повреждённое сохранение?",
    });
    await user.click(
      within(confirmation).getByRole("button", {
        name: "Удалить сохранение и восстановить 5 наблюдений",
      }),
    );

    expect(
      screen.queryByRole("region", {
        name: "Восстановление сохранённых данных",
      }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem("fox-dispatcher.dashboard")).not.toBe(
      rawValue,
    );
    expect(screen.getByText("Сохранено в этом браузере")).toBeInTheDocument();
  });

  it("names a future storage version and restores focus without calling it corrupt", async () => {
    const user = userEvent.setup();
    const rawValue = JSON.stringify({ schemaVersion: 42, observations: [] });
    window.localStorage.setItem("fox-dispatcher.dashboard", rawValue);
    render(<App />);

    expect(
      screen.getByText(
        "Сохранение версии 42 не открыто - автосохранение приостановлено",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Сохранённое значение" }),
    ).toHaveValue(rawValue);

    const recovery = screen.getByRole("region", {
      name: "Восстановление сохранённых данных",
    });
    const trigger = within(recovery).getByRole("button", {
      name: "Удалить сохранение и начать со стартовых данных",
    });
    await user.click(trigger);
    const confirmation = screen.getByRole("alertdialog", {
      name: "Удалить сохранение версии 42?",
    });
    await user.click(
      within(confirmation).getByRole("button", {
        name: "Не удалять сохранение",
      }),
    );

    expect(trigger).toHaveFocus();
    expect(window.localStorage.getItem("fox-dispatcher.dashboard")).toBe(
      rawValue,
    );
  });
});
