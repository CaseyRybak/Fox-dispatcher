async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const browserErrors = [];
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };
  const assertNoPageOverflow = async () => {
    const widths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    }));

    assert(
      widths.body <= widths.viewport && widths.document <= widths.viewport,
      `Worklog overflows the ${widths.viewport}px viewport: ${JSON.stringify(widths)}.`,
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
  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();

  const heading = page.getByRole("heading", { level: 1, name: "AI Worklog" });
  await heading.waitFor();
  assert(
    await heading.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    ),
    "Worklog heading did not receive route focus.",
  );

  const timeline = page.getByRole("region", { name: "Хронология работы с AI" });
  const checkpoints = timeline.getByRole("article");
  assert(
    (await checkpoints.count()) === 6,
    "Worklog did not render six checkpoints.",
  );

  const links = timeline.getByRole("link");
  assert(
    (await links.count()) === 0,
    "Removed evidence links are still rendered in the Worklog.",
  );

  const publicText = await timeline.textContent();
  assert(
    !/(?:\/(?:home|Users)\/|[A-Za-z]:\\(?:Users|Documents and Settings)\\|file:\/\/\/|\\\\wsl\$|github_pat_|gh[pousr]_|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|(?:<|\b)(?:user|assistant|system)(?:>|\s*:))/i.test(
      publicText ?? "",
    ),
    "Private content reached the Worklog UI.",
  );

  await page.screenshot({
    path: "output/playwright/phase-4/worklog-1440px.png",
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await heading.waitFor();
  await page.locator(".site-header").waitFor();
  await assertNoPageOverflow();
  await page.screenshot({
    path: "output/playwright/phase-4/worklog-mobile-top-320px.png",
  });
  await checkpoints.last().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "output/playwright/phase-4/worklog-mobile-final-checkpoint-320px.png",
  });

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    checkpoints: await checkpoints.count(),
    consoleErrors: browserErrors.length,
    evidenceLinks: 0,
    viewport: 320,
  };
};
