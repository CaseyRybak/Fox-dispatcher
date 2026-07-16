import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("observation management", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "#observations");
    vi.stubGlobal("crypto", {
      randomUUID: () => "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("edits an observation and recalculates the report from the accepted set", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Изменить obs_005" }));
    const editor = screen.getByRole("region", {
      name: "Изменить наблюдение obs_005",
    });
    const suspicion = within(editor).getByRole("spinbutton", {
      name: "Оценка подозрительности",
    });
    await user.clear(suspicion);
    await user.type(suspicion, "10");
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    expect(
      screen.queryByRole("region", { name: /Изменить наблюдение/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Изменить obs_005" }),
    ).toHaveFocus();

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    const summary = screen.getByRole("region", { name: "Сводка наблюдений" });
    expect(
      within(summary).getByRole("heading", { name: "fox_004" }),
    ).toBeInTheDocument();
    expect(within(summary).getByText("8,0 из 10")).toBeInTheDocument();
  });

  it("deletes the only fox_004 observation, exposes one-step undo, and restores it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Удалить obs_005" }));

    expect(screen.getByText("Наблюдение obs_005 удалено")).toBeInTheDocument();
    expect(
      screen.queryByText("obs_005", { selector: "td" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Сводка" }));
    expect(
      within(
        screen.getByRole("region", { name: "Сводка наблюдений" }),
      ).getByText("3", {
        selector: "dd",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Наблюдения" }));
    await user.click(
      screen.getByRole("button", { name: "Отменить удаление obs_005" }),
    );
    expect(screen.getByText("obs_005", { selector: "td" })).toBeInTheDocument();
  });

  it("validates add fields, creates an immutable id, and restores data on remount", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Добавить наблюдение" }),
    );
    const editor = screen.getByRole("region", { name: "Новое наблюдение" });
    expect(within(editor).getByRole("textbox", { name: "Лиса" })).toHaveFocus();

    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );
    expect(within(editor).getByRole("alert")).toHaveTextContent("Проверьте");

    await user.type(
      within(editor).getByRole("textbox", { name: "Лиса" }),
      "fox_005",
    );
    await user.type(
      within(editor).getByRole("combobox", { name: "Локация" }),
      "Речной берег",
    );
    await user.type(
      within(editor).getByRole("combobox", { name: "Цвет" }),
      "белая",
    );
    await user.click(within(editor).getByRole("radio", { name: "Нет" }));
    await user.type(
      within(editor).getByRole("spinbutton", {
        name: "Оценка подозрительности",
      }),
      "6",
    );
    fireEvent.change(within(editor).getByLabelText("Время"), {
      target: { value: "13:45" },
    });
    await user.click(
      within(editor).getByRole("button", { name: "Сохранить наблюдение" }),
    );

    const generatedId = "obs_123e4567-e89b-12d3-a456-426614174000";
    expect(
      screen.getByText(generatedId, { selector: "td" }),
    ).toBeInTheDocument();

    firstRender.unmount();
    render(<App />);
    expect(
      screen.getByText(generatedId, { selector: "td" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Сохранено в этом браузере")).toBeInTheDocument();
  });
});
