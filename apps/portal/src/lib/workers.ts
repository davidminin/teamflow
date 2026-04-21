// In-memory worker registry (PoC — move to Postgres for production)

import { portalConfig } from "@/lib/config";

export interface Worker {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[];
  status: "idle" | "busy" | "offline";
  lastHeartbeat: number;
  registeredAt: number;
  metadata?: Record<string, unknown>;
}

export interface RegisterWorkerPayload {
  name: string;
  endpoint: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskPayload {
  taskId: string;
  type: string;
  payload: Record<string, unknown>;
}

// In-memory store
const workers = new Map<string, Worker>();

// Workers are considered offline after 60s without heartbeat
const HEARTBEAT_TIMEOUT_MS = 60_000;

function generateId(): string {
  return `wkr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveStatus(worker: Worker): Worker["status"] {
  if (worker.status === "busy") return "busy";
  const elapsed = Date.now() - worker.lastHeartbeat;
  return elapsed > HEARTBEAT_TIMEOUT_MS ? "offline" : "idle";
}

export function registerWorker(data: RegisterWorkerPayload): Worker {
  // Check if a worker with the same endpoint already exists
  for (const [id, existing] of workers) {
    if (existing.endpoint === data.endpoint) {
      // Re-register: update and return existing
      existing.name = data.name;
      existing.capabilities = data.capabilities || existing.capabilities;
      existing.metadata = data.metadata || existing.metadata;
      existing.status = "idle";
      existing.lastHeartbeat = Date.now();
      return { ...existing, status: resolveStatus(existing) };
    }
  }

  const worker: Worker = {
    id: generateId(),
    name: data.name,
    endpoint: data.endpoint,
    capabilities: data.capabilities || [],
    status: "idle",
    lastHeartbeat: Date.now(),
    registeredAt: Date.now(),
  };
  if (data.metadata) worker.metadata = data.metadata;

  workers.set(worker.id, worker);
  return worker;
}

export function listWorkers(): Worker[] {
  return Array.from(workers.values()).map((w) => ({
    ...w,
    status: resolveStatus(w),
  }));
}

export function getWorker(id: string): Worker | undefined {
  const w = workers.get(id);
  if (!w) return undefined;
  return { ...w, status: resolveStatus(w) };
}

export function removeWorker(id: string): boolean {
  return workers.delete(id);
}

/** Validates `X-Worker-API-Key` when `WORKER_API_KEY` is set on the portal. */
export function validateWorkerApiKey(request: Request): boolean {
  const expected = portalConfig.workerApiKey;
  if (!expected) return true;
  const provided = request.headers.get("X-Worker-API-Key");
  return provided === expected;
}
export function heartbeat(
  id: string,
  status?: "idle" | "busy"
): Worker | undefined {
  const worker = workers.get(id);
  if (!worker) return undefined;
  worker.lastHeartbeat = Date.now();
  if (status === "idle" || status === "busy") {
    worker.status = status;
  } else if (worker.status === "offline") {
    worker.status = "idle";
  }
  return { ...worker, status: resolveStatus(worker) };
}

export function updateWorkerStatus(
  id: string,
  status: "idle" | "busy",
  _currentTask?: string
): Worker | undefined {
  const worker = workers.get(id);
  if (!worker) return undefined;
  worker.status = status;
  worker.lastHeartbeat = Date.now();
  return { ...worker, status: resolveStatus(worker) };
}

export function findAvailableWorker(
  requiredCapability?: string
): Worker | undefined {
  const available = listWorkers().filter((w) => {
    if (w.status !== "idle") return false;
    if (requiredCapability && !w.capabilities.includes(requiredCapability))
      return false;
    return true;
  });
  // Return the one with the most recent heartbeat (most responsive)
  return available.sort((a, b) => b.lastHeartbeat - a.lastHeartbeat)[0];
}

export async function dispatchToWorker(
  worker: Worker,
  task: TaskPayload
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  updateWorkerStatus(worker.id, "busy");

  try {
    const response = await fetch(`${worker.endpoint}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TeamFlow-Task-Id": task.taskId,
      },
      body: JSON.stringify(task),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      updateWorkerStatus(worker.id, "idle");
      return {
        success: false,
        error: `Worker returned ${response.status}: ${await response.text()}`,
      };
    }

    const data = await response.json();
    // Worker stays busy until it sends a completion heartbeat or next heartbeat
    return { success: true, data };
  } catch (err) {
    updateWorkerStatus(worker.id, "idle");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
