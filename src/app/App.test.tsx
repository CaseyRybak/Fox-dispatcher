import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("application shell", () => {
  beforeEach(() => {
    window.location.hash = "#summary";
  });

  it("shows the validated starter dataset and accessible destinations", () => {
    render(<App />);

    expect(
      screen.getByRole("navigation", { name: "Основная навигация" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("link", { name: "Лисий диспетчер - сводка" })
        .querySelector("img.brand__mark"),
    ).toHaveAttribute("src", "/favicon.svg");
    expect(
      screen.queryByRole("link", { name: "Лицензии компонентов" }),
    ).not.toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByText("Fox Dispatcher · explainable scoring"),
    ).toHaveAttribute("lang", "en");
    expect(footer.querySelector("img")).toHaveAttribute("src", "/favicon.svg");
    expect(footer).toHaveTextContent(
      "© 2026 Лисий диспетчер - полевой журнал наблюдений",
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Самая подозрительная лиса",
      }),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", {
      name: "Самая подозрительная лиса",
    });

    expect(
      within(
        within(summary).getByLabelText("Состав текущего отчёта"),
      ).getByText("4"),
    ).toBeInTheDocument();
    expect(within(summary).getByText("3 из 5 наблюдений"));
    expect(
      within(summary).getByRole("heading", { level: 2, name: "Лиса 1" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Активность по локациям" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Последние наблюдения" }),
    ).not.toBeInTheDocument();

    window.location.hash = "#observations";
    fireEvent(window, new HashChangeEvent("hashchange"));

    const table = screen.getByRole("table");

    for (const observationId of [
      "obs_001",
      "obs_002",
      "obs_003",
      "obs_004",
      "obs_005",
    ]) {
      expect(within(table).getByText(observationId)).toBeInTheDocument();
    }
  });

  it("opens the Worklog destination from the URL hash", () => {
    render(<App />);

    window.location.hash = "#worklog";
    fireEvent(window, new HashChangeEvent("hashchange"));

    expect(
      screen.getByRole("heading", { level: 1, name: "AI Worklog" }),
    ).toBeInTheDocument();
  });
});
