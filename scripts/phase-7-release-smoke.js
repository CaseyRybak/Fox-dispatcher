async (page) => {
  const baseUrl = "http://127.0.0.1:4173";
  const expectedRevision = "local";
  const expectedContentSecurityPolicy =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; media-src 'none'; worker-src 'none'";
  const browserErrors = [];
  const networkRequests = [];
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
  const normalizeContentSecurityPolicy = (value) =>
    value
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .sort()
      .join(";");
  const originOf = (value) => {
    const schemeSeparator = value.indexOf("://");
    const pathStart = value.indexOf("/", schemeSeparator + 3);
    return pathStart === -1 ? value : value.slice(0, pathStart);
  };
  const hasQuery = (value) => {
    const hashStart = value.indexOf("#");
    const queryStart = value.indexOf("?");
    return queryStart !== -1 && (hashStart === -1 || queryStart < hashStart);
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));
  page.on("request", (request) => {
    networkRequests.push({
      method: request.method(),
      postData: request.postData(),
      url: request.url(),
    });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const documentResponse = await page.goto(`${baseUrl}/#summary`);
  assert(
    documentResponse?.status() === 200,
    `The release document returned HTTP ${documentResponse?.status() ?? "no response"}.`,
  );
  assert(
    (await page
      .locator('meta[name="fox-dispatcher-revision"]')
      .getAttribute("content")) === expectedRevision,
    `The release document does not identify expected revision ${expectedRevision}.`,
  );
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  const expectedOrigin = originOf(baseUrl);
  const summary = page.getByRole("region", {
    name: "Самая подозрительная лиса",
  });
  await summary.getByRole("heading", { level: 2, name: "Лиса 1" }).waitFor();
  assert(
    (await summary.getByText("7,8 из 10").count()) === 1,
    "The deployed starter report does not show the 7.8 leader.",
  );

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  await page.getByRole("button", { name: "Изменить obs_005" }).waitFor();
  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "AI Worklog" }).waitFor();
  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  await summary.getByRole("heading", { level: 2, name: "Лиса 1" }).waitFor();
  await page.waitForLoadState("networkidle");
  const staticRequestUrls = new Set(networkRequests.map(({ url }) => url));

  const exactWeight = page.getByRole("spinbutton", {
    name: "Влияние добычи, точное значение",
  });
  await exactWeight.fill("30");
  await page.keyboard.press("Tab");
  await summary.getByRole("heading", { level: 2, name: "Лиса 3" }).waitFor();
  assert(
    (await summary.getByText("7,9 из 10").count()) === 1,
    "The deployed report did not recalculate the 30% leader.",
  );
  await exactWeight.fill("20");
  await page.keyboard.press("Tab");

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  await page.getByRole("button", { name: "Изменить obs_005" }).click();
  const editor = page.getByRole("dialog", {
    name: "Изменить наблюдение obs_005",
  });
  await editor
    .getByRole("spinbutton", { name: "Оценка подозрительности" })
    .fill("10");
  await page.waitForLoadState("networkidle");
  const requestCountBeforeMutation = networkRequests.length;
  await editor.getByRole("button", { name: "Сохранить наблюдение" }).click();
  await page.waitForLoadState("networkidle");
  assert(
    networkRequests.length === requestCountBeforeMutation,
    "Saving an observation created an unexpected network request.",
  );
  await page.getByRole("link", { name: "Сводка", exact: true }).click();
  await summary.getByRole("heading", { level: 2, name: "Лиса 4" }).waitFor();
  assert(
    (await summary.getByText("8,0 из 10").count()) === 1,
    "The deployed observation edit did not produce the 8.0 leader.",
  );
  await page.reload();
  await summary.getByRole("heading", { level: 2, name: "Лиса 4" }).waitFor();

  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "AI Worklog" }).waitFor();
  assert(
    (await page.locator(".worklog-entry").count()) === 7,
    "The deployed AI Worklog does not contain seven checkpoints.",
  );
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-7/production-worklog-1440px.png",
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${baseUrl}/#summary`);
  await summary.getByRole("heading", { level: 2, name: "Лиса 4" }).waitFor();
  await assertNoPageOverflow("Deployed Summary at 320px");
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/phase-7/production-summary-320px.png",
  });

  await page.getByRole("link", { name: "Параметры", exact: true }).click();
  const mobileEditButton = page.getByRole("button", {
    name: "Изменить obs_005",
  });
  await mobileEditButton.waitFor();
  await assertNoPageOverflow("Deployed Observations at 320px");
  await mobileEditButton.click();
  const mobileEditor = page.getByRole("dialog", {
    name: "Изменить наблюдение obs_005",
  });
  await mobileEditor.waitFor();
  await assertNoPageOverflow("Deployed observation editor at 320px");
  await page.keyboard.press("Escape");
  await mobileEditor.waitFor({ state: "hidden" });
  await page.getByRole("link", { name: "AI Worklog", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "AI Worklog" }).waitFor();
  assert(
    (await page.locator(".worklog-entry").count()) === 7,
    "The deployed mobile AI Worklog does not contain seven checkpoints.",
  );
  await assertNoPageOverflow("Deployed AI Worklog at 320px");

  const unexpectedRequests = networkRequests.filter(
    ({ method, postData, url }) => {
      return (
        originOf(url) !== expectedOrigin ||
        method !== "GET" ||
        postData !== null ||
        hasQuery(url) ||
        !staticRequestUrls.has(url)
      );
    },
  );
  assert(
    unexpectedRequests.length === 0,
    `The deployed product made requests outside its initial static GET allowlist: ${JSON.stringify(unexpectedRequests)}.`,
  );

  if (expectedOrigin.startsWith("https://")) {
    const headers = await documentResponse.allHeaders();
    assert(
      normalizeContentSecurityPolicy(
        headers["content-security-policy"] ?? "",
      ) === normalizeContentSecurityPolicy(expectedContentSecurityPolicy),
      "The deployed document Content-Security-Policy differs from the release policy.",
    );
    assert(
      headers["referrer-policy"] === "no-referrer" &&
        headers["x-content-type-options"] === "nosniff" &&
        headers["permissions-policy"] ===
          "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      "The deployed document is missing one or more privacy headers.",
    );
  }

  assert(
    browserErrors.length === 0,
    `Browser errors were recorded:\n${browserErrors.join("\n")}`,
  );

  return {
    browserErrors: browserErrors.length,
    headers: expectedOrigin.startsWith("https://") ? "verified" : "local-only",
    mobileRoutes: 3,
    persistedLeader: "Лиса 4, 8.0",
    releaseRevision: expectedRevision,
    requestOrigins: [
      ...new Set(networkRequests.map(({ url }) => originOf(url))),
    ],
    viewport: 320,
    worklogCheckpoints: 7,
  };
};
