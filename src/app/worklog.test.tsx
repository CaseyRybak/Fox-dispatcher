import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("public AI Worklog", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#worklog");
  });

  it("renders six factual checkpoints with human responsibility first", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "AI Worklog" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Короткая хронология постановки задачи, решений, исправлений и проверок. Здесь разделены вклад AI и ответственность человека",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Как создаётся продукт")).not.toBeInTheDocument();
    expect(screen.queryByText("7 ключевых чекпоинтов")).not.toBeInTheDocument();

    const checkpoints = screen.getAllByRole("article");
    expect(checkpoints).toHaveLength(6);

    for (const checkpoint of checkpoints) {
      expect(
        within(checkpoint).getByRole("heading", { level: 2 }),
      ).toBeInTheDocument();
      const responsibilityHeadings = within(checkpoint).getAllByRole(
        "heading",
        { level: 3 },
      );
      expect(
        responsibilityHeadings.map(({ textContent }) => textContent),
      ).toEqual(["Решение человека", "Вклад AI"]);
      expect(
        within(checkpoint).queryByText("Что изменилось"),
      ).not.toBeInTheDocument();
      expect(
        within(checkpoint).queryByText("Как проверено"),
      ).not.toBeInTheDocument();
      expect(
        within(checkpoint).queryByText("Доказательства"),
      ).not.toBeInTheDocument();
    }

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Постановка задачи и проработка плана реализации",
      }),
    ).toBeInTheDocument();
  });

  it("does not render repository evidence links in the timeline", () => {
    render(<App />);

    const evidence = screen.getByRole("region", {
      name: "Хронология работы с AI",
    });
    expect(within(evidence).queryAllByRole("link")).toHaveLength(0);
  });
});
