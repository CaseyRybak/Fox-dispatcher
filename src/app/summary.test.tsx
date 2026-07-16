import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("interactive suspicion summary", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#summary");
  });

  it("shows the exact 80/20 leader, ranking, and calculation", () => {
    render(<App />);

    expect(getLeaderHeading("fox_001")).toBeInTheDocument();
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
      expect.stringContaining("fox_001"),
      expect.stringContaining("fox_003"),
      expect.stringContaining("fox_002"),
      expect.stringContaining("fox_004"),
    ]);
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

    expect(getLeaderHeading("fox_003")).toBeInTheDocument();
    expect(screen.getByText("7,9 из 10")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.pointerUp(slider);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Лидер изменился: fox_003, 7,9.",
    );

    const exactControl = screen.getByRole("spinbutton", {
      name: "Влияние добычи, точное значение",
    });
    fireEvent.change(exactControl, { target: { value: "35" } });
    fireEvent.blur(exactControl);

    expect(getLeaderHeading("fox_003"));
    expect(screen.getByText("8,1 из 10"));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Влияние добычи 35%. Лидер fox_003, индекс 8,1.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Вернуть 20%" }));

    expect(getLeaderHeading("fox_001")).toBeInTheDocument();
    expect(slider).toHaveValue("20");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Лидер изменился: fox_001, 7,8.",
    );
  });
});

function getLeaderHeading(name: string) {
  return within(
    screen.getByRole("region", { name: "Сводка наблюдений" }),
  ).getByRole("heading", { level: 2, name });
}
