import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./vitest.global-setup.ts",
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret-value-with-enough-length",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
