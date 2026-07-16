import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const sourcePath = "docs/ai-worklog/public-checkpoints.json";
const checkpoints = JSON.parse(await readFile(sourcePath, "utf8"));
const checkpointKeys = [
  "aiContribution",
  "change",
  "date",
  "evidence",
  "goal",
  "humanDecision",
  "id",
  "stage",
  "verification",
];
const evidenceKeys = ["href", "kind", "label"];
const pinnedBlobPattern =
  /^https:\/\/github\.com\/CaseyRybak\/Fox-dispatcher\/blob\/([0-9a-f]{40})\/(.+)$/;
const failures = [];
const ids = new Set();
let evidenceCount = 0;

if (
  !Array.isArray(checkpoints) ||
  checkpoints.length < 5 ||
  checkpoints.length > 7
) {
  failures.push("Worklog must contain between 5 and 7 checkpoints.");
}

for (const [checkpointIndex, checkpoint] of checkpoints.entries()) {
  const actualKeys = Object.keys(checkpoint).sort();

  if (actualKeys.join("|") !== checkpointKeys.join("|")) {
    failures.push(
      `Checkpoint ${checkpointIndex + 1} does not match the public schema.`,
    );
    continue;
  }

  if (ids.has(checkpoint.id)) {
    failures.push(
      `Checkpoint ${checkpointIndex + 1} repeats id ${checkpoint.id}.`,
    );
  }
  ids.add(checkpoint.id);

  if (!Array.isArray(checkpoint.evidence) || checkpoint.evidence.length === 0) {
    failures.push(`Checkpoint ${checkpointIndex + 1} has no evidence.`);
    continue;
  }

  for (const [evidenceIndex, evidence] of checkpoint.evidence.entries()) {
    evidenceCount += 1;

    if (Object.keys(evidence).sort().join("|") !== evidenceKeys.join("|")) {
      failures.push(
        `Checkpoint ${checkpointIndex + 1}, evidence ${evidenceIndex + 1} does not match the public schema.`,
      );
      continue;
    }

    const match = evidence.href.match(pinnedBlobPattern);
    if (!match) {
      failures.push(
        `Checkpoint ${checkpointIndex + 1}, evidence ${evidenceIndex + 1} is not pinned to a repository revision.`,
      );
      continue;
    }

    const [, revision, encodedPath] = match;
    const repositoryPath = decodeURIComponent(encodedPath);

    if (repositoryPath.split("/").includes("..")) {
      failures.push(
        `Checkpoint ${checkpointIndex + 1}, evidence ${evidenceIndex + 1} contains an invalid path.`,
      );
      continue;
    }

    const result = spawnSync("git", [
      "cat-file",
      "-e",
      `${revision}:${repositoryPath}`,
    ]);
    if (result.status !== 0) {
      failures.push(
        `Checkpoint ${checkpointIndex + 1}, evidence ${evidenceIndex + 1} does not resolve in ${revision}.`,
      );
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Worklog link check failed:\n${failures
      .map((failure) => `- ${failure}`)
      .join("\n")}`,
  );
}

console.log(
  `Worklog link check passed: ${checkpoints.length} checkpoints, ${evidenceCount} pinned repository artifacts.`,
);
