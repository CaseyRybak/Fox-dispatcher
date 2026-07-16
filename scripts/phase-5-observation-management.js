async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const assertNoPageOverflow = async () => {
    const widths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    }));
    assert(
      widths.body <= widths.viewport && widths.document <= widths.viewport,
      `Observation management overflows the ${widths.viewport}px viewport: ${JSON.stringify(widths)}.`,
    );
  };

  page.on("console", (message) => {
    if (message.type() === "error")
      browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/#observations`);
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Изменить obs_005" }).click();
  const editor = page.getByRole("region", {
    name: "Изменить наблюдение obs_005",
  });
  await editor
    .getByRole("spinbutton", { name: "Оценка подозрительности" })
    .fill("10");
  await editor.getByRole("button", { name: "Сохранить наблюдение" }).click();
  const editedAction = page.getByRole("button", { name: "Изменить obs_005" });
  assert(
    await editedAction.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Edit action did not regain focus after save.",
  );

  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  const summary = page.getByRole("region", { name: "Сводка наблюдений" });
  await summary.getByRole("heading", { level: 2, name: "fox_004" }).waitFor();
  assert(
    (await summary.getByText("8,0 из 10").count()) === 1,
    "Editing obs_005 to 10 did not produce the 8.0 fox_004 leader.",
  );

  await page.getByRole("link", { name: "Наблюдения", exact: true }).click();
  await page.getByRole("button", { name: "Удалить obs_005" }).click();
  await page.getByText("Наблюдение obs_005 удалено", { exact: true }).waitFor();
  const neighbor = page.getByRole("button", { name: "Изменить obs_004" });
  assert(
    await neighbor.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Focus did not move to the logical neighboring record after delete.",
  );

  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  const uniqueFoxMetric = summary
    .locator(".metric-ledger__item")
    .filter({ hasText: "Уникальные лисы" });
  assert(
    (await uniqueFoxMetric.locator("dd").innerText()).trim() === "3",
    "Deleting the only fox_004 record did not reduce unique foxes to 3.",
  );

  await page.getByRole("link", { name: "Наблюдения", exact: true }).click();
  await page.getByRole("button", { name: "Отменить удаление obs_005" }).click();
  const restoredAction = page.getByRole("button", { name: "Изменить obs_005" });
  await restoredAction.waitFor();
  assert(
    await restoredAction.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Restored observation action did not regain focus after undo.",
  );
  await page
    .getByRole("status")
    .getByText(/Удаление obs_005 отменено\./)
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Изменить obs_005" }).click();
  assert(
    (await editor
      .getByRole("spinbutton", { name: "Оценка подозрительности" })
      .inputValue()) === "10",
    "The accepted edit was not restored from local storage after reload.",
  );
  await editor.getByRole("button", { name: "Отменить" }).click();

  await page.screenshot({
    path: "output/playwright/phase-5/observation-management-1440px.png",
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await assertNoPageOverflow();
  await page.getByRole("button", { name: "Изменить obs_005" }).click();
  const mobileEditor = page.getByRole("region", {
    name: "Изменить наблюдение obs_005",
  });
  await mobileEditor.scrollIntoViewIfNeeded();
  await assertNoPageOverflow();
  await mobileEditor.screenshot({
    path: "output/playwright/phase-5/observation-editor-320px.png",
  });

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    consoleErrors: browserErrors.length,
    leader: "fox_004",
    persistedSuspicion: 10,
    score: "8.0",
    viewport: 320,
  };
};
