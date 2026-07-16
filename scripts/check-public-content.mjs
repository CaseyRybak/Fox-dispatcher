import { readFile } from "node:fs/promises";

const publicFiles = ["README.md", "docs/ai-worklog/public-checkpoints.json"];
const forbiddenPatterns = [
  {
    label: "private Unix home path",
    pattern: /(?:^|["'\s])\/(?:home|Users)\//i,
  },
  {
    label: "private Windows home path",
    pattern: /(?:^|["'\s])[A-Za-z]:\\(?:Users|Documents and Settings)\\/i,
  },
  {
    label: "private file URL",
    pattern: /file:\/\/\/(?:[A-Za-z]:\/|(?:home|Users)\/)/i,
  },
  { label: "private WSL path", pattern: /\\\\wsl\$/i },
  {
    label: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { label: "GitHub token", pattern: /(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+/ },
  { label: "AI API key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { label: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  {
    label: "raw transcript role",
    pattern: /(?:<|\b)(?:user|assistant|system)(?:>|\s*:)/i,
  },
];
const failures = [];

for (const file of publicFiles) {
  const content = await readFile(file, "utf8");

  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: ${label}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Public-content safety check failed:\n${failures
      .map((failure) => `- ${failure}`)
      .join("\n")}`,
  );
}

console.log(
  `Public-content safety check passed: ${publicFiles.length} public artifacts, ${forbiddenPatterns.length} prohibited patterns.`,
);
