import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const restrictedLayerImports = (...layers) =>
  layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]);

const browserRuntimeGlobals = [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "indexedDB",
  "caches",
  "globalThis",
  "self",
].map((name) => ({
  message: "Browser APIs belong outside the domain and application layers.",
  name,
}));

const browserPersistenceGlobals = [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "caches",
].map((name) => ({
  message: "Browser persistence belongs to an injected adapter.",
  name,
}));

const browserPersistenceProperties = ["window", "globalThis", "self"].flatMap(
  (object) =>
    ["localStorage", "sessionStorage", "indexedDB", "caches"].map(
      (property) => ({
        message: "Browser persistence belongs to an injected adapter.",
        object,
        property,
      }),
    ),
);

export default defineConfig([
  globalIgnores(["dist", "coverage", "node_modules"]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
    },
  },
  {
    files: ["vite.config.ts", "vitest.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/observation-monitoring/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "Domain modules expose plain TypeScript values.",
            },
            {
              name: "react-dom",
              message: "Domain modules expose plain TypeScript values.",
            },
            {
              name: "zod",
              message: "Schema parsing belongs to an adapter boundary.",
            },
          ],
          patterns: [
            {
              group: restrictedLayerImports(
                "app",
                "application",
                "adapters",
                "ui",
              ),
              message: "Domain modules are the innermost dependency layer.",
            },
          ],
        },
      ],
      "no-restricted-globals": ["error", ...browserRuntimeGlobals],
    },
  },
  {
    files: ["src/observation-monitoring/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "Application modules coordinate plain values and ports.",
            },
            {
              name: "react-dom",
              message: "Application modules coordinate plain values and ports.",
            },
          ],
          patterns: [
            {
              group: restrictedLayerImports("app", "adapters", "ui"),
              message: "Application modules depend inward on domain values.",
            },
          ],
        },
      ],
      "no-restricted-globals": ["error", ...browserRuntimeGlobals],
    },
  },
  {
    files: ["src/observation-monitoring/adapters/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedLayerImports("app", "domain", "ui"),
              message:
                "Adapters translate at application ports and stay independent of UI and app composition.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/observation-monitoring/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedLayerImports("app", "adapters", "domain"),
              message:
                "UI consumes application view models without reaching into adapters or domain calculations.",
            },
          ],
        },
      ],
      "no-restricted-globals": ["error", ...browserPersistenceGlobals],
      "no-restricted-properties": ["error", ...browserPersistenceProperties],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedLayerImports("domain"),
              message:
                "App composes application, adapters, and UI without importing domain rules directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedLayerImports("app", "observation-monitoring"),
              message: "Shared presentation modules remain domain-neutral.",
            },
          ],
        },
      ],
    },
  },
]);
