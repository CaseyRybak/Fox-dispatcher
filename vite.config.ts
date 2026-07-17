import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const releaseRevision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.FOX_BUILD_REVISION ??
  "local";

if (releaseRevision !== "local" && !/^[0-9a-f]{40}$/u.test(releaseRevision)) {
  throw new Error(
    "VERCEL_GIT_COMMIT_SHA or FOX_BUILD_REVISION must be a 40-character lowercase Git revision.",
  );
}

export default defineConfig({
  plugins: [
    {
      name: "fox-release-revision",
      transformIndexHtml: {
        order: "pre",
        handler: () => [
          {
            tag: "meta",
            attrs: {
              content: releaseRevision,
              name: "fox-dispatcher-revision",
            },
            injectTo: "head",
          },
        ],
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
