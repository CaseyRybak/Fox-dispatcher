import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("public AI Worklog", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#worklog");
  });

  it("renders seven factual checkpoints with separated responsibility", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "AI Worklog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("7 ключевых чекпоинтов")).toBeInTheDocument();

    const checkpoints = screen.getAllByRole("article");
    expect(checkpoints).toHaveLength(7);

    for (const checkpoint of checkpoints) {
      expect(
        within(checkpoint).getByRole("heading", { level: 2 }),
      ).toBeInTheDocument();
      expect(within(checkpoint).getByText("Вклад AI")).toBeInTheDocument();
      expect(
        within(checkpoint).getByText("Решение человека"),
      ).toBeInTheDocument();
      expect(
        within(checkpoint).getByText("Что изменилось"),
      ).toBeInTheDocument();
      expect(within(checkpoint).getByText("Как проверено")).toBeInTheDocument();
    }
  });

  it("exposes descriptive, safely opened evidence links", () => {
    render(<App />);

    const evidence = screen.getByRole("region", {
      name: "Хронология работы с AI",
    });
    const links = within(evidence).getAllByRole("link");

    expect(links).toHaveLength(14);

    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(
          /^https:\/\/github\.com\/CaseyRybak\/Fox-dispatcher\/blob\/[0-9a-f]{40}\//,
        ),
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
      expect(link).toHaveAccessibleName(/откроется в новой вкладке/i);
      expect(link).not.toHaveTextContent(/^https?:\/\//);
    }
  });
});
