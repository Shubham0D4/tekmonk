import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration for TekMonk.
 *
 * - Resolves the `@/` path alias to `src/` to match tsconfig.json.
 * - Runs in the `node` environment (no browser globals needed for unit tests).
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
