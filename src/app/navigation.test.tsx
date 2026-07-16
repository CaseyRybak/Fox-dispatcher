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

  it("synchronizes language, title, current link, heading focus, and browser history", async () => {
    const user = userEvent.setup();
    render(<App />);

    const summaryHeading = screen.getByRole("heading", {
      level: 1,
      name: "Сводка наблюдений",
    });

    await waitFor(() => expect(summaryHeading).toHaveFocus());
    expect(document.documentElement).toHaveAttribute("lang", "ru");
    expect(document.title).toBe("Сводка — Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Сводка" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "Наблюдения" }));

    const observationsHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Наблюдения",
    });
    await waitFor(() => expect(observationsHeading).toHaveFocus());
    expect(document.title).toBe("Наблюдения — Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Наблюдения" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "AI Worklog" }));
    const worklogHeading = await screen.findByRole("heading", {
      level: 1,
      name: "AI Worklog",
    });
    await waitFor(() => expect(worklogHeading).toHaveFocus());
    expect(document.title).toBe("AI Worklog — Лисий диспетчер");
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
    expect(document.title).toBe("Наблюдения — Лисий диспетчер");
    expect(screen.getByRole("link", { name: "Наблюдения" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    window.history.forward();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "AI Worklog" }),
      ).toHaveFocus();
    });
    expect(document.title).toBe("AI Worklog — Лисий диспетчер");
    expect(screen.getByRole("link", { name: "AI Worklog" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("skips to the current main content without changing the destination", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#observations");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Наблюдения" }),
      ).toHaveFocus();
    });

    await user.click(
      screen.getByRole("link", { name: "Перейти к содержанию" }),
    );

    expect(window.location.hash).toBe("#observations");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(
      screen.getByRole("heading", { level: 1, name: "Наблюдения" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Наблюдения — Лисий диспетчер");
  });
});
