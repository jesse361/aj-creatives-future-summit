import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./vitest.global-setup.ts",
    env: {
      DATABASE_URL: "postgresql://whyus:whyus_local_only@127.0.0.1:54329/whyus_test",
      DIRECT_URL: "postgresql://whyus:whyus_local_only@127.0.0.1:54329/whyus_test",
      AUTH_SECRET: "test-secret-value-with-enough-length",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
