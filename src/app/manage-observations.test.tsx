import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("observation management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, "", "#observations");
  });

  it("keeps secondary data actions compact on a narrow screen", async () => {
    const user = userEvent.setup();
    const defaultMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...defaultMatchMedia(query),
      matches: query === "(max-width: 640px)",
    }));

    render(<App />);

    expect(
      screen.queryByRole("button", { name: "Импортировать JSON" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Экспортировать все наблюдения",
      }),
    ).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", {
      name: "Показать управление данными",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const controlledActions = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(controlledActions).toBeInTheDocument();
    expect(controlledActions).not.toBeVisible();
    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    ).toBeInTheDocument();
    expect(controlledActions).toBeVisible();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("edits an observation and recalculates the report from the accepted set", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const editor = screen.getByRole("dialog", {
      name: "Изменить наблюдение obs_005",
    });
    const suspicion = within(editor).getByRole("spinbutton", {
      name: "Оценка подозрительности",
    });
    await user.clear(suspicion);
    await user.type(suspicion, "10");
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    expect(
      screen.queryByRole("dialog", { name: /Изменить наблюдение/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Изменить obs_005" }),
    ).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Наблюдение obs_005 сохранено. Теперь лидирует Лиса 4, идентификатор fox_004, 8,0.",
    );

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    const summary = screen.getByRole("region", {
      name: "Самая подозрительная лиса",
    });
    expect(
      within(summary).getByRole("heading", { name: "Лиса 4" }),
    ).toBeInTheDocument();
    expect(within(summary).getByText("8,0 из 10")).toBeInTheDocument();
  });

  it("recalculates filtered scope, options, and the selected calculation from one edit", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    render(<App />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Всего наблюдений: 5",
    );
    expect(
      screen.getByRole("button", { name: "Изменить obs_002" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Изменить obs_004" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const editor = screen.getByRole("dialog", {
      name: "Изменить наблюдение obs_005",
    });
    const location = within(editor).getByRole("combobox", { name: "Локация" });
    await user.clear(location);
    await user.type(location, "Речной берег");
    fireEvent.change(within(editor).getByLabelText("Время"), {
      target: { value: "13:45" },
    });
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    expect(
      screen.queryByRole("region", { name: "Активная область наблюдений" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("obs_005", { selector: "td" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    expect(
      screen.getByRole("option", { name: "Речной берег" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Активность по локациям" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сбросить всё" }));
    expect(
      screen.queryByRole("region", { name: "Последние наблюдения" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /^Показать расчёт: Лиса 4, индекс 2,4/,
      }),
    );
    expect(
      screen.getByRole("complementary", {
        name: "Расчёт: Лиса 4, идентификатор fox_004",
      }),
    ).toHaveTextContent("Средняя подозрительность");
  });

  it("uses full-ledger fox profiles while Summary filters hide that fox", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    render(<App />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));
    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );

    const editor = screen.getByRole("dialog", { name: "Новое наблюдение" });
    await user.type(
      within(editor).getByRole("combobox", { name: "Имя лисы" }),
      "Лиса 3",
    );

    expect(within(editor).getByRole("combobox", { name: "Цвет" })).toHaveValue(
      "серебристая",
    );
    expect(
      within(editor).getByRole("combobox", { name: "Цвет" }),
    ).toHaveAttribute("readonly");
  });

  it("deletes the only fox_004 observation, exposes one-step undo, and restores it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Удалить obs_005" }));

    expect(screen.getByText("Наблюдение obs_005 удалено")).toBeInTheDocument();
    expect(
      screen.queryByText("obs_005", { selector: "td" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    expect(
      within(
        within(
          screen.getByRole("region", {
            name: "Самая подозрительная лиса",
          }),
        ).getByLabelText("Состав текущего отчёта"),
      ).getByText("3"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Параметры" }));
    await user.click(
      screen.getByRole("button", { name: "Отменить удаление obs_005" }),
    );
    expect(screen.getByText("obs_005", { selector: "td" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Изменить obs_005" }),
    ).toHaveFocus();
  });

  it("validates add fields, creates an immutable id, and restores data on remount", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editor = screen.getByRole("dialog", { name: "Новое наблюдение" });
    expect(
      within(editor).getByRole("combobox", { name: "Имя лисы" }),
    ).toHaveFocus();
    expect(within(editor).getByRole("radio", { name: "Да" })).not.toBeChecked();
    expect(
      within(editor).getByRole("radio", { name: "Нет" }),
    ).not.toBeChecked();

    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );
    expect(within(editor).getByRole("alert")).toHaveTextContent("Проверьте");
    expect(within(editor).getByRole("alert")).toHaveTextContent(
      "Выберите, была ли лиса с добычей.",
    );

    await user.type(
      within(editor).getByRole("combobox", { name: "Имя лисы" }),
      "Лиса 5",
    );
    await user.type(
      within(editor).getByRole("combobox", { name: "Локация" }),
      "Речной берег",
    );
    await user.type(
      within(editor).getByRole("combobox", { name: "Цвет" }),
      "белая",
    );
    await user.click(within(editor).getByRole("radio", { name: "Нет" }));
    await user.type(
      within(editor).getByRole("spinbutton", {
        name: "Оценка подозрительности",
      }),
      "6",
    );
    fireEvent.change(within(editor).getByLabelText("Время"), {
      target: { value: "13:45" },
    });
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    const generatedId = "obs_006";
    expect(
      screen.getByText(generatedId, { selector: "td" }),
    ).toBeInTheDocument();
    const generatedRow = screen
      .getByText(generatedId, { selector: "td" })
      .closest("tr");
    expect(generatedRow).not.toBeNull();
    expect(generatedRow).toHaveTextContent("Лиса 5");
    expect(generatedRow).toHaveTextContent("fox_005");

    const storedDashboard = JSON.parse(
      window.localStorage.getItem("fox-dispatcher.dashboard") ?? "null",
    ) as { observations: Record<string, unknown>[] };
    expect(storedDashboard.observations).toContainEqual(
      expect.objectContaining({
        fox_id: "fox_005",
        fox_name: "Лиса 5",
        id: generatedId,
      }),
    );

    firstRender.unmount();
    render(<App />);
    expect(
      screen.getByText(generatedId, { selector: "td" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Сохранено в этом браузере")).toBeInTheDocument();
  });

  it("locks an existing fox to its original color and shows a non-blocking warning", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editor = screen.getByRole("dialog", { name: "Новое наблюдение" });
    const foxName = within(editor).getByRole("combobox", {
      name: "Имя лисы",
    });
    const color = within(editor).getByRole("combobox", { name: "Цвет" });

    await user.type(color, "серебристая");
    await user.type(foxName, "Лиса 1");

    const warning = within(editor).getByRole("status");
    expect(warning).toHaveTextContent("Для данной лисы уже задан цвет рыжая");
    expect(color).toHaveValue("рыжая");
    expect(color).toHaveAttribute("readonly");
    expect(color.getAttribute("aria-describedby")).toContain(warning.id);
    expect(within(editor).queryByRole("alert")).not.toBeInTheDocument();

    await user.type(
      within(editor).getByRole("combobox", { name: "Локация" }),
      "Моховой овраг",
    );
    await user.click(within(editor).getByRole("radio", { name: "Нет" }));
    await user.type(
      within(editor).getByRole("spinbutton", {
        name: "Оценка подозрительности",
      }),
      "5",
    );
    fireEvent.change(within(editor).getByLabelText("Время"), {
      target: { value: "11:11" },
    });
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    const addedRow = screen
      .getByText("obs_006", { selector: "td" })
      .closest("tr");
    expect(addedRow).toHaveTextContent("Лиса 1");
    expect(addedRow).toHaveTextContent("рыжая");
  });

  it("keeps field-error links inside the observations route", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editor = screen.getByRole("dialog", { name: "Новое наблюдение" });
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );
    await user.click(
      within(editor).getByRole("link", {
        name: "Укажите имя лисы (до 64 символов).",
      }),
    );

    expect(window.location.hash).toBe("#observations");
    expect(
      within(editor).getByRole("combobox", { name: "Имя лисы" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("dialog", { name: "Новое наблюдение" }),
    ).toBeInTheDocument();
  });

  it("does not switch the target while an editor is open", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const editor = screen.getByRole("dialog", {
      name: "Изменить наблюдение obs_005",
    });
    const suspicion = within(editor).getByRole("spinbutton", {
      name: "Оценка подозрительности",
    });
    await user.clear(suspicion);
    await user.type(suspicion, "10");

    expect(
      screen.getByRole("button", { name: "Изменить obs_004" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    ).toBeDisabled();
    expect(editor).toBeInTheDocument();
    expect(suspicion).toHaveValue(10);
  });

  it("restores focus when discard and reset confirmations close", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const foxField = screen.getByRole("combobox", { name: "Имя лисы" });
    await user.type(foxField, "-draft");
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    const continueEditing = screen.getByRole("button", {
      name: "Продолжить редактирование",
    });
    expect(continueEditing).toHaveFocus();
    await user.click(continueEditing);
    expect(foxField).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Отменить" }));
    await user.click(
      screen.getByRole("button", { name: "Отменить изменения" }),
    );
    const reset = screen.getByRole("button", {
      name: "Вернуть стартовые данные",
    });
    await user.click(reset);
    await user.click(
      screen.getByRole("button", { name: "Оставить текущие данные" }),
    );
    expect(reset).toHaveFocus();
  });

  it("keeps an accessible editor name for a stored id with spaces and punctuation", async () => {
    const user = userEvent.setup();
    const observationId = 'obs special_"]';
    storeObservations([createStoredObservation(observationId)]);
    render(<App />);

    const edit = screen.getByRole("button", {
      name: `Изменить ${observationId}`,
    });
    await user.click(edit);
    expect(
      screen.getByRole("dialog", {
        name: `Изменить наблюдение ${observationId}`,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Отменить" }));

    expect(edit).toHaveFocus();
  });

  it("does not confuse a schema-valid __add__ id with the add-button focus target", async () => {
    const user = userEvent.setup();
    storeObservations([createStoredObservation("__add__")]);
    render(<App />);

    const edit = screen.getByRole("button", { name: "Изменить __add__" });
    await user.click(edit);
    await user.click(screen.getByRole("button", { name: "Отменить" }));

    expect(edit).toHaveFocus();
  });

  it("sorts the ledger view without changing report state", async () => {
    const user = userEvent.setup();
    render(<App />);
    const table = screen.getByRole("table");
    const timeHeader = within(table).getByRole("columnheader", {
      name: /Время/,
    });

    expect(timeHeader).toHaveAttribute("aria-sort", "descending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("obs_005");

    await user.click(within(table).getByRole("button", { name: "Лиса" }));
    expect(
      within(table).getByRole("columnheader", { name: /Лиса/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("obs_001");
    expect(within(table).getAllByRole("row")[2]).toHaveTextContent("obs_003");

    await user.click(within(table).getByRole("button", { name: "Лиса" }));
    expect(
      within(table).getByRole("columnheader", { name: /Лиса/ }),
    ).toHaveAttribute("aria-sort", "descending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Лиса 4");

    await user.click(within(table).getByRole("button", { name: "Запись" }));
    expect(
      within(table).getByRole("columnheader", { name: /Запись/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("obs_001");
  });

  it("shows invalid-storage status on the initial summary", () => {
    window.history.replaceState(null, "", "#summary");
    window.localStorage.setItem("fox-dispatcher.dashboard", "not json");

    render(<App />);

    expect(
      screen.getByText(
        "Сохранённые данные повреждены - автосохранение приостановлено",
      ),
    ).toBeVisible();
  });

  it("resets starter observations while preserving and reloading the policy", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    const firstRender = render(<App />);
    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.pointerUp(slider);

    await user.click(screen.getByRole("link", { name: "Параметры" }));
    await user.click(screen.getByRole("button", { name: "Удалить obs_005" }));
    await user.click(
      screen.getByRole("button", { name: "Вернуть стартовые данные" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Вернуть 5 стартовых наблюдений" }),
    );

    expect(screen.getByText("obs_005", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByRole("table").querySelector("caption")).toHaveFocus();
    await user.click(screen.getByRole("link", { name: "Сводка" }));
    expect(screen.getByRole("slider", { name: "Влияние добычи" })).toHaveValue(
      "30",
    );

    firstRender.unmount();
    render(<App />);
    expect(screen.getByRole("slider", { name: "Влияние добычи" })).toHaveValue(
      "30",
    );
  });

  it("keeps an accepted edit in memory and announces a save failure", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const suspicion = screen.getByRole("spinbutton", {
      name: "Оценка подозрительности",
    });
    await user.clear(suspicion);
    await user.type(suspicion, "10");
    await user.click(
      screen.getByRole("button", { name: "Сохранить наблюдение" }),
    );

    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Не удалось сохранить - изменения останутся до закрытия страницы",
      ),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Не удалось сохранить: изменения остаются только в памяти.",
    );
  });

  it("includes a scoring-policy save failure in the committed live message", () => {
    window.history.replaceState(null, "", "#summary");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.pointerUp(slider);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Не удалось сохранить: изменения остаются только в памяти.",
    );
  });

  it("returns focus after starter reset without exposing a retained Summary filter", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    storeObservations([
      {
        ...createStoredObservation("obs_custom"),
        color: "фиолетовая",
      },
    ]);
    render(<App />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Цвет" }),
      "фиолетовая",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));
    await user.click(
      screen.getByRole("button", { name: "Вернуть стартовые данные" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Вернуть 5 стартовых наблюдений" }),
    );

    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Всего наблюдений: 5",
    );
    expect(
      screen.queryByRole("region", { name: "Активная область наблюдений" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Всего наблюдений: 5", { selector: "caption" }),
    ).toHaveFocus();
  });

  it("keeps retained Summary filters invisible in Parameters", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#summary");
    render(<App />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));

    expect(
      screen.queryByRole("region", { name: "Активная область наблюдений" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Всего наблюдений: 5",
    );

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    expect(screen.getByRole("combobox", { name: "Локация" })).toHaveValue(
      "Северная поляна",
    );
    expect(screen.getByText("Показано лис: 2 из 4")).toBeInTheDocument();
  });

  it("dismisses the persistent undo message without restoring the record", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Удалить obs_005" }));
    await user.click(screen.getByRole("button", { name: "Закрыть сообщение" }));

    expect(
      screen.queryByRole("button", { name: "Отменить удаление obs_005" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("obs_005", { selector: "td" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("table").querySelector("caption")).toHaveFocus();
  });

  it.each([
    ["Отменить удаление obs_only", true],
    ["Закрыть сообщение", false],
  ])(
    "keeps focus in an open editor after the zero-row undo action %s",
    async (actionName, restoresObservation) => {
      const user = userEvent.setup();
      storeObservations([createStoredObservation("obs_only")]);
      render(<App />);

      await user.click(
        screen.getByRole("button", { name: "Удалить obs_only" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Добавить наблюдение" }),
      );
      const foxField = screen.getByRole("combobox", { name: "Имя лисы" });
      await user.click(screen.getByRole("button", { name: actionName }));

      expect(foxField).toHaveFocus();
      expect(
        screen.queryByRole("button", { name: "Отменить удаление obs_only" }),
      ).not.toBeInTheDocument();
      const restoredRow = screen.queryByText("obs_only", { selector: "td" });
      if (restoresObservation) {
        expect(restoredRow).toBeInTheDocument();
      } else {
        expect(restoredRow).not.toBeInTheDocument();
      }
    },
  );
});

function createStoredObservation(id: string) {
  return {
    color: "рыжая",
    fox_id: "fox_special",
    has_prey: false,
    id,
    location: "Поляна",
    suspicion_level: 4,
    time: "08:00",
  };
}

function storeObservations(
  observations: readonly ReturnType<typeof createStoredObservation>[],
) {
  window.localStorage.setItem(
    "fox-dispatcher.dashboard",
    JSON.stringify({
      observations,
      schemaVersion: 1,
      scoringPolicy: { preyWeightPercent: 20 },
      updatedAt: "2026-07-16T10:20:30.000Z",
    }),
  );
}
