import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const expectedConfiguration = {
  buildCommand: "npm run build",
  framework: "vite",
  installCommand: "npm ci",
  outputDirectory: "dist",
};
const expectedHeaders = new Map([
  [
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; media-src 'none'; worker-src 'none'",
  ],
  ["referrer-policy", "no-referrer"],
  ["x-content-type-options", "nosniff"],
  [
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  ],
]);
const configuration = JSON.parse(await readFile("vercel.json", "utf8"));
const failures = [];

for (const [key, expected] of Object.entries(expectedConfiguration)) {
  if (configuration[key] !== expected) {
    failures.push(`vercel.json ${key} must be ${JSON.stringify(expected)}.`);
  }
}

const rootHeaderRules = configuration.headers?.filter(
  ({ source }) => source === "/(.*)",
);

if (rootHeaderRules?.length !== 1) {
  failures.push("vercel.json must contain exactly one /(.*) header rule.");
} else {
  const actualHeaders = new Map(
    rootHeaderRules[0].headers.map(({ key, value }) => [
      key.toLowerCase(),
      value,
    ]),
  );

  for (const [key, expected] of expectedHeaders) {
    if (actualHeaders.get(key) !== expected) {
      failures.push(
        `Deployment header ${key} does not match the release policy.`,
      );
    }
  }

  for (const key of actualHeaders.keys()) {
    if (!expectedHeaders.has(key)) {
      failures.push(`Unexpected deployment header in vercel.json: ${key}.`);
    }
  }
}

const productionFiles = await collectFiles("dist");
const sourceMaps = productionFiles.filter((file) => file.endsWith(".map"));
if (sourceMaps.length > 0) {
  failures.push(
    `Production bundle contains source maps: ${sourceMaps.join(", ")}.`,
  );
}

const indexHtml = await readFile("dist/index.html", "utf8");
const releaseMeta = [...indexHtml.matchAll(/<meta\b[^>]*>/gu)]
  .map(([tag]) => tag)
  .find((tag) => /\bname="fox-dispatcher-revision"/u.test(tag));
const releaseRevision = releaseMeta?.match(/\bcontent="([^"]+)"/u)?.[1];
if (!releaseRevision || !/^(?:local|[0-9a-f]{40})$/u.test(releaseRevision)) {
  failures.push(
    "Production HTML must identify a local or 40-character Git release revision.",
  );
}

for (const match of indexHtml.matchAll(
  /<(?:link|script)\b[^>]+(?:href|src)="([^"]+)"/gu,
)) {
  const resource = match[1];
  if (!resource?.startsWith("/") || resource.startsWith("//")) {
    failures.push(
      `Production HTML contains a non-local resource: ${resource}.`,
    );
  }
}

for (const file of productionFiles.filter((candidate) =>
  /\.css$/u.test(candidate),
)) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(/url\(([^)]+)\)/gu)) {
    const resource = match[1]?.trim().replace(/^["']|["']$/gu, "");
    if (
      resource &&
      !resource.startsWith("data:") &&
      (!resource.startsWith("/") || resource.startsWith("//"))
    ) {
      failures.push(
        `Production CSS contains a non-local resource: ${resource}.`,
      );
    }
  }
}

const artifactPatterns = [
  [
    "private home path",
    /(?:^|["'\s])(?:\/(?:home|Users)\/|[A-Za-z]:\\(?:Users|Documents and Settings)\\)/iu,
  ],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
  ["GitHub token", /(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+/u],
  ["AI API key", /sk-[A-Za-z0-9_-]{20,}/u],
  ["AWS access key", /AKIA[0-9A-Z]{16}/u],
  ["inline source map", /sourceMappingURL=data:/u],
  ["debugger statement", /\bdebugger\b/u],
];
for (const file of productionFiles.filter((candidate) =>
  /\.(?:css|html|js|svg|txt)$/u.test(candidate),
)) {
  const content = await readFile(file, "utf8");
  for (const [label, pattern] of artifactPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file} contains a ${label}.`);
    }
  }
}

const productionSources = await collectFiles("src");
for (const file of productionSources.filter((candidate) =>
  /\.(?:css|ts|tsx)$/u.test(candidate),
)) {
  const content = await readFile(file, "utf8");
  for (const [label, pattern] of [
    ["XMLHttpRequest", /\bXMLHttpRequest\b/u],
    ["WebSocket", /\bWebSocket\b/u],
    ["EventSource", /\bEventSource\b/u],
    ["WebTransport", /\bWebTransport\b/u],
    ["sendBeacon", /\bsendBeacon\b/u],
    ["runtime fetch", /\bfetch\s*\(/u],
  ]) {
    if (pattern.test(content)) {
      failures.push(`${file} contains an unapproved ${label} channel.`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Deployment policy check failed:\n${failures
      .map((failure) => `- ${failure}`)
      .join("\n")}`,
  );
}

console.log(
  `Deployment policy check passed: ${expectedHeaders.size} headers, ${productionFiles.length} production files, release revision ${releaseRevision}, no source maps, external runtime resources, high-signal secrets/debug artifacts, or observation-egress APIs.`,
);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat();
}
