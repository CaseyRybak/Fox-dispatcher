async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };
  const waitForDestination = async ({
    expectFocus = true,
    hash,
    heading,
    link,
    title,
  }) => {
    const destinationHeading = page.getByRole("heading", {
      level: 1,
      name: heading,
    });

    await destinationHeading.waitFor();
    await page.waitForFunction(
      ({ expectedHash, expectedTitle }) =>
        globalThis.location.hash === expectedHash &&
        globalThis.document.title === expectedTitle,
      { expectedHash: hash, expectedTitle: title },
    );
    const headingHasFocus = await destinationHeading.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    );
    assert(
      headingHasFocus === expectFocus,
      expectFocus
        ? `The ${heading} heading did not receive route focus.`
        : `The ${heading} heading received focus on initial load.`,
    );
    assert(
      (await page
        .getByRole("link", { name: link, exact: true })
        .getAttribute("aria-current")) === "page",
      `The ${link} link is not marked as current.`,
    );
  };
  const assertNoPageOverflow = async (destination) => {
    const widths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    }));

    assert(
      widths.body <= widths.viewport && widths.document <= widths.viewport,
      `${destination} overflows the ${widths.viewport}px viewport: ${JSON.stringify(widths)}.`,
    );
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/#summary`);
  await waitForDestination({
    expectFocus: false,
    hash: "#summary",
    heading: "Самая подозрительная лиса",
    link: "Сводка",
    title: "Сводка — Лисий диспетчер",
  });
  assert(
    (await page.locator("html").getAttribute("lang")) === "ru",
    "The document language is not Russian.",
  );
  assert(
    (await page.getByText("Оценка 80% · добыча 20%").count()) === 0,
    "The removed header formula status is still visible.",
  );
  assert(
    (await page.getByRole("region", { name: "Состояние данных" }).count()) ===
      0,
    "The healthy persistence status is still visible on Summary.",
  );

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  await waitForDestination({
    hash: "#observations",
    heading: "Параметры",
    link: "Параметры",
    title: "Параметры — Лисий диспетчер",
  });
  assert(
    (await page.locator("tbody tr").count()) === 5,
    "The starter table does not contain exactly five observations.",
  );
  const foxIds = await page
    .locator("tbody tr td:nth-child(3)")
    .allTextContents();
  assert(
    new Set(foxIds).size === 4,
    "The starter table does not contain exactly four unique foxes.",
  );

  const hashBeforeSkipLink = await page.evaluate(
    () => globalThis.location.hash,
  );
  const skipLink = page.getByRole("link", { name: "Перейти к содержанию" });
  await skipLink.focus();
  await page.keyboard.press("Enter");
  assert(
    (await page.evaluate(() => globalThis.location.hash)) ===
      hashBeforeSkipLink,
    "The skip link changed the active destination.",
  );
  assert(
    await page
      .locator("main")
      .evaluate((element) => element === element.ownerDocument.activeElement),
    "The skip link did not focus the main content.",
  );

  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();
  await waitForDestination({
    hash: "#worklog",
    heading: "AI Worklog",
    link: "AI Worklog",
    title: "AI Worklog — Лисий диспетчер",
  });

  await page.goBack();
  await waitForDestination({
    hash: "#observations",
    heading: "Параметры",
    link: "Параметры",
    title: "Параметры — Лисий диспетчер",
  });
  await page.goForward();
  await waitForDestination({
    hash: "#worklog",
    heading: "AI Worklog",
    link: "AI Worklog",
    title: "AI Worklog — Лисий диспетчер",
  });

  await page.setViewportSize({ width: 320, height: 800 });
  for (const [hash, destination] of [
    ["summary", "Summary"],
    ["observations", "Observations"],
    ["worklog", "AI Worklog"],
  ]) {
    await page.goto(`${baseUrl}/#${hash}`);
    await page.locator("main h1").waitFor();
    await assertNoPageOverflow(destination);
  }

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    consoleErrors: browserErrors.length,
    destinations: ["summary", "observations", "worklog"],
    observations: 5,
    uniqueFoxes: 4,
    viewport: 320,
  };
};
