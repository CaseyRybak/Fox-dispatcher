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
    expect(editor).toHaveTextContent("Все поля обязательны.");
    expect(within(editor).getByRole("textbox", { name: "Лиса" })).toHaveFocus();
    expect(
      within(editor).getByRole("textbox", { name: "Лиса" }),
    ).toBeRequired();
    expect(
      within(editor).getByRole("combobox", { name: "Локация" }),
    ).toBeRequired();
    expect(
      within(editor).getByRole("combobox", { name: "Цвет" }),
    ).toBeRequired();
    expect(within(editor).getByRole("radio", { name: "Да" })).toBeRequired();
    expect(
      within(editor).getByRole("spinbutton", {
        name: "Оценка подозрительности",
      }),
    ).toBeRequired();
    expect(within(editor).getByLabelText("Время")).toBeRequired();

    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );
    const summary = within(editor).getByRole("alert");
    expect(summary).toHaveFocus();
    expect(
      within(editor).getByRole("textbox", { name: "Лиса" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("offers every desktop sort field and direction for the mobile card ledger", async () => {
    const user = userEvent.setup();
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
    const sortControl = screen.getByRole("combobox", {
      name: "Сортировка наблюдений",
    });
    expect(sortControl).toHaveValue("time-descending");
    expect(
      within(sortControl)
        .getAllByRole("option")
        .map((option) => ({
          label: option.textContent,
          value: option.getAttribute("value"),
        })),
    ).toEqual([
      { label: "Время: сначала поздние", value: "time-descending" },
      { label: "Время: сначала ранние", value: "time-ascending" },
      { label: "Лиса: от А до Я", value: "foxId-ascending" },
      { label: "Лиса: от Я до А", value: "foxId-descending" },
      { label: "Локация: от А до Я", value: "location-ascending" },
      { label: "Локация: от Я до А", value: "location-descending" },
      { label: "Цвет: от А до Я", value: "color-ascending" },
      { label: "Цвет: от Я до А", value: "color-descending" },
      { label: "Добыча: сначала нет", value: "hasPrey-ascending" },
      { label: "Добыча: сначала есть", value: "hasPrey-descending" },
      {
        label: "Оценка: сначала низкая",
        value: "suspicionLevel-ascending",
      },
      {
        label: "Оценка: сначала высокая",
        value: "suspicionLevel-descending",
      },
    ]);
    await user.selectOptions(sortControl, "color-descending");
    expect(within(ledger).getAllByRole("listitem")[0]).toHaveTextContent(
      "obs_002",
    );
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

  it("keeps one editor history marker when the responsive ledger rerenders", async () => {
    const user = userEvent.setup();
    let matches = false;
    const changeListeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", (query: string) => ({
      addEventListener: (_type: string, listener: () => void) =>
        changeListeners.add(listener),
      addListener: () => undefined,
      dispatchEvent: () => true,
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      removeEventListener: (_type: string, listener: () => void) =>
        changeListeners.delete(listener),
      removeListener: () => undefined,
    }));
    window.history.replaceState(null, "", "#summary");
    window.history.pushState(null, "", "#observations");
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editorHistoryLength = window.history.length;
    matches = true;
    changeListeners.forEach((listener) => listener());

    await waitFor(() => {
      expect(
        screen.getByRole("list", { name: "Наблюдения текущей выборки" }),
      ).toBeInTheDocument();
    });
    expect(window.history.length).toBe(editorHistoryLength);

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Отменить",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    window.history.back();
    await waitFor(() => expect(window.location.hash).toBe("#summary"));
  });
});
