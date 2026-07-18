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
  const editor = page.getByRole("dialog", {
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
  const summary = page.getByRole("region", {
    name: "Самая подозрительная лиса",
  });
  await summary.getByRole("heading", { level: 2, name: "Лиса 4" }).waitFor();
  assert(
    (await summary.getByText("8,0 из 10").count()) === 1,
    "Editing obs_005 to 10 did not produce the 8.0 fox_004 leader.",
  );

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
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

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
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

  const addObservation = async ({
    expectedExistingColor,
    foxName,
    suspicion = "6",
    time,
  }) => {
    await page.getByRole("button", { name: "Добавить наблюдение" }).click();
    const addEditor = page.getByRole("dialog", { name: "Новое наблюдение" });
    await addEditor.getByRole("combobox", { name: "Имя лисы" }).fill(foxName);
    await addEditor
      .getByRole("combobox", { name: "Локация" })
      .fill("Речной берег");
    const colorField = addEditor.getByRole("combobox", { name: "Цвет" });
    if (expectedExistingColor) {
      assert(
        (await colorField.inputValue()) === expectedExistingColor &&
          (await colorField.getAttribute("readonly")) !== null,
        `Existing ${foxName} did not lock color ${expectedExistingColor}.`,
      );
      await addEditor
        .getByRole("status")
        .getByText(`Для данной лисы уже задан цвет ${expectedExistingColor}`)
        .waitFor();
    } else {
      await colorField.fill("белая");
    }
    await addEditor.getByRole("radio", { name: "Нет" }).check();
    await addEditor
      .getByRole("spinbutton", { name: "Оценка подозрительности" })
      .fill(suspicion);
    await addEditor.getByLabel("Время").fill(time);
    await addEditor
      .getByRole("button", { name: "Сохранить наблюдение" })
      .click();
  };

  await addObservation({ foxName: "Лиса 5", time: "13:45" });
  const firstGeneratedRow = page
    .getByRole("row")
    .filter({ hasText: "obs_006" });
  await firstGeneratedRow.waitFor();
  assert(
    (await firstGeneratedRow.innerText()).includes("Лиса 5") &&
      (await firstGeneratedRow.innerText()).includes("fox_005"),
    "A new fox name did not receive fox_005 and obs_006.",
  );

  await addObservation({
    expectedExistingColor: "белая",
    foxName: "лиса 5",
    time: "14:00",
  });
  const secondGeneratedRow = page
    .getByRole("row")
    .filter({ hasText: "obs_007" });
  await secondGeneratedRow.waitFor();
  assert(
    (await secondGeneratedRow.innerText()).includes("Лиса 5") &&
      (await secondGeneratedRow.innerText()).includes("fox_005"),
    "An existing fox name did not reuse fox_005 for obs_007.",
  );

  const persistedGeneratedObservations = await page.evaluate(() => {
    const raw = globalThis.localStorage.getItem("fox-dispatcher.dashboard");
    if (!raw) return [];
    return JSON.parse(raw).observations.filter(({ id }) =>
      ["obs_006", "obs_007"].includes(id),
    );
  });
  assert(
    persistedGeneratedObservations.length === 2 &&
      persistedGeneratedObservations.every(
        ({ color, fox_id: foxId, fox_name: foxName }) =>
          color === "белая" && foxId === "fox_005" && foxName === "Лиса 5",
      ),
    "Generated observation ids and the reused fox identity were not persisted.",
  );

  await addObservation({
    expectedExistingColor: "рыжая",
    foxName: "Лиса 1",
    suspicion: "5",
    time: "11:11",
  });
  const thirdFoxOneRow = page.getByRole("row").filter({ hasText: "obs_008" });
  await thirdFoxOneRow.waitFor();
  assert(
    (await thirdFoxOneRow.innerText()).includes("fox_001") &&
      (await thirdFoxOneRow.innerText()).includes("рыжая"),
    "A new observation for Лиса 1 did not reuse fox_001 and its original color.",
  );

  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  await page.getByRole("button", { name: /Показать расчёт: Лиса 1,/ }).click();
  const foxOneCalculation = page.getByRole("complementary", {
    name: "Расчёт: Лиса 1, идентификатор fox_001",
  });
  const foxOneCalculationText = await foxOneCalculation.innerText();
  assert(
    foxOneCalculationText.includes("5,9") &&
      foxOneCalculationText.includes("0,7") &&
      foxOneCalculationText.includes("=") &&
      !foxOneCalculationText.includes("≈") &&
      !foxOneCalculationText.includes("88/15") &&
      !foxOneCalculationText.includes("2/3"),
    `Repeating contributions leaked raw fractions: ${foxOneCalculationText}`,
  );

  await page.getByRole("link", { name: "Параметры", exact: true }).click();

  await page.screenshot({
    path: "output/playwright/phase-5/observation-management-1440px.png",
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await assertNoPageOverflow();
  await page.getByRole("button", { name: "Изменить obs_005" }).click();
  const mobileEditor = page.getByRole("dialog", {
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
    generatedFox: "fox_005",
    generatedObservations: ["obs_006", "obs_007", "obs_008"],
    persistedSuspicion: 10,
    score: "8.0",
    viewport: 320,
  };
};
