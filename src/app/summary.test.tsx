import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("interactive suspicion summary", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#summary");
  });

  it("shows the exact 80/20 leader, ranking, and calculation", () => {
    render(<App />);

    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
    expect(screen.getByText("7,8 из 10")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Средняя оценка 8,5 дала 6,8 балла; добыча в 1 из 2 записей добавила 1,0.",
      ),
    ).toBeInTheDocument();

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
      "Лиса 1рыжая · 10:40Северная полянаоценка 8,5добыча 1/2",
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
      "Лидер изменился: Лиса 3, 7,9.",
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
      "Влияние добычи 35%. Лидер Лиса 3, индекс 8,1.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Вернуть 20%" }));

    expect(getLeaderHeading("Лиса 1")).toBeInTheDocument();
    expect(slider).toHaveValue("20");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Лидер изменился: Лиса 1, 7,8.",
    );
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
      name: "Расчёт: Лиса 2",
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
        name: "Расчёт: Лиса 2",
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
        name: "Расчёт: Лиса 1",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Фильтры применены: 3 из 5 наблюдений. Выбрана Лиса 1.",
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
