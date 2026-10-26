import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const port = 54329;
const user = "whyus";
const password = "whyus_local_only";
const directory = path.join(root, ".data", "postgres");
const devUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/whyus`;

function listening() {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

function databaseUrl() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return "";
  const match = fs.readFileSync(file, "utf8").match(/^DATABASE_URL="?([^"\n]+)"?/m);
  return match?.[1] ?? "";
}

function writeEnv(url) {
  const file = path.join(root, ".env");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const next = ["DATABASE_URL", "DIRECT_URL"].reduce((text, key) => {
    const line = `${key}="${url}"`;
    if (new RegExp(`^${key}=`, "m").test(text)) return text.replace(new RegExp(`^${key}=.*$`, "m"), line);
    return `${text.trim()}\n${line}\n`;
  }, current);
  fs.writeFileSync(file, next.endsWith("\n") ? next : `${next}\n`);
}

async function hold() {
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  fs.mkdirSync(path.dirname(directory), { recursive: true });
  const postgres = new EmbeddedPostgres({ databaseDir: directory, user, password, port, persistent: true });
  if (!fs.existsSync(path.join(directory, "PG_VERSION"))) await postgres.initialise();
  await postgres.start();
  for (const name of ["whyus", "whyus_test"]) {
    try {
      await postgres.createDatabase(name);
    } catch (error) {
      if (!String(error).toLowerCase().includes("already")) throw error;
    }
  }
  console.log(`PostgreSQL is listening on 127.0.0.1:${port}`);
  setInterval(() => {}, 60 * 60 * 1000);
}

const existing = databaseUrl();
if (existing && !/127\.0\.0\.1|localhost/.test(existing)) {
  console.log("DATABASE_URL points outside localhost. Local PostgreSQL was not started.");
  process.exit(0);
}

if (process.argv.includes("--hold")) {
  await hold();
} else if (!(await listening())) {
  const child = spawn(process.execPath, [new URL(import.meta.url).pathname, "--hold"], {
    cwd: root,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  for (let attempt = 0; attempt < 60 && !(await listening()); attempt += 1) await delay(500);
  if (!(await listening())) {
    console.error("Local PostgreSQL did not start. Check .data/postgres and try again.");
    process.exit(1);
  }
  console.log(`PostgreSQL is listening on 127.0.0.1:${port}`);
} else {
  console.log(`PostgreSQL is already listening on 127.0.0.1:${port}`);
}

writeEnv(devUrl);
console.log("Updated DATABASE_URL and DIRECT_URL for the local development database.");
