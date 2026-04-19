/**
 * Task Management
 *
 * Creates, tracks, and dispatches tasks to workers.
 * This is the glue between ClickUp/feedback and the code-aware workers.
 */

import { findAvailableWorker, dispatchToWorker, type TaskPayload } from "./workers";

// ── Types ──────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "dispatched" | "running" | "completed" | "failed";
export type TaskType = "code-gen" | "feedback" | "review";

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  requirement: string;
  branch?: string;
  baseBranch: string;
  filePaths?: string[];
  clickupTaskId?: string;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  workerId?: string;
  result?: {
    commitSha?: string;
    commitUrl?: string;
    filesChanged?: number;
    summary?: string;
    model?: string;
    error?: string;
  };
}

// ── In-memory store ────────────────────────────────────────────────────

const tasks = new Map<string, Task>();

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── CRUD ───────────────────────────────────────────────────────────────

export function createTask(input: {
  type: TaskType;
  title: string;
  requirement: string;
  branch?: string;
  baseBranch?: string;
  filePaths?: string[];
  clickupTaskId?: string;
}): Task {
  const task: Task = {
    id: generateId(),
    type: input.type,
    status: "pending",
    title: input.title,
    requirement: input.requirement,
    branch: input.branch,
    baseBranch: input.baseBranch || "main",
    filePaths: input.filePaths,
    clickupTaskId: input.clickupTaskId,
    createdAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function listTasks(limit = 50): Task[] {
  return Array.from(tasks.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function updateTaskResult(
  taskId: string,
  result: Task["result"],
  status: TaskStatus = "completed"
): Task | undefined {
  const task = tasks.get(taskId);
  if (!task) return undefined;
  task.status = status;
  task.result = result;
  task.completedAt = new Date().toISOString();
  return task;
}

// ── Dispatch ───────────────────────────────────────────────────────────

/**
 * Dispatch a task to the best available worker.
 * Returns the task with updated status.
 */
export async function dispatchTask(task: Task): Promise<Task> {
  const worker = findAvailableWorker(task.type);
  if (!worker) {
    task.status = "failed";
    task.result = { error: "No available workers with capability: " + task.type };
    return task;
  }

  const payload: TaskPayload = {
    taskId: task.id,
    type: task.type,
    payload: {
      requirement: task.requirement,
      branch: task.branch || `auto/${task.id}`,
      baseBranch: task.baseBranch,
      filePaths: task.filePaths,
    },
  };

  try {
    await dispatchToWorker(worker, payload);
    task.status = "dispatched";
    task.dispatchedAt = new Date().toISOString();
    task.workerId = worker.id;
  } catch (err) {
    task.status = "failed";
    task.result = { error: `Dispatch failed: ${(err as Error).message}` };
  }

  return task;
}

/**
 * Create and immediately dispatch a task.
 */
export async function createAndDispatch(input: Parameters<typeof createTask>[0]): Promise<Task> {
  const task = createTask(input);
  return dispatchTask(task);
}

// ── ClickUp → Task conversion ──────────────────────────────────────────

/**
 * Convert a ClickUp webhook event into a code-gen task.
 * Called by the n8n workflow or directly from the webhook handler.
 */
export function clickupEventToTask(event: {
  event: string;
  task_id?: string;
  history_items?: Array<{
    field: string;
    after: unknown;
    before: unknown;
  }>;
}): Parameters<typeof createTask>[0] | null {
  // Only handle task events
  if (!event.task_id) return null;

  // Task status changed to "in progress" → trigger code-gen
  if (event.event === "taskStatusUpdated") {
    const statusChange = event.history_items?.find((h) => h.field === "status");
    const newStatus = String(statusChange?.after || "").toLowerCase();

    if (newStatus === "in progress" || newStatus === "in_progress") {
      return {
        type: "code-gen",
        title: `ClickUp task ${event.task_id}`,
        requirement: `Implement ClickUp task ${event.task_id}. Check the task description for full requirements.`,
        clickupTaskId: event.task_id,
        branch: `auto/clickup-${event.task_id}`,
      };
    }
  }

  // New comment on task → treat as feedback
  if (event.event === "taskCommentPosted") {
    return {
      type: "feedback",
      title: `Feedback on ClickUp task ${event.task_id}`,
      requirement: `New comment on ClickUp task ${event.task_id}. Review and apply the feedback.`,
      clickupTaskId: event.task_id,
    };
  }

  return null;
}
