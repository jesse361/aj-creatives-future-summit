import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret-value-123456",
      ADMIN_EMAIL: "organizer@example.com",
      ADMIN_PASSWORD: "Summit-Demo-2027-Aj",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
