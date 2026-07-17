async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };
  const scopeLabel = () => page.getByText(/Показано лис: \d+ из 4/);
  const assertScope = async (expected) => {
    await page.getByText(expected, { exact: true }).waitFor();
    assert(
      (await scopeLabel().textContent()) === expected,
      `Expected scope "${expected}", received "${await scopeLabel().textContent()}".`,
    );
  };
  const assertFilterAnnouncement = async (expected) => {
    const status = page.getByRole("status");
    const message = await status.textContent();

    assert(
      message?.startsWith(expected),
      `Expected filter announcement starting with "${expected}", received "${message}".`,
    );
  };
  const resetFilters = async () => {
    const reset = page.getByRole("button", { name: "Сбросить всё" });
    if (await reset.count()) {
      await reset.click();
    }
    await assertScope("Показано лис: 4 из 4");
  };
  const assertNoPageOverflow = async () => {
    const widths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    }));

    assert(
      widths.body <= widths.viewport && widths.document <= widths.viewport,
      `Summary overflows the ${widths.viewport}px viewport: ${JSON.stringify(widths)}.`,
    );
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/#summary`);
  await page
    .getByRole("heading", { level: 1, name: "Самая подозрительная лиса" })
    .waitFor();
  await assertScope("Показано лис: 4 из 4");
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-3/desktop-summary-1440px.png",
  });

  for (const [foxId, score] of [
    ["Лиса 1", "7,8"],
    ["Лиса 3", "7,6"],
    ["Лиса 2", "4,0"],
    ["Лиса 4", "2,4"],
  ]) {
    const rankingButton = page.getByRole("button", {
      name: new RegExp(`^Показать расчёт: ${foxId}, индекс ${score}`),
    });

    await rankingButton.focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("complementary", {
        name: `Расчёт: ${foxId}`,
      })
      .waitFor();
    assert(
      (await rankingButton.getAttribute("aria-pressed")) === "true",
      `${foxId} was not selected.`,
    );
  }

  const fox002 = page.getByRole("button", {
    name: /^Показать расчёт: Лиса 2, индекс 4,0/,
  });
  await fox002.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("complementary", { name: "Расчёт: Лиса 2" }).waitFor();
  assert(
    (await fox002.getAttribute("aria-pressed")) === "true",
    "fox_002 was not selected.",
  );

  const exactWeight = page.getByRole("spinbutton", {
    name: "Влияние добычи, точное значение",
  });
  await exactWeight.fill("30");
  await page.keyboard.press("Tab");
  await page
    .getByRole("heading", { level: 2, name: "Лиса 3" })
    .first()
    .waitFor();
  await page.getByRole("complementary", { name: "Расчёт: Лиса 2" }).waitFor();

  const foxSearch = page.getByRole("searchbox", { name: "Найти лису" });
  await foxSearch.fill("fox_001");
  await assertScope("Показано лис: 1 из 4");
  await assertFilterAnnouncement("Фильтры применены: 1 лис из 4.");
  await resetFilters();

  await foxSearch.fill("Лиса 1");
  await assertScope("Показано лис: 1 из 4");
  await assertFilterAnnouncement("Фильтры применены: 1 лис из 4.");
  await resetFilters();

  const location = page.getByRole("combobox", { name: "Локация" });
  await location.selectOption("Северная поляна");
  await assertScope("Показано лис: 2 из 4");
  await assertFilterAnnouncement("Фильтры применены: 2 лис из 4.");
  assert(
    (await page
      .getByRole("list", { name: "Рейтинг подозрительности" })
      .getByRole("listitem")
      .count()) === 2,
    "North Clearing did not produce exactly two foxes.",
  );
  await resetFilters();

  const color = page.getByRole("combobox", { name: "Цвет" });
  await color.selectOption("серебристая");
  await assertScope("Показано лис: 1 из 4");
  await assertFilterAnnouncement("Фильтры применены: 1 лис из 4.");
  await resetFilters();

  await page.getByRole("radio", { name: "Есть" }).click();
  await assertScope("Показано лис: 2 из 4");
  await assertFilterAnnouncement("Фильтры применены: 2 лис из 4.");
  await resetFilters();

  await foxSearch.fill("fox_001");
  await location.selectOption("Северная поляна");
  await color.selectOption("рыжая");
  await page.getByRole("radio", { name: "Нет" }).click();
  await assertScope("Показано лис: 1 из 4");
  assert(
    (await page.getByRole("status").textContent()) ===
      "Фильтры применены: 1 лис из 4.",
    "The combined filter did not produce one atomic scope announcement.",
  );

  const locationChip = page.getByRole("button", {
    name: "Удалить фильтр Локация: Северная поляна",
  });
  await locationChip.click();
  assert(
    await page
      .getByRole("button", { name: "Удалить фильтр Цвет: рыжая" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Chip removal did not focus the next filter.",
  );

  await resetFilters();
  await foxSearch.fill("missing");
  await page
    .getByRole("heading", { name: "В этой выборке ничего не найдено" })
    .waitFor();
  await assertScope("Показано лис: 0 из 4");
  assert(
    await foxSearch.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "The zero-result filter moved focus away from its control.",
  );
  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Наблюдения" }).waitFor();
  await page
    .getByRole("heading", { name: "В этой выборке ничего не найдено" })
    .waitFor();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  const restoredCaption = page.getByText("Всего наблюдений: 5", {
    exact: true,
    selector: "caption",
  });
  await restoredCaption.waitFor();
  assert(
    await restoredCaption.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Resetting the empty Observations ledger did not focus its restored scope.",
  );
  assert(
    (await page.locator("tbody tr").count()) === 5,
    "The empty Observations ledger did not recover all five records after reset.",
  );
  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  await page
    .getByRole("heading", { level: 1, name: "Самая подозрительная лиса" })
    .waitFor();

  await page
    .getByRole("combobox", { name: "Локация" })
    .selectOption("Северная поляна");
  await assertScope("Показано лис: 2 из 4");
  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Наблюдения" }).waitFor();
  assert(
    (await page.locator("caption").textContent()) === "Всего наблюдений: 3",
    "The Observations destination did not preserve report scope.",
  );
  assert(
    (await page.locator("tbody tr").count()) === 3,
    "The scoped observation ledger did not contain three records.",
  );

  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  await page
    .getByRole("heading", { level: 1, name: "Самая подозрительная лиса" })
    .waitFor();
  await resetFilters();
  await page.setViewportSize({ width: 320, height: 800 });
  await assertNoPageOverflow();
  await page.getByRole("complementary", { name: "Расчёт: Лиса 1" }).waitFor();
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-3/mobile-summary-320px.png",
  });

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    combinedFilterCount: 1,
    consoleErrors: browserErrors.length,
    northClearing: { foxes: 2, observations: 3 },
    selectionPreservedAtWeight: 30,
    viewport: 320,
  };
};
