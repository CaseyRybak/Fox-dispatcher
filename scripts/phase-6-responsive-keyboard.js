async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const viewportResults = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const activeName = () =>
    page.evaluate(() => {
      const active = globalThis.document.activeElement;
      return (
        active?.getAttribute("aria-label") || active?.textContent?.trim() || ""
      );
    });
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

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  for (const viewport of [
    { height: 900, name: "desktop", width: 1440 },
    { height: 1024, name: "tablet", width: 768 },
    { height: 844, name: "mobile", width: 390 },
    { height: 800, name: "reflow", width: 320 },
    { height: 390, name: "landscape", width: 844 },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto(`${baseUrl}/#observations`);
    await page.evaluate(() => globalThis.localStorage.clear());
    await page.reload();
    await assertNoPageOverflow(viewport.name);

    const mobileLedger = viewport.width <= 767;
    assert(
      (await page.getByRole(mobileLedger ? "list" : "table").count()) > 0,
      `${viewport.name} did not expose the expected observation ledger.`,
    );
    if (mobileLedger) {
      assert(
        (await page
          .getByRole("list", { name: "Наблюдения текущей выборки" })
          .getByRole("listitem")
          .count()) === 5,
        `${viewport.name} card ledger does not contain five starter records.`,
      );
    }
    await page.screenshot({
      fullPage: true,
      path: `output/playwright/phase-6/observations-${viewport.name}-${viewport.width}px.png`,
    });
    viewportResults.push({ ...viewport, mobileLedger });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/#observations`);
  const middleEdit = page.getByRole("button", { name: "Изменить obs_003" });
  await middleEdit.scrollIntoViewIfNeeded();
  await middleEdit.focus();
  const focusAndDock = await middleEdit.evaluate((element) => {
    const focusRect = element.getBoundingClientRect();
    const dockRect = globalThis.document
      .querySelector(".primary-nav")
      ?.getBoundingClientRect();
    return {
      focusBottom: focusRect.bottom,
      dockTop: dockRect?.top ?? globalThis.innerHeight,
    };
  });
  assert(
    focusAndDock.focusBottom <= focusAndDock.dockTop,
    `The mobile navigation obscures focused ledger actions: ${JSON.stringify(focusAndDock)}.`,
  );
  await page.getByRole("link", { name: "Перейти к содержанию" }).focus();
  await page.keyboard.press("Enter");
  assert(
    await page
      .locator("#main-content")
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "The skip link did not focus main content.",
  );

  await page.getByRole("button", { name: "Добавить наблюдение" }).focus();
  await page.keyboard.press("Enter");
  const editor = page.getByRole("dialog", { name: "Новое наблюдение" });
  await editor.waitFor();
  await editor.screenshot({
    path: "output/playwright/phase-6/observation-editor-mobile-390px.png",
  });
  assert(
    await editor
      .getByRole("textbox", { name: "Лиса" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "The editor did not focus its first field.",
  );
  await page.keyboard.type("черновик");
  await page.goBack();
  const discard = page.getByRole("alertdialog", {
    name: "Отменить несохранённые изменения?",
  });
  await discard.waitFor();
  const safeDiscardAction = discard.getByRole("button", {
    name: "Продолжить редактирование",
  });
  assert(
    await safeDiscardAction.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Discard confirmation did not focus the safe action.",
  );
  await page.keyboard.press("Shift+Tab");
  assert(
    (await activeName()).includes("Отменить изменения"),
    "Discard confirmation did not wrap focus backwards.",
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  assert(
    await editor
      .getByRole("textbox", { name: "Лиса" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Escape did not return from confirmation to the editor.",
  );
  await page.keyboard.press("Escape");
  await discard.getByRole("button", { name: "Отменить изменения" }).click();
  assert(
    await page
      .getByRole("button", { name: "Добавить наблюдение" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Closing the editor did not restore trigger focus.",
  );

  await page.getByRole("button", { name: "Вернуть стартовые данные" }).click();
  const reset = page.getByRole("alertdialog", {
    name: "Вернуть стартовые данные?",
  });
  await reset.waitFor();
  assert(
    await reset
      .getByRole("button", { name: "Оставить текущие данные" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Reset confirmation did not focus the safe action.",
  );
  await page.keyboard.press("Escape");
  assert(
    await page
      .getByRole("button", { name: "Вернуть стартовые данные" })
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "Reset confirmation did not restore trigger focus.",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotion = await page.evaluate(() => {
    const button = globalThis.document.querySelector("button");
    return {
      scrollBehavior: globalThis.getComputedStyle(
        globalThis.document.documentElement,
      ).scrollBehavior,
      transitionDuration: button
        ? globalThis.getComputedStyle(button).transitionDuration
        : "",
    };
  });
  assert(
    reducedMotion.scrollBehavior === "auto" &&
      Number.parseFloat(reducedMotion.transitionDuration) <= 0.00001,
    `Reduced motion is not applied: ${JSON.stringify(reducedMotion)}`,
  );

  await page.addStyleTag({
    content: `
      * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }
    `,
  });
  await assertNoPageOverflow("WCAG text spacing at 390px");
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-6/text-spacing-390px.png",
  });

  await page.setViewportSize({ width: 720, height: 900 });
  await page.goto(`${baseUrl}/#summary`);
  await assertNoPageOverflow("200% zoom equivalent reflow");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  assert(
    await page.getByRole("slider", { name: "Влияние добычи" }).isVisible(),
    "The primary control was lost at 200% page scale.",
  );
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-6/summary-200-percent-reflow.png",
  });
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

  await page.emulateMedia({ forcedColors: "active" });
  assert(
    await page.evaluate(
      () => globalThis.matchMedia("(forced-colors: active)").matches,
    ),
    "Forced-colors preference was not active in the browser.",
  );
  await page.getByRole("link", { name: "Наблюдения", exact: true }).focus();
  await page.screenshot({
    path: "output/playwright/phase-6/forced-colors-summary.png",
  });
  await page.emulateMedia({ forcedColors: "none" });

  const accessibilityTree = await page.locator("body").ariaSnapshot();
  assert(
    accessibilityTree.includes('navigation "Основная навигация"') &&
      accessibilityTree.includes('heading "Сводка наблюдений"') &&
      accessibilityTree.includes('slider "Влияние добычи"'),
    `The browser accessibility tree is missing the primary journey: ${accessibilityTree}`,
  );

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    browserErrors: browserErrors.length,
    keyboard: "skip, editor, discard, reset",
    reducedMotion,
    screenReaderProxy: "Chromium accessibility tree",
    viewportResults,
  };
};
