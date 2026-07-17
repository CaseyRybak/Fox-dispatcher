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
    (await checkpoints.count()) === 7,
    "Worklog did not render seven checkpoints.",
  );

  const links = timeline.getByRole("link");
  assert(
    (await links.count()) === 14,
    "Worklog does not expose the 14 accepted evidence links.",
  );
  for (const link of await links.all()) {
    const href = await link.getAttribute("href");
    assert(
      /^https:\/\/github\.com\/CaseyRybak\/Fox-dispatcher\/blob\/[0-9a-f]{40}\//.test(
        href ?? "",
      ),
      `Evidence link is not revision-pinned: ${href}.`,
    );
    assert(
      (await link.getAttribute("target")) === "_blank",
      "Evidence link does not open in a separate tab.",
    );
    assert(
      (await link.getAttribute("rel")) === "noreferrer",
      "Evidence link does not protect the opener/referrer boundary.",
    );
    assert(
      /откроется в новой вкладке/i.test(
        (await link.getAttribute("aria-label")) ?? "",
      ) || /откроется в новой вкладке/i.test((await link.textContent()) ?? ""),
      "Evidence link does not disclose that it opens a new tab.",
    );
  }

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
    evidenceLinks: await links.count(),
    viewport: 320,
  };
};
