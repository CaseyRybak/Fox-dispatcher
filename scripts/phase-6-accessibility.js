async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const scans = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  const scan = async (name) => {
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    const result = await page.evaluate(async () =>
      globalThis.axe.run(globalThis.document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      }),
    );
    scans.push({ name, violations: result.violations.length });
    assert(
      result.violations.length === 0,
      `${name} has axe violations:\n${result.violations
        .map(
          ({ help, id, nodes }) =>
            `${id}: ${help} (${nodes.length})\n${nodes
              .map(
                ({ failureSummary, target }) =>
                  `  ${target.join(" ")}: ${failureSummary}`,
              )
              .join("\n")}`,
        )
        .join("\n")}`,
    );
  };

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/#summary`);
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
  await scan("summary desktop");

  await page.getByRole("link", { name: "Наблюдения", exact: true }).click();
  await scan("observations desktop");
  await page.getByRole("button", { name: "Добавить наблюдение" }).click();
  await page.getByRole("dialog", { name: "Новое наблюдение" }).waitFor();
  await scan("observation editor dialog");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Вернуть стартовые данные" }).click();
  await page
    .getByRole("alertdialog", { name: "Вернуть стартовые данные?" })
    .waitFor();
  await scan("starter reset dialog");
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();
  await scan("AI Worklog desktop");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Наблюдения", exact: true }).click();
  await page
    .getByRole("list", { name: "Наблюдения текущей выборки" })
    .waitFor();
  await scan("observations mobile cards");

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return { browserErrors: browserErrors.length, scans };
};
