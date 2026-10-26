import { execSync } from "node:child_process";

const url = "postgresql://whyus:whyus_local_only@127.0.0.1:54329/whyus_test";

export default function setup() {
  execSync("node scripts/ensure-postgres.mjs", { stdio: "inherit" });
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
