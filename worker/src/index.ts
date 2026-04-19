#!/usr/bin/env node
/**
 * TeamFlow Worker Agent
 *
 * Runs on your local machine. Registers with the TeamFlow portal,
 * sends heartbeats, and receives task dispatches via HTTP.
 *
 * For code-gen tasks: reads relevant files from GitHub, calls LLM,
 * commits the changes back. The phone dev loop in action.
 *
 * Usage:
 *   npx tsx src/index.ts --name "My PC" --portal http://localhost:3001 --port 9800
 */

import http from "node:http";
import { chat } from "./llm.js";
import { generateCode, type CodeGenRequest, type FileContext } from "./codegen.js";
import { getFileContent, getRepoTree, listDirectory, createBranch, commitFiles } from "./github.js";

// ─── Config ─────────────────────────────────────────────────────────

const config = {
  name: process.env.WORKER_NAME || getArg("--name") || `worker-${require("os").hostname()}`,
  portalUrl: process.env.PORTAL_URL || getArg("--portal") || "http://localhost:3001",
  port: parseInt(process.env.WORKER_PORT || getArg("--port") || "9800", 10),
  apiKey: process.env.WORKER_API_KEY || getArg("--api-key") || "",
  capabilities: (process.env.WORKER_CAPABILITIES || getArg("--capabilities") || "code-gen,review,feedback")
    .split(",")
    .map((s) => s.trim()),
  heartbeatInterval: 30_000,
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
        hasGithub: !!process.env.GITHUB_TOKEN,
        hasLLM: !!(process.env.OLLAMA_URL || process.env.LLM_API_URL || process.env.OPENAI_API_KEY),
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

async function reportResult(taskId: string, result: unknown): Promise<void> {
  if (!workerId) return;
  try {
    await fetch(`${config.portalUrl}/api/workers/${workerId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        status: "idle",
        lastTaskResult: { taskId, result, completedAt: new Date().toISOString() },
      }),
    });
  } catch (err) {
    console.error("[worker] Result report failed:", (err as Error).message);
  }
}

// ─── Task Handlers ──────────────────────────────────────────────────

/**
 * Handle a code-gen task: read repo context → LLM → commit changes
 */
async function handleCodeGen(task: {
  taskId: string;
  payload: {
    requirement: string;
    branch?: string;
    filePaths?: string[];
    baseBranch?: string;
  };
}): Promise<unknown> {
  const { requirement, branch, filePaths, baseBranch } = task.payload;

  console.log(`[codegen] Requirement: "${requirement}"`);
  console.log(`[codegen] Target branch: ${branch || "auto"}`);

  // 1. Get repo structure
  const repoStructure = await getRepoTree(baseBranch || "main");
  console.log(`[codegen] Loaded repo tree`);

  // 2. Read relevant files
  const relevantFiles: FileContext[] = [];
  const pathsToRead = filePaths || inferRelevantPaths(requirement, repoStructure);

  for (const path of pathsToRead.slice(0, 10)) {
    const file = await getFileContent(path, baseBranch || "main");
    if (file) {
      relevantFiles.push({ path, content: file.content });
      console.log(`[codegen] Loaded: ${path} (${file.content.length} chars)`);
    }
  }

  // 3. Generate code changes
  const result = await generateCode({
    requirement,
    relevantFiles,
    repoStructure,
    branch,
  });

  console.log(`[codegen] Generated ${result.changes.length} changes: ${result.commitMessage}`);

  // 4. Create branch if specified
  const targetBranch = branch || `auto/${task.taskId}`;
  await createBranch(targetBranch, baseBranch || "main");

  // 5. Commit changes
  const commit = await commitFiles(
    targetBranch,
    result.changes.map((c) => ({ path: c.path, content: c.content })),
    result.commitMessage
  );

  return {
    status: "completed",
    branch: targetBranch,
    commit: commit.sha,
    commitUrl: commit.url,
    filesChanged: result.changes.length,
    summary: result.summary,
    model: result.model,
  };
}

/**
 * Handle a feedback task: user sent feedback from the preview page.
 * Similar to code-gen but includes the feedback context.
 */
async function handleFeedback(task: {
  taskId: string;
  payload: {
    feedback: string;
    currentBranch: string;
    screenshotUrl?: string;
    pageUrl?: string;
  };
}): Promise<unknown> {
  const { feedback, currentBranch, pageUrl } = task.payload;

  // Convert feedback to a code-gen requirement
  const requirement = [
    `User feedback from the live preview:`,
    `"${feedback}"`,
    pageUrl ? `Page: ${pageUrl}` : "",
    `\nApply the minimal code change to address this feedback.`,
  ]
    .filter(Boolean)
    .join("\n");

  return handleCodeGen({
    taskId: task.taskId,
    payload: {
      requirement,
      branch: currentBranch,
      baseBranch: currentBranch,
    },
  });
}

/**
 * Handle a review task: review code and provide suggestions.
 */
async function handleReview(task: {
  taskId: string;
  payload: { filePaths: string[]; branch: string };
}): Promise<unknown> {
  const { filePaths, branch } = task.payload;
  const files: FileContext[] = [];

  for (const path of filePaths.slice(0, 8)) {
    const file = await getFileContent(path, branch);
    if (file) files.push({ path, content: file.content });
  }

  const response = await chat([
    {
      role: "system",
      content: "You are a senior code reviewer. Review the following files for bugs, security issues, and improvements. Be concise.",
    },
    {
      role: "user",
      content: files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n"),
    },
  ]);

  return {
    status: "completed",
    review: response.content,
    model: response.model,
    filesReviewed: files.length,
  };
}

/**
 * Infer which files are relevant based on the requirement.
 */
function inferRelevantPaths(requirement: string, tree: string): string[] {
  const lower = requirement.toLowerCase();
  const paths: string[] = [];
  const treeLines = tree.split("\n").map((l) => l.replace(/^[📁📄] /, ""));

  // Always include key files
  const alwaysInclude = [
    "apps/portal/src/lib/config.ts",
    "apps/portal/src/components/Sidebar.tsx",
  ];
  for (const p of alwaysInclude) {
    if (treeLines.includes(p)) paths.push(p);
  }

  // Keyword-based matching
  const keywords: Record<string, string[]> = {
    header: ["layout.tsx", "Sidebar.tsx"],
    sidebar: ["Sidebar.tsx"],
    auth: ["auth.ts", "login", "register"],
    dashboard: ["page.tsx"],
    worker: ["workers.ts", "worker/src/index.ts"],
    task: ["tasks"],
    style: ["globals.css", "tailwind.config.ts"],
    setting: ["settings"],
    llm: ["llm.ts", "settings/llm"],
    workflow: ["workflows"],
  };

  for (const [keyword, filePatterns] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      for (const pattern of filePatterns) {
        const matches = treeLines.filter((l) => l.includes(pattern));
        paths.push(...matches);
      }
    }
  }

  // Dedupe and limit
  return [...new Set(paths)].slice(0, 10);
}

// ─── Task Router ────────────────────────────────────────────────────

async function handleTask(task: {
  taskId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<unknown> {
  console.log(`[worker] ━━━ Task ${task.taskId} (${task.type}) ━━━`);
  currentTask = task.taskId;

  try {
    switch (task.type) {
      case "code-gen":
        return await handleCodeGen(task as Parameters<typeof handleCodeGen>[0]);
      case "feedback":
        return await handleFeedback(task as Parameters<typeof handleFeedback>[0]);
      case "review":
        return await handleReview(task as Parameters<typeof handleReview>[0]);
      default:
        console.log(`[worker] Unknown task type: ${task.type} — attempting as code-gen`);
        return await handleCodeGen({
          taskId: task.taskId,
          payload: {
            requirement: JSON.stringify(task.payload),
            ...task.payload,
          } as Parameters<typeof handleCodeGen>[0]["payload"],
        });
    }
  } finally {
    currentTask = null;
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const task = JSON.parse(body);
        // Acknowledge immediately
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ accepted: true, taskId: task.taskId }));

        // Execute async
        const result = await handleTask(task);
        await reportResult(task.taskId, result);
        console.log(`[worker] ✅ Task ${task.taskId} completed`);
      } catch (err) {
        console.error(`[worker] ❌ Task failed:`, (err as Error).message);
        if (!res.writableEnded) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid task payload" }));
        }
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        workerId,
        currentTask,
        name: config.name,
        capabilities: config.capabilities,
        hasGithub: !!process.env.GITHUB_TOKEN,
        hasLLM: !!(process.env.OLLAMA_URL || process.env.LLM_API_URL || process.env.OPENAI_API_KEY),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// ─── Start ──────────────────────────────────────────────────────────

async function start() {
  // Verify LLM availability
  console.log("[worker] Checking LLM connectivity...");
  try {
    const test = await chat([
      { role: "user", content: "Reply with just 'ok'" },
    ]);
    console.log(`[worker] ✅ LLM ready (model: ${test.model})`);
  } catch (err) {
    console.warn(`[worker] ⚠️ LLM check failed: ${(err as Error).message}`);
    console.warn("[worker] Worker will start but code-gen tasks will fail without LLM");
  }

  server.listen(config.port, "0.0.0.0", async () => {
    console.log(`[worker] Listening on port ${config.port}`);
    console.log(`[worker] Capabilities: ${config.capabilities.join(", ")}`);
    console.log(`[worker] Portal: ${config.portalUrl}`);
    console.log(`[worker] GitHub: ${process.env.GITHUB_REPO || "not configured"}`);

    await register();
    setInterval(sendHeartbeat, config.heartbeatInterval);
    console.log(`[worker] Ready for tasks! 🚀`);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[worker] Shutting down...");
  if (workerId) {
    try {
      await fetch(`${config.portalUrl}/api/workers/${workerId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      console.log("[worker] Deregistered from portal");
    } catch {}
  }
  server.close();
  process.exit(0);
});

start().catch((err) => {
  console.error("[worker] Failed to start:", err);
  process.exit(1);
});
