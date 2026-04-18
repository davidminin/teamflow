#!/usr/bin/env node
/**
 * TeamFlow Worker Agent
 *
 * Runs on your local machine. Registers with the TeamFlow portal,
 * sends heartbeats, and receives task dispatches via HTTP.
 *
 * Usage:
 *   npx tsx src/index.ts --name "My PC" --portal http://localhost:3001 --port 9800
 */

import http from "node:http";

// ─── Config ─────────────────────────────────────────────────────────

const config = {
  name: process.env.WORKER_NAME || getArg("--name") || `worker-${require("os").hostname()}`,
  portalUrl: process.env.PORTAL_URL || getArg("--portal") || "http://localhost:3001",
  port: parseInt(process.env.WORKER_PORT || getArg("--port") || "9800", 10),
  apiKey: process.env.WORKER_API_KEY || getArg("--api-key") || "",
  capabilities: (process.env.WORKER_CAPABILITIES || getArg("--capabilities") || "code-gen,review")
    .split(",")
    .map((s) => s.trim()),
  heartbeatInterval: 30_000, // 30 seconds
};

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// ─── State ──────────────────────────────────────────────────────────

let workerId: string | null = null;
let currentTask: string | null = null;

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) h["X-Worker-API-Key"] = config.apiKey;
  return h;
}

// ─── Portal Communication ───────────────────────────────────────────

async function register(): Promise<void> {
  const endpoint = `http://0.0.0.0:${config.port}`;
  console.log(`[worker] Registering as "${config.name}" at ${endpoint}...`);

  const res = await fetch(`${config.portalUrl}/api/workers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: config.name,
      endpoint,
      capabilities: config.capabilities,
      metadata: {
        hostname: require("os").hostname(),
        platform: process.platform,
        arch: process.arch,
      },
    }),
  });

  const data = await res.json();
  if (!data.registered || !data.worker?.id) {
    throw new Error(`Registration failed: ${JSON.stringify(data)}`);
  }

  workerId = data.worker.id;
  console.log(`[worker] Registered with id: ${workerId}`);
}

async function sendHeartbeat(): Promise<void> {
  if (!workerId) return;
  try {
    await fetch(`${config.portalUrl}/api/workers/${workerId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        heartbeat: true,
        status: currentTask ? "busy" : "idle",
      }),
    });
  } catch (err) {
    console.error("[worker] Heartbeat failed:", (err as Error).message);
  }
}

async function reportCompletion(taskId: string, result: unknown): Promise<void> {
  if (!workerId) return;
  try {
    await fetch(`${config.portalUrl}/api/workers/${workerId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "idle" }),
    });
  } catch (err) {
    console.error("[worker] Status update failed:", (err as Error).message);
  }
}

// ─── Task Handler ───────────────────────────────────────────────────

async function handleTask(task: { taskId: string; type: string; payload: Record<string, unknown> }): Promise<unknown> {
  console.log(`[worker] Received task: ${task.taskId} (type: ${task.type})`);
  currentTask = task.taskId;

  // TODO: Implement actual task execution (Cursor, LLM, shell commands, etc.)
  // For now, simulate work
  switch (task.type) {
    case "code-gen":
      console.log(`[worker] Generating code for: ${JSON.stringify(task.payload).slice(0, 200)}`);
      await new Promise((r) => setTimeout(r, 2000));
      return { status: "completed", message: "Code generation stub — implement me!" };

    case "review":
      console.log(`[worker] Reviewing: ${JSON.stringify(task.payload).slice(0, 200)}`);
      await new Promise((r) => setTimeout(r, 1000));
      return { status: "completed", message: "Review stub — implement me!" };

    default:
      console.log(`[worker] Unknown task type: ${task.type}`);
      return { status: "completed", message: `Handled task type: ${task.type}` };
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // POST /tasks — receive a task dispatch from portal
  if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const task = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ accepted: true, taskId: task.taskId }));

        // Execute task async (don't block the response)
        const result = await handleTask(task);
        currentTask = null;
        await reportCompletion(task.taskId, result);
        console.log(`[worker] Task ${task.taskId} completed`);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid task payload" }));
      }
    });
    return;
  }

  // GET /health — simple health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", workerId, currentTask, name: config.name }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// ─── Start ──────────────────────────────────────────────────────────

async function start() {
  server.listen(config.port, "0.0.0.0", async () => {
    console.log(`[worker] Listening on port ${config.port}`);
    console.log(`[worker] Capabilities: ${config.capabilities.join(", ")}`);
    console.log(`[worker] Portal: ${config.portalUrl}`);

    await register();

    // Start heartbeat loop
    setInterval(sendHeartbeat, config.heartbeatInterval);
    console.log(`[worker] Heartbeat every ${config.heartbeatInterval / 1000}s — ready for tasks!`);
  });
}

start().catch((err) => {
  console.error("[worker] Failed to start:", err);
  process.exit(1);
});
