async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const requestOrigins = new Set();
  const scans = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const assertNoPageOverflow = async (label) => {
    const widths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    }));
    assert(
      widths.body <= widths.viewport && widths.document <= widths.viewport,
      `${label} overflows: ${JSON.stringify(widths)}`,
    );
  };
  const scan = async (name) => {
    const result = await page.evaluate(async () =>
      globalThis.axe.run(globalThis.document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      }),
    );
    scans.push({ name, violations: result.violations.length });
    assert(
      result.violations.length === 0,
      `${name} has axe violations:\n${result.violations
        .map(({ help, id, nodes }) => `${id}: ${help} (${nodes.length})`)
        .join("\n")}`,
    );
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));
  page.on("request", (request) => {
    requestOrigins.add(request.url().split("/").slice(0, 3).join("/"));
  });

  // Init scripts run before the document's own scripts and remain compatible
  // with the production CSP, unlike injecting an inline script after load.
  await page.addInitScript({ path: "node_modules/axe-core/axe.min.js" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/#observations`);
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Импортировать JSON" }).click();
  const dialog = page.getByRole("dialog", { name: "Импорт наблюдений" });
  const source = dialog.getByRole("textbox", { name: "JSON наблюдений" });
  await source.fill(
    JSON.stringify([
      {
        id: "obs_bad",
        fox_id: "fox_009",
        location: "Речной берег",
        color: "белая",
        has_prey: false,
        suspicion_level: 11,
        time: "13:45",
      },
    ]),
  );
  await dialog.getByRole("button", { name: "Проверить данные" }).click();
  const error = dialog.getByRole("alert");
  await error.waitFor();
  assert(
    (await error.innerText()).includes("[0].suspicion_level"),
    "Invalid import did not expose the precise field path.",
  );
  assert(
    await error.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Import errors did not receive focus.",
  );
  assert(
    (await page.getByText("obs_005", { exact: true }).count()) > 0,
    "Invalid import changed the live journal.",
  );
  await scan("import validation error");

  const imported = [
    {
      id: "obs_101",
      fox_id: "fox_010",
      location: "Речной берег",
      color: "белая",
      has_prey: false,
      suspicion_level: 6,
      time: "13:45",
    },
    {
      id: "obs_102",
      fox_id: "fox_011",
      location: "Сосновая гряда",
      color: "рыжая",
      has_prey: true,
      suspicion_level: 8,
      time: "14:10",
    },
  ];
  await source.fill(JSON.stringify(imported));
  await dialog.getByRole("button", { name: "Проверить данные" }).click();
  const preview = dialog.getByRole("region", { name: "Предпросмотр импорта" });
  await preview.getByText("2 наблюдения", { exact: true }).waitFor();
  await scan("valid import preview");
  await dialog.screenshot({
    path: "output/playwright/phase-8/import-preview-1440px.png",
  });
  await dialog
    .getByRole("button", { name: "Заменить на 2 наблюдения" })
    .click();
  const reportCaption = page.getByText("Показано лис: 2 из 2", {
    exact: true,
  });
  await reportCaption.waitFor();
  assert(
    await reportCaption.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Accepted import did not focus the updated report scope.",
  );
  await page.reload();
  await page.getByText("obs_102", { exact: true }).waitFor();
  assert(
    (await page.getByText("obs_005", { exact: true }).count()) === 0,
    "Imported observations were not restored from browser storage.",
  );

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Экспортировать все наблюдения" }).click(),
  ]);
  assert(
    download.suggestedFilename() === "fox-dispatcher-observations.json",
    `Unexpected export name: ${download.suggestedFilename()}`,
  );

  const futureRaw = JSON.stringify({
    schemaVersion: 42,
    observations: [{ privateFutureField: "preserve exactly" }],
  });
  await page.evaluate(
    ({ raw }) =>
      globalThis.localStorage.setItem("fox-dispatcher.dashboard", raw),
    { raw: futureRaw },
  );
  await page.reload();
  const recovery = page.getByRole("region", {
    name: "Восстановление сохранённых данных",
  });
  await recovery.waitFor();
  await recovery
    .getByText("Показать сохранённый JSON", { exact: true })
    .click();
  const raw = recovery.getByRole("textbox", { name: "Сохранённое значение" });
  assert((await raw.inputValue()) === futureRaw, "Future storage was changed.");
  await recovery
    .getByRole("button", {
      name: "Выделить сохранённый JSON для копирования",
    })
    .click();
  assert(
    await raw.evaluate(
      (element) =>
        element === element.ownerDocument.activeElement &&
        element.selectionStart === 0 &&
        element.selectionEnd === element.value.length,
    ),
    "Recovery did not select the complete raw value.",
  );
  await scan("future-version recovery");
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-8/recovery-1440px.png",
  });
  await recovery
    .getByRole("button", {
      name: "Удалить сохранение и начать со стартовых данных",
    })
    .click();
  const reset = page.getByRole("alertdialog", {
    name: /Удалить (?:повреждённое сохранение|сохранение версии 42)\?/,
  });
  await reset
    .getByRole("button", {
      name: "Удалить сохранение и восстановить 5 наблюдений",
    })
    .click();
  await page.getByText("obs_005", { exact: true }).waitFor();
  assert(
    (await page
      .getByRole("region", { name: "Восстановление сохранённых данных" })
      .count()) === 0,
    "Confirmed recovery did not return to managed starter storage.",
  );

  await page.setViewportSize({ width: 320, height: 800 });
  const dataActionsToggle = page.getByRole("button", {
    name: "Показать управление данными",
  });
  try {
    await dataActionsToggle.waitFor({ timeout: 1_000 });
    await dataActionsToggle.click();
  } catch {
    // The published Phase 8 baseline predates the compact mobile disclosure.
  }
  await page.getByRole("button", { name: "Импортировать JSON" }).click();
  const mobileDialog = page.getByRole("dialog", { name: "Импорт наблюдений" });
  await mobileDialog.waitFor();
  assert(
    await mobileDialog
      .getByRole("textbox", { name: "JSON наблюдений" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Mobile import dialog did not focus its source field.",
  );
  await assertNoPageOverflow("Import dialog at 320px");
  await scan("import dialog at 320px");
  await page.screenshot({
    path: "output/playwright/phase-8/import-dialog-320px.png",
  });

  const unexpectedOrigins = [...requestOrigins].filter(
    (origin) => origin !== baseUrl,
  );
  assert(
    unexpectedOrigins.length === 0,
    `Import/export requested external origins: ${unexpectedOrigins.join(", ")}`,
  );
  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    axeScans: scans,
    browserErrors: browserErrors.length,
    exportedFile: download.suggestedFilename(),
    importedRecords: 2,
    recoveredStarterRecords: 5,
    requestOrigins: [...requestOrigins],
    viewport: 320,
  };
};
