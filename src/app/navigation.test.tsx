import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("hash navigation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#summary");
    document.title = "Лисий диспетчер";
    document.documentElement.removeAttribute("lang");
  });

  it("keeps the general parameters action linked to Parameters", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Изменить параметры" }));

    expect(window.location.hash).toBe("#observations");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Наблюдения" }),
    ).toBeInTheDocument();
  });

  it("synchronizes language, title, current link, route focus, and browser history", async () => {
    const user = userEvent.setup();
    render(<App />);

    const summaryHeading = screen.getByRole("heading", {
      level: 1,
      name: "Самая подозрительная лиса",
    });

    expect(summaryHeading).not.toHaveFocus();
    expect(document.documentElement).toHaveAttribute("lang", "ru");
    expect(document.title).toBe("Сводка - Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Сводка" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "Параметры" }));

    const observationsHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Наблюдения",
    });
    await waitFor(() => expect(observationsHeading).toHaveFocus());
    expect(document.title).toBe("Параметры - Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Параметры" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "AI Worklog" }));
    const worklogHeading = await screen.findByRole("heading", {
      level: 1,
      name: "AI Worklog",
    });
    await waitFor(() => expect(worklogHeading).toHaveFocus());
    expect(document.title).toBe("AI Worklog - Лисий диспетчер");
    expect(screen.getByRole("link", { name: "AI Worklog" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    window.history.back();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Наблюдения" }),
      ).toHaveFocus();
    });
    expect(document.title).toBe("Параметры - Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Параметры" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    window.history.forward();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "AI Worklog" }),
      ).toHaveFocus();
    });
    expect(document.title).toBe("AI Worklog - Лисий диспетчер");
    expect(screen.getByRole("link", { name: "AI Worklog" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("skips to the current main content without changing the destination", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#observations");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Наблюдения" }),
    ).not.toHaveFocus();

    await user.click(
      screen.getByRole("link", { name: "Перейти к содержанию" }),
    );

    expect(window.location.hash).toBe("#observations");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(
      screen.getByRole("heading", { level: 1, name: "Наблюдения" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Параметры - Лисий диспетчер");
  });

  it("keeps one live-status node mounted across destinations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: /^Показать расчёт: Лиса 2, индекс 4,0/,
      }),
    );
    const status = screen.getByRole("status");

    expect(status).toHaveTextContent(
      "Показаны доказательства: Лиса 2, идентификатор fox_002.",
    );

    await user.click(screen.getByRole("link", { name: "Параметры" }));

    expect(screen.getByRole("status")).toBe(status);
  });
});
