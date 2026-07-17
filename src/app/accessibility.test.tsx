import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("targeted accessibility contract", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#observations");
  });

  it("exposes the observation editor as a named modal and keeps errors connected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editor = screen.getByRole("dialog", { name: "Новое наблюдение" });
    expect(editor).toHaveAttribute("aria-modal", "true");
    expect(within(editor).getByRole("textbox", { name: "Лиса" })).toHaveFocus();

    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );
    const summary = within(editor).getByRole("alert");
    expect(summary).toHaveFocus();
    expect(
      within(editor).getByRole("textbox", { name: "Лиса" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("uses a labelled card ledger and explicit sort control on a narrow viewport", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => true,
      matches: query === "(max-width: 767px)",
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }));

    render(<App />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const ledger = screen.getByRole("list", {
      name: "Наблюдения текущей выборки",
    });
    expect(within(ledger).getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByRole("combobox", { name: "Сортировка наблюдений" }),
    ).toHaveValue("time-descending");
    expect(
      within(ledger).getByRole("button", { name: "Изменить obs_005" }),
    ).toBeInTheDocument();
  });

  it("exposes reset as a named modal with the non-destructive action first", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Вернуть стартовые данные" }),
    );
    const confirmation = screen.getByRole("alertdialog", {
      name: "Вернуть стартовые данные?",
    });
    expect(confirmation).toHaveAttribute("aria-modal", "true");
    expect(
      within(confirmation).getByRole("button", {
        name: "Оставить текущие данные",
      }),
    ).toHaveFocus();
  });

  it("uses Browser Back to guard a dirty editor before leaving observations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    await user.type(screen.getByRole("textbox", { name: "Лиса" }), "черновик");
    window.history.back();

    const confirmation = await screen.findByRole("alertdialog", {
      name: "Отменить несохранённые изменения?",
    });
    expect(window.location.hash).toBe("#observations");
    await user.click(
      within(confirmation).getByRole("button", {
        name: "Отменить изменения",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Новое наблюдение" }),
      ).not.toBeInTheDocument();
    });
    expect(window.location.hash).toBe("#observations");
  });
});
