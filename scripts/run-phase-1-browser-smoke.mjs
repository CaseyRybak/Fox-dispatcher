import { spawn, spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const vitePackageRoot = path.dirname(require.resolve("vite/package.json"));
const playwrightPackageRoot = path.dirname(
  require.resolve("@playwright/cli/package.json"),
);
const viteCli = path.join(vitePackageRoot, "bin", "vite.js");
const playwrightCli = path.join(playwrightPackageRoot, "playwright-cli.js");
const smokeProgramName = process.argv[2] ?? "phase-1-browser-smoke.js";
const allowedSmokePrograms = new Set([
  "phase-1-browser-smoke.js",
  "phase-3-summary-evidence.js",
]);

if (!allowedSmokePrograms.has(smokeProgramName)) {
  throw new Error(`Unknown browser smoke program: ${smokeProgramName}.`);
}

const smokeProgram = path.join(repositoryRoot, "scripts", smokeProgramName);
const smokeCode = readFileSync(smokeProgram, "utf8").trim().replace(/;$/, "");
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const session = `fox-${path.parse(smokeProgramName).name}-${process.pid}`;
const browserExecutable = findBrowserExecutable();
const browserConfig = browserExecutable
  ? path.join(tmpdir(), `${session}-config.json`)
  : undefined;
const playwrightEnvironment = {
  ...process.env,
  XDG_CACHE_HOME:
    process.env.XDG_CACHE_HOME ??
    path.join(tmpdir(), "fox-dispatcher-playwright-cache"),
};

if (browserConfig) {
  writeFileSync(
    browserConfig,
    JSON.stringify({
      browser: {
        launchOptions: {
          executablePath: browserExecutable,
          headless: true,
        },
      },
    }),
  );
}

function findBrowserExecutable() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  }

  for (const command of ["google-chrome", "chromium", "chromium-browser"]) {
    const lookup = spawnSync("which", [command], { encoding: "utf8" });
    if (lookup.status === 0 && lookup.stdout.trim()) {
      return lookup.stdout.trim();
    }
  }

  return undefined;
}

const preview = spawn(
  process.execPath,
  [
    viteCli,
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  {
    cwd: repositoryRoot,
    stdio: ["ignore", "inherit", "inherit"],
  },
);

async function waitForPreview() {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error(`Vite preview exited with code ${preview.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The preview server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Vite preview did not become ready at ${baseUrl}.`);
}

async function runPlaywright(arguments_) {
  await new Promise((resolve, reject) => {
    const command = spawn(process.execPath, [playwrightCli, ...arguments_], {
      cwd: repositoryRoot,
      env: playwrightEnvironment,
      stdio: "inherit",
    });

    command.once("error", reject);
    command.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `playwright-cli exited with ${signal ? `signal ${signal}` : `code ${code}`}.`,
        ),
      );
    });
  });
}

async function stopPreview() {
  if (preview.exitCode !== null) {
    return;
  }

  preview.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => preview.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);

  if (preview.exitCode === null) {
    preview.kill("SIGKILL");
  }
}

let sessionOpened = false;

try {
  await waitForPreview();
  await runPlaywright([
    "--session",
    session,
    "open",
    "about:blank",
    ...(browserConfig
      ? ["--config", browserConfig]
      : ["--browser", process.env.PLAYWRIGHT_BROWSER ?? "chrome"]),
  ]);
  sessionOpened = true;
  await runPlaywright(["--session", session, "run-code", smokeCode]);
} finally {
  if (sessionOpened) {
    await runPlaywright(["--session", session, "close"]);
  }
  await stopPreview();
  if (browserConfig) {
    unlinkSync(browserConfig);
  }
}
