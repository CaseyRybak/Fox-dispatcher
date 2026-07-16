import { readFile } from "node:fs/promises";
import { relative } from "node:path";

import { ESLint } from "eslint";

const eslint = new ESLint();

const lintResults = await eslint.lintFiles(["src/**/*.{ts,tsx}"]);
const productionResults = lintResults.filter(({ filePath }) => {
  const repositoryPath = relative(process.cwd(), filePath).replaceAll(
    "\\",
    "/",
  );

  return (
    !repositoryPath.includes(".test.") &&
    !repositoryPath.startsWith("src/test/")
  );
});
const productionErrors = productionResults.filter(
  ({ errorCount, fatalErrorCount }) => errorCount > 0 || fatalErrorCount > 0,
);
const failures = [];
const fixtureFailures = [];

if (productionErrors.length > 0) {
  const formatter = await eslint.loadFormatter("stylish");
  failures.push(
    `Production import boundaries failed:\n${await formatter.format(productionErrors)}`,
  );
}

const fixtures = [
  {
    filePath: "src/observation-monitoring/domain/boundary-positive.ts",
    fixture: "valid-domain-import.ts.txt",
    expectedRuleId: undefined,
  },
  {
    filePath: "src/observation-monitoring/domain/boundary-negative.ts",
    fixture: "forbidden-domain-to-application.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/domain/boundary-negative.ts",
    fixture: "forbidden-domain-to-application-root.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/application/boundary-negative.ts",
    fixture: "forbidden-application-to-adapter.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/application/boundary-negative.ts",
    fixture: "forbidden-application-to-adapter-root.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/adapters/boundary-negative.ts",
    fixture: "forbidden-adapter-to-domain.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/adapters/boundary-negative.ts",
    fixture: "forbidden-adapter-to-domain-root.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/ui/boundary-negative.ts",
    fixture: "forbidden-ui-to-adapter.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/ui/boundary-negative.ts",
    fixture: "forbidden-ui-to-adapter-root.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/app/boundary-negative.ts",
    fixture: "forbidden-app-to-domain.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
  {
    filePath: "src/observation-monitoring/domain/boundary-negative.ts",
    fixture: "forbidden-domain-browser-api.ts.txt",
    expectedRuleId: "no-restricted-globals",
  },
  {
    filePath: "src/observation-monitoring/application/boundary-negative.ts",
    fixture: "forbidden-application-browser-api.ts.txt",
    expectedRuleId: "no-restricted-globals",
  },
  {
    filePath: "src/observation-monitoring/ui/boundary-negative.ts",
    fixture: "forbidden-ui-browser-persistence.ts.txt",
    expectedRuleId: "no-restricted-properties",
  },
  {
    filePath: "src/shared/boundary-negative.ts",
    fixture: "forbidden-shared-to-observation-monitoring.ts.txt",
    expectedRuleId: "no-restricted-imports",
  },
];

let positiveFixtureCount = 0;
let negativeFixtureCount = 0;

for (const { expectedRuleId, filePath, fixture } of fixtures) {
  const source = await readFile(
    new URL(`./boundary-fixtures/${fixture}`, import.meta.url),
    "utf8",
  );
  const [result] = await eslint.lintText(source, { filePath });
  const expectedBoundaryErrors = result.messages.filter(
    ({ ruleId, severity }) => ruleId === expectedRuleId && severity === 2,
  );

  if (expectedRuleId === undefined) {
    positiveFixtureCount += 1;

    if (result.errorCount > 0) {
      fixtureFailures.push(`Positive boundary fixture failed: ${fixture}`);
    }
  } else {
    negativeFixtureCount += 1;

    if (expectedBoundaryErrors.length === 0) {
      fixtureFailures.push(
        `Boundary fixture was not rejected by ${expectedRuleId}: ${fixture}`,
      );
    }
  }
}

if (fixtureFailures.length === 0) {
  console.log(
    `Boundary fixtures passed: ${positiveFixtureCount} positive fixture, ${negativeFixtureCount} negative fixtures.`,
  );
} else {
  failures.push(...fixtureFailures);
}

if (failures.length > 0) {
  throw new Error(failures.join("\n\n"));
}

console.log(
  `Boundary check passed: ${productionResults.length} source files, ${positiveFixtureCount} positive fixture, ${negativeFixtureCount} negative fixtures.`,
);
