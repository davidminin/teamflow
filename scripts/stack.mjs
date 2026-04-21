import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Matches docker-compose default `PORTAL_URL` / portal service port 3001. */
function getPortalUrl() {
  if (process.env.PORTAL_URL) {
    return process.env.PORTAL_URL.replace(/\/$/, "");
  }
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) {
    return "http://localhost:3001";
  }
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "PORTAL_URL") continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) return val.replace(/\/$/, "");
  }
  return "http://localhost:3001";
}

const action = process.argv[2] || "start";

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function dockerReady() {
  const res = spawnSync("docker", ["info"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return res.status === 0;
}

function startDockerDesktop() {
  if (process.platform === "darwin") {
    spawn("open", ["-a", "Docker"], { detached: true, stdio: "ignore" }).unref();
    return true;
  }

  if (process.platform === "win32") {
    const candidates = [
      path.join(process.env.ProgramFiles || "", "Docker", "Docker", "Docker Desktop.exe"),
      path.join(process.env.LocalAppData || "", "Programs", "Docker", "Docker", "Docker Desktop.exe"),
    ].filter((p) => p && fs.existsSync(p));

    const executable = candidates[0];
    if (!executable) return false;

    spawn(executable, [], { detached: true, stdio: "ignore" }).unref();
    return true;
  }

  return false;
}

async function waitForDocker() {
  const attempts = 90;
  for (let i = 0; i < attempts; i++) {
    if (dockerReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function ensureDockerIfNeeded() {
  if (dockerReady()) {
    console.log("Docker daemon is already running.");
    return;
  }

  const started = startDockerDesktop();
  if (!started) {
    throw new Error(
      "Docker daemon is not running and Docker Desktop could not be auto-started on this OS. Start Docker and retry.",
    );
  }

  console.log("Docker daemon is not running. Starting Docker Desktop...");
  const ok = await waitForDocker();
  if (!ok) {
    throw new Error("Docker did not become ready in time.");
  }
  console.log("Docker is ready.");
}

async function main() {
  if (action === "start" || action === "start:no-build") {
    await ensureDockerIfNeeded();
    const args = ["compose", "up", "-d"];
    if (action === "start:no-build") args.push("--no-build");
    run("docker", args);
    console.log("TeamFlow stack started.");
    console.log(`Open the app: ${getPortalUrl()}`);
    return;
  }

  if (action === "status") {
    run("docker", ["compose", "ps"]);
    return;
  }

  if (action === "stop") {
    run("docker", ["compose", "down"]);
    console.log("TeamFlow stack stopped.");
    return;
  }

  console.error(
    "Usage: node scripts/stack.mjs [start|start:no-build|status|stop]",
  );
  process.exit(1);
}

await main();
