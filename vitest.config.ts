import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
  Separate from vite.config.ts on purpose.

  The dev/build config carries a `server` block with `strictPort: true` on
  5173. Merging test config into it means every `vitest` run parses server
  options it will never use, and — worse — a running dev server and a test run
  share one config whose failure modes look nothing alike.

  `resolve.alias` is spelled out rather than borrowed from vite-tsconfig-paths
  because vitest resolves modules before plugins that rewrite paths get a turn,
  and a test importing `@/lib/x` should not fail for a reason no source file
  ever hits.
*/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Only src/. Without this, vitest walks .agents/ — a scratch directory
    // full of half-finished files from prior sessions — looking for specs.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      // No threshold yet. Phase 0's goal is that the next test has somewhere
      // to live, not a number to defend; a threshold set before there are
      // tests only ever gets lowered.
      reporter: ["text-summary", "html"],
    },
  },
});
