import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("interactive suspicion summary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "#summary");
  });

  it("shows a concise leader summary and a plain-language exact calculation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const leader = getLeaderHeading("Лиса 1");
    expect(leader).toBeInTheDocument();
    const reportScope = screen.getByRole("region", { name: "Область отчёта" });
    expect(
      screen.queryByText("Все показатели используют одну область."),
    ).not.toBeInTheDocument();
    const reportScopePosition =
      leader.closest("section")?.compareDocumentPosition(reportScope) ?? 0;
    expect(reportScopePosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("fox_001").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Самая подозрительная лиса",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Сводка наблюдений")).not.toBeInTheDocument();
    expect(screen.getByText("Индекс 7,8 из 10")).toBeInTheDocument();
    const leaderReason = screen.getByRole("region", {
      name: "Почему Лиса 1",
    });
    expect(
      within(leaderReason).getByText(
        "Средняя подозрительность по всем наблюдениям",
      ),
    ).toBeInTheDocument();
    expect(leaderReason).toHaveTextContent("Средняя 8,5 · 2 наблюдения");
    expect(leaderReason).toHaveTextContent("Индекс 6,8");
    expect(
      within(leaderReason).getByText("Наличие добычи"),
    ).toBeInTheDocument();
    expect(leaderReason).toHaveTextContent("В 1 из 2 наблюдений");
    expect(leaderReason).toHaveTextContent("Индекс 1");
    expect(screen.getByText("Уникальные лисы")).toBeInTheDocument();
    expect(
      screen.getByText("Основная локация").closest("div"),
    ).toHaveTextContent("Основная локацияСеверная поляна3 из 5 наблюдений");

    const explanation = screen.getByRole("region", {
      name: "Расчет индекса подозрительности",
    });
    expect(screen.queryByText("Расчёт простым языком")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Как получился индекс 7,8" }),
    ).not.toBeInTheDocument();
    expect(explanation).toHaveTextContent(
      "Индекс складывается из двух частей: средней подозрительности по всем наблюдениям и наличия добычи.",
    );
    expect(explanation).toHaveTextContent(
      "При стартовых настройках средняя подозрительность лисы имеет 80% веса в итоговом индексе, а наличие добычи — 20%. Вес параметров можно изменить ниже. Параметры наблюдений и количество лис можно изменить в разделе «Параметры».",
    );
    expect(
      within(explanation).getByRole("heading", {
        level: 3,
        name: "Детальный расчет индекса самой подозрительной лисы",
      }),
    ).toBeInTheDocument();
    expect(within(explanation).queryByText("01")).not.toBeInTheDocument();
    expect(within(explanation).queryByText("02")).not.toBeInTheDocument();
    expect(within(explanation).queryByText("03")).not.toBeInTheDocument();
    expect(explanation).toHaveTextContent(
      "Для Лисы 1 объединены 2 наблюдения. Средняя подозрительность — 8,5.",
    );
    expect(explanation).toHaveTextContent("8,5 × 80% = 6,8");
    expect(explanation).toHaveTextContent(
      "Добыча отмечена в 1 из 2 наблюдений.",
    );
    expect(explanation).toHaveTextContent("1/2 × 10 × 20% = 1");
    expect(explanation).toHaveTextContent("6,8 + 1 = 7,8 из 10");
    expect(explanation).toHaveTextContent(
      "Количество наблюдений не добавляет баллы самостоятельно. Оно влияет на среднюю подозрительность и долю наблюдений с добычей. Цвет, локация и время в расчёте индекса не участвуют.",
    );

    expect(
      screen.getByRole("link", { name: "Изменить параметры" }),
    ).toBeInTheDocument();
    const changeWeight = screen.getByRole("button", {
      name: "Изменить вес параметров",
    });
    await user.click(changeWeight);
    expect(
      screen.getByRole("slider", { name: "Влияние добычи" }),
    ).toHaveFocus();
    expect(
      screen.queryByText("Оценка 80% · добыча 20%"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Состояние данных" }),
    ).not.toBeInTheDocument();

    const ranking = screen.getByRole("list", {
      name: "Рейтинг подозрительности",
    });
    const rows = within(ranking).getAllByRole("listitem");

    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Лиса 1"),
      expect.stringContaining("Лиса 3"),
      expect.stringContaining("Лиса 2"),
      expect.stringContaining("Лиса 4"),
    ]);
    expect(rows[0]).toHaveTextContent(
      "Лиса 1fox_001рыжая · 10:40Северная полянаоценка 8,5добыча в 1 из 22 наблюдения",
    );
    expect(rows[0]?.querySelector(".color-swatch")).toHaveAttribute(
      "data-color",
      "рыжая",
    );
    expect(screen.getByRole("slider", { name: "Влияние добычи" })).toHaveValue(
      "20",
    );
    expect(
      screen.getByRole("spinbutton", {
        name: "Влияние добычи, точное значение",
      }),
    ).toHaveValue(20);
    expect(screen.getByText("Влияние подозрительности 80%"));
    expect(screen.getByText("Наличие добычи 20%"));
    expect(screen.getByText("Измените вес параметров")).toBeInTheDocument();
    expect(screen.queryByText("Порядок внимания")).not.toBeInTheDocument();
    expect(
      screen.getByText("Выберите лису для отображения расчетов."),
    ).toBeInTheDocument();
    const selectedCalculation = screen.getByRole("complementary", {
      name: "Расчёт: Лиса 1, идентификатор fox_001",
    });
    expect(within(selectedCalculation).getByText("Расчет индекса"));
    const parameterWeights = screen.getByRole("region", {
      name: "Вес параметров",
    });
    expect(selectedCalculation).not.toContainElement(parameterWeights);
    expect(
      within(parameterWeights).getByRole("button", {
        name: "Сбросить значения",
      }),
    ).toBeDisabled();
  });

  it("keeps repeating contributions exact and marks multiple observed colors", () => {
    window.localStorage.setItem(
      "fox-dispatcher.dashboard",
      JSON.stringify({
        observations: [
          {
            color: "серая",
            fox_id: "fox_repeat",
            has_prey: true,
            id: "obs_repeat_1",
            location: "Поляна",
            suspicion_level: 1,
            time: "08:00",
          },
          {
            color: "рыжая",
            fox_id: "fox_repeat",
            has_prey: false,
            id: "obs_repeat_2",
            location: "Поляна",
            suspicion_level: 0,
            time: "09:00",
          },
          {
            color: "рыжая",
            fox_id: "fox_repeat",
            has_prey: false,
            id: "obs_repeat_3",
            location: "Овраг",
            suspicion_level: 0,
            time: "10:00",
          },
        ],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: "2026-07-17T09:00:00.000Z",
      }),
    );

    render(<App />);

    expect(screen.getByText("Индекс 0,9 из 10")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Почему Лиса «fox_repeat»" }),
    ).toHaveTextContent(
      "Средняя подозрительность по всем наблюдениямСредняя 1/3 · 3 наблюденияИндекс 4/15Наличие добычиВ 1 из 3 наблюденийИндекс 2/3",
    );
    expect(
      screen.getByRole("region", { name: "Расчет индекса подозрительности" }),
    ).toHaveTextContent("Точный результат — 14/15. На экране — 0,9 из 10.");
    expect(screen.getByText("рыжая · 2 цвета · 10:00")).toBeInTheDocument();
    expect(screen.getByText("4/15")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("1/3 × 80%")).toBeInTheDocument();
  });

  it("shows every fox sharing the exact highest index", () => {
    window.localStorage.setItem(
      "fox-dispatcher.dashboard",
      JSON.stringify({
        observations: [
          {
            color: "серебристая",
            fox_id: "fox_003",
            has_prey: true,
            id: "obs_tie_3",
            location: "Моховой овраг",
            suspicion_level: 7,
            time: "11:15",
          },
          {
            color: "черная",
            fox_id: "fox_005",
            has_prey: true,
            id: "obs_tie_5",
            location: "Туманная тропа",
            suspicion_level: 0,
            time: "12:20",
          },
        ],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 95 },
        updatedAt: "2026-07-17T09:00:00.000Z",
      }),
    );

    render(<App />);

    expect(getLeaderHeading("Лиса 3")).toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "100" } });
    fireEvent.pointerUp(slider);

    expect(getLeaderHeading("Лисы 3 и 5")).toBeInTheDocument();
    expect(screen.getByText("fox_003 · fox_005")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Почему Лиса 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Почему Лиса 5" }),
    ).toBeInTheDocument();
    const explanation = screen.getByRole("region", {
      name: "Расчет индекса подозрительности",
    });
    expect(
      within(explanation).getByRole("heading", {
        name: "Детальный расчет индекса самых подозрительных лис",
      }),
    ).toBeInTheDocument();
    expect(
      within(explanation).getByRole("heading", { name: "Лиса 3" }),
    ).toBeInTheDocument();
    expect(
      within(explanation).getByRole("heading", { name: "Лиса 5" }),
    ).toBeInTheDocument();
    expect(
      within(explanation).getAllByText("1/1 × 10 × 100% = 10"),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole("list", { name: "Рейтинг подозрительности" }))
        .getAllByRole("listitem")
        .every((row) => row.classList.contains("ranking-row--leader")),
    ).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 95% до 100%. Новые лидеры — Лисы 3 и 5, идентификаторы fox_003 и fox_005, индекс 10,0.",
    );
  });

  it("gives similar fox identifiers unique display names", () => {
    window.localStorage.setItem(
      "fox-dispatcher.dashboard",
      JSON.stringify({
        observations: [
          {
            color: "рыжая",
            fox_id: "fox_1",
            has_prey: false,
            id: "obs_a",
            location: "Поляна",
            suspicion_level: 6,
            time: "08:00",
          },
          {
            color: "серая",
            fox_id: "fox_01",
            has_prey: true,
            id: "obs_b",
            location: "Овраг",
            suspicion_level: 5,
            time: "09:00",
          },
        ],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: "2026-07-17T09:00:00.000Z",
      }),
    );

    render(<App />);

    expect(screen.queryByText("Лиса 1")).not.toBeInTheDocument();
    expect(screen.getAllByText("Лиса «fox_1»").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Лиса «fox_01»").length).toBeGreaterThan(0);
    expect(screen.getAllByText("fox_1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("fox_01").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: /Показать расчёт: Лиса «fox_01».*fox_01/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Показать расчёт: Лиса «fox_1».*fox_1/,
      }),
    ).toBeInTheDocument();
  });

  it("keeps mobile filters compact until the observer asks for them", async () => {
    const user = userEvent.setup();
    const defaultMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...defaultMatchMedia(query),
      matches: query === "(max-width: 640px)",
    }));

    render(<App />);

    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("searchbox", { name: "Найти лису" }),
    ).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Показать фильтры" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(
      screen.getByRole("searchbox", { name: "Найти лису" }),
    ).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the recalculated leader next to the policy on compact screens", () => {
    const defaultMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...defaultMatchMedia(query),
      matches: query === "(max-width: 640px)",
    }));

    render(<App />);

    const result = screen.getByRole("region", {
      name: "Текущий результат расчёта",
    });
    expect(result).toHaveTextContent("Лиса 1");
    expect(result).toHaveTextContent("7,8 из 10");

    fireEvent.change(screen.getByRole("slider", { name: "Влияние добычи" }), {
      target: { value: "30" },
    });

    expect(result).toHaveTextContent("Лиса 3");
    expect(result).toHaveTextContent("7,9 из 10");
  });

  it("routes a truly empty dataset to the existing data-management actions", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "fox-dispatcher.dashboard",
      JSON.stringify({
        observations: [],
        schemaVersion: 1,
        scoringPolicy: { preyWeightPercent: 20 },
        updatedAt: "2026-07-17T09:00:00.000Z",
      }),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Наблюдений пока нет" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "В журнале нет записей. Откройте управление данными, чтобы добавить наблюдение, импортировать JSON или вернуть стартовый набор.",
      ),
    ).toBeInTheDocument();
    const manage = screen.getByRole("link", {
      name: "Открыть управление данными",
    });
    await user.click(manage);

    expect(window.location.hash).toBe("#observations");
    expect(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Импортировать JSON" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Вернуть стартовые данные" }),
    ).toBeInTheDocument();
  });

  it("previews immediately and announces one committed result", () => {
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Влияние добычи" });

    fireEvent.change(slider, { target: { value: "30" } });

    expect(getLeaderHeading("Лиса 3")).toBeInTheDocument();
    expect(screen.getByText("Индекс 7,9 из 10")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.pointerUp(slider);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 20% до 30%. Новый лидер — Лиса 3, идентификатор fox_003, индекс 7,9.",
    );
    expect(
      screen.getByRole("region", { name: "Последнее изменение отчёта" }),
    ).toHaveTextContent(
      "Вес добычи изменён с 20% до 30%. Новый лидер — Лиса 3, идентификатор fox_003, индекс 7,9.",
    );

    const exactControl = screen.getByRole("spinbutton", {
      name: "Влияние добычи, точное значение",
    });
    fireEvent.change(exactControl, { target: { value: "35" } });
    fireEvent.blur(exactControl);

    expect(getLeaderHeading("Лиса 3"));
    expect(screen.getByText("Индекс 8,1 из 10"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 30% до 35%. Лидер не изменился: Лиса 3, идентификатор fox_003, индекс 8,1.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Сбросить значения" }));

    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
    expect(slider).toHaveValue("20");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 35% до 20%. Новый лидер — Лиса 1, идентификатор fox_001, индекс 7,8.",
    );
  });

  it("announces a keyboard slider sequence only when the control is left", () => {
    render(<App />);

    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "25" } });
    fireEvent.keyUp(slider, { key: "ArrowRight" });
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.keyUp(slider, { key: "ArrowRight" });

    expect(getLeaderHeading("Лиса 3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.blur(slider);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 20% до 30%. Новый лидер — Лиса 3, идентификатор fox_003, индекс 7,9.",
    );
  });

  it("accepts sequential exact-weight editing and rejects invalid commits", () => {
    render(<App />);

    let exactControl = screen.getByRole("spinbutton", {
      name: "Влияние добычи, точное значение",
    });
    const slider = screen.getByRole("slider", { name: "Влияние добычи" });

    fireEvent.change(exactControl, { target: { value: "" } });
    expect(exactControl).toHaveValue(null);
    fireEvent.change(exactControl, { target: { value: "3" } });
    expect(exactControl).toHaveValue(3);
    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
    fireEvent.change(exactControl, { target: { value: "30" } });
    expect(exactControl).toHaveValue(30);
    expect(slider).toHaveValue("20");
    fireEvent.blur(exactControl);

    expect(slider).toHaveValue("30");
    expect(getLeaderHeading("Лиса 3")).toBeInTheDocument();

    exactControl = screen.getByRole("spinbutton", {
      name: "Влияние добычи, точное значение",
    });
    fireEvent.change(exactControl, { target: { value: "33" } });
    fireEvent.blur(exactControl);
    expect(exactControl).toHaveValue(33);
    expect(exactControl).toHaveAttribute("aria-invalid", "true");
    expect(exactControl).toHaveAccessibleDescription(
      /Введите целое число от 0 до 100 с шагом 5/,
    );
    expect(slider).toHaveValue("30");

    fireEvent.change(exactControl, { target: { value: "25" } });
    exactControl.focus();
    fireEvent.keyDown(exactControl, { key: "Enter" });
    exactControl = screen.getByRole("spinbutton", {
      name: "Влияние добычи, точное значение",
    });
    expect(exactControl).toHaveAttribute("aria-invalid", "false");
    expect(exactControl).toHaveFocus();
    expect(slider).toHaveValue("25");
  });

  it("keeps an explicit fox selection while the ranking recalculates", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: /^Показать расчёт: Лиса 2, индекс 4,0/,
      }),
    );

    const inspector = screen.getByRole("complementary", {
      name: "Расчёт: Лиса 2, идентификатор fox_002",
    });

    expect(inspector).toHaveTextContent("Средняя подозрительность");
    expect(
      screen.queryByRole("region", { name: "Лента доказательств" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /^Показать расчёт: Лиса 2, индекс 4,0/,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    const slider = screen.getByRole("slider", { name: "Влияние добычи" });
    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.pointerUp(slider);

    expect(getLeaderHeading("Лиса 3")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", {
        name: "Расчёт: Лиса 2, идентификатор fox_002",
      }),
    ).toBeInTheDocument();
  });

  it("applies report-wide filters, falls back cleanly, and resets the scope", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: /^Показать расчёт: Лиса 3, индекс 7,6/,
      }),
    );

    const locationFilter = screen.getByRole("combobox", {
      name: "Локация",
    });
    await user.selectOptions(locationFilter, "Северная поляна");

    expect(locationFilter).toHaveFocus();
    expect(screen.getByText("Отчёт по 3 из 5 наблюдений")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Рейтинг подозрительности" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("complementary", {
        name: "Расчёт: Лиса 1, идентификатор fox_001",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Фильтры применены: 3 из 5 наблюдений. Выбрана Лиса 1, идентификатор fox_001.",
    );
    expect(
      screen.getByRole("button", {
        name: "Удалить фильтр Локация: Северная поляна",
      }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Активность по локациям" }),
      ).getByText("3 из 3 · 100%"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Найти лису" }),
      "missing",
    );

    expect(
      screen.getByRole("heading", {
        name: "В этой выборке ничего не найдено",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Отчёт по 0 из 5 наблюдений")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сбросить всё" }));

    expect(screen.getByText("Отчёт по 5 из 5 наблюдений")).toBeInTheDocument();
    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
  });

  it("moves focus predictably while report filter chips are removed", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("searchbox", { name: "Найти лису" }),
      "fox_001",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Локация" }),
      "Северная поляна",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Цвет" }),
      "рыжая",
    );
    await user.click(screen.getByRole("radio", { name: "Нет" }));

    await user.click(
      screen.getByRole("button", {
        name: "Удалить фильтр Лиса: fox_001",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Удалить фильтр Локация: Северная поляна",
      }),
    ).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: "Удалить фильтр Цвет: рыжая" }),
    );

    expect(
      screen.getByRole("button", { name: "Удалить фильтр Добыча: нет" }),
    ).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: "Удалить фильтр Добыча: нет" }),
    );

    expect(
      screen.getByRole("button", {
        name: "Удалить фильтр Локация: Северная поляна",
      }),
    ).toHaveFocus();

    await user.click(
      screen.getByRole("button", {
        name: "Удалить фильтр Локация: Северная поляна",
      }),
    );

    expect(screen.getByText("Отчёт по 5 из 5 наблюдений")).toHaveFocus();
  });

  it("searches by the unique fox name shown in the interface", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByRole("searchbox", { name: "Найти лису" });
    expect(search).toHaveAttribute("placeholder", "Лиса 1 или fox_001");

    await user.type(search, "Лиса 1");

    expect(screen.getByText("Отчёт по 2 из 5 наблюдений")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Рейтинг подозрительности" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
  });

  it("recovers an empty scoped ledger and toggles a location bar", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("searchbox", { name: "Найти лису" }),
      "missing",
    );
    const firstAnnouncement = screen.getByRole("status").firstElementChild;

    await user.type(screen.getByRole("searchbox", { name: "Найти лису" }), "x");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Фильтры применены: 0 из 5 наблюдений.",
    );
    expect(screen.getByRole("status").firstElementChild).not.toBe(
      firstAnnouncement,
    );
    await user.click(screen.getByRole("link", { name: "Параметры" }));

    expect(
      screen.getByRole("heading", {
        name: "В этой выборке ничего не найдено",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сбросить фильтры" }));

    expect(screen.getByText("Отчёт по 5 из 5 наблюдений")).toHaveFocus();
    await user.click(screen.getByRole("link", { name: "Сводка" }));

    const location = screen.getByRole("button", {
      name: /^Фильтровать по локации Северная поляна, 3 из 5/,
    });
    await user.click(location);

    expect(screen.getByText("Отчёт по 3 из 5 наблюдений")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /^Фильтровать по локации Северная поляна, 3 из 3/,
      }),
    );

    expect(screen.getByText("Отчёт по 5 из 5 наблюдений")).toBeInTheDocument();
  });
});

function getLeaderHeading(name: string) {
  return within(
    screen.getByRole("region", { name: "Самая подозрительная лиса" }),
  ).getByRole("heading", { level: 2, name });
}
