import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("interactive suspicion summary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "#summary");
  });

  it("shows the exact 80/20 leader, ranking, and calculation", () => {
    render(<App />);

    const leader = getLeaderHeading("Лиса 1");
    expect(leader).toBeInTheDocument();
    const reportScope = screen.getByRole("region", { name: "Область отчёта" });
    const reportScopePosition =
      leader.closest("section")?.compareDocumentPosition(reportScope) ?? 0;
    expect(reportScopePosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("fox_001").length).toBeGreaterThan(1);
    expect(screen.getByText("Самая подозрительная сейчас")).toBeInTheDocument();
    expect(screen.getByText("7,8 из 10")).toBeInTheDocument();
    expect(
      screen.getByText("Почему Лиса 1 первая:").closest("p"),
    ).toHaveTextContent(
      "Почему Лиса 1 первая: Средняя оценка по 2 наблюдениям — 8,5; вклад оценки — 6,8. Добыча отмечена в 1 из 2 наблюдений; вклад добычи — 1. Итоговый индекс — 7,8.",
    );
    expect(
      screen.getByText(
        "Индекс рассчитывается по всем наблюдениям лисы. Их количество влияет на среднюю оценку и долю записей с добычей, но само по себе не добавляет и не снимает баллы. Цвет, локация и время в формулу не входят.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Индекс определяет приоритет наблюдения, а не вероятность опасности.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Изменить наблюдения" }),
    ).toHaveAttribute("href", "#observations");
    expect(screen.getByText("Больше всего наблюдений")).toBeInTheDocument();
    expect(screen.getByText("Факторы индекса")).toBeInTheDocument();
    expect(screen.getAllByText("Оценка смотрителя").length).toBeGreaterThan(1);
    expect(screen.getByText("и добыча")).toBeInTheDocument();
    expect(screen.getByText("Оценка 80% · добыча 20%")).toBeInTheDocument();

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
    expect(screen.getByText("Оценка смотрителя 80%"));
    expect(screen.getByText("Добыча 20%"));
    expect(
      screen.getByText(
        "Измените вес добычи — рейтинг, лидер и объяснение пересчитаются сразу.",
      ),
    ).toBeInTheDocument();
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

    expect(screen.getByText("0,9 из 10")).toBeInTheDocument();
    expect(
      screen.getByText("Почему fox_repeat первая:").closest("p"),
    ).toHaveTextContent(
      "Почему fox_repeat первая: Средняя оценка по 3 наблюдениям — 1/3; вклад оценки — 4/15. Добыча отмечена в 1 из 3 наблюдений; вклад добычи — 2/3. Точный индекс — 14/15, на экране — 0,9.",
    );
    expect(screen.getByText("рыжая · 2 цвета · 10:00")).toBeInTheDocument();
    expect(screen.getByText("4/15")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("1/3 × 80%")).toBeInTheDocument();
  });

  it("keeps similar canonical fox identifiers distinguishable", () => {
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

    expect(screen.getAllByText("Лиса 1").length).toBeGreaterThan(1);
    expect(screen.getAllByText("fox_1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("fox_01").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: /Показать доказательства: Лиса 1.*fox_01/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Показать доказательства: Лиса 1.*fox_1/,
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
      screen.queryByRole("searchbox", { name: "Найти fox_id" }),
    ).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Показать фильтры" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(
      screen.getByRole("searchbox", { name: "Найти fox_id" }),
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
    expect(screen.getByText("7,9 из 10")).toBeInTheDocument();
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
    expect(screen.getByText("8,1 из 10"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Вес добычи изменён с 30% до 35%. Лидер не изменился: Лиса 3, идентификатор fox_003, индекс 8,1.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Вернуть 20%" }));

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
        name: /^Показать доказательства: Лиса 2, индекс 4,0/,
      }),
    );

    const inspector = screen.getByRole("complementary", {
      name: "Расчёт: Лиса 2, идентификатор fox_002",
    });

    expect(within(inspector).getByText("obs_002")).toBeInTheDocument();
    expect(within(inspector).getByText("Туманная тропа")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /^Показать доказательства: Лиса 2, индекс 4,0/,
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
        name: /^Показать доказательства: Лиса 3, индекс 7,6/,
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
      screen.getByRole("searchbox", { name: "Найти fox_id" }),
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
      screen.getByRole("searchbox", { name: "Найти fox_id" }),
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

  it("recovers an empty scoped ledger and toggles a location bar", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole("searchbox", { name: "Найти fox_id" }),
      "missing",
    );
    const firstAnnouncement = screen.getByRole("status").firstElementChild;

    await user.type(
      screen.getByRole("searchbox", { name: "Найти fox_id" }),
      "x",
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Фильтры применены: 0 из 5 наблюдений.",
    );
    expect(screen.getByRole("status").firstElementChild).not.toBe(
      firstAnnouncement,
    );
    await user.click(screen.getByRole("link", { name: "Наблюдения" }));

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
    screen.getByRole("region", { name: "Сводка наблюдений" }),
  ).getByRole("heading", { level: 2, name });
}
