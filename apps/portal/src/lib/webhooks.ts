import { createHmac } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type ClickUpEventType =
  | "taskCreated"
  | "taskUpdated"
  | "taskDeleted"
  | "taskStatusUpdated"
  | "taskAssigneeUpdated"
  | "taskDueDateUpdated"
  | "taskTagUpdated"
  | "taskMoved"
  | "taskCommentPosted"
  | "taskCommentUpdated"
  | "taskTimeEstimateUpdated"
  | "taskTimeTrackedUpdated"
  | "listCreated"
  | "listUpdated"
  | "listDeleted"
  | "folderCreated"
  | "folderUpdated"
  | "folderDeleted"
  | "spaceCreated"
  | "spaceUpdated"
  | "spaceDeleted"
  | "goalCreated"
  | "goalUpdated"
  | "goalDeleted"
  | "keyResultCreated"
  | "keyResultUpdated"
  | "keyResultDeleted";

export interface ClickUpWebhookPayload {
  webhook_id: string;
  event: ClickUpEventType;
  task_id?: string;
  history_items?: Array<{
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: Record<string, unknown>;
    source: string | null;
    user: { id: number; username: string; email: string } | null;
    before: unknown;
    after: unknown;
  }>;
}

export interface WebhookForwardResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

// ── Event metadata (for the settings UI) ───────────────────────────────────

export const SUPPORTED_EVENTS: { event: ClickUpEventType; label: string; category: string }[] = [
  { event: "taskCreated", label: "Task Created", category: "Tasks" },
  { event: "taskUpdated", label: "Task Updated", category: "Tasks" },
  { event: "taskDeleted", label: "Task Deleted", category: "Tasks" },
  { event: "taskStatusUpdated", label: "Task Status Changed", category: "Tasks" },
  { event: "taskAssigneeUpdated", label: "Task Assignee Changed", category: "Tasks" },
  { event: "taskDueDateUpdated", label: "Task Due Date Changed", category: "Tasks" },
  { event: "taskCommentPosted", label: "Comment Posted", category: "Tasks" },
  { event: "taskMoved", label: "Task Moved", category: "Tasks" },
  { event: "listCreated", label: "List Created", category: "Lists" },
  { event: "listUpdated", label: "List Updated", category: "Lists" },
  { event: "folderCreated", label: "Folder Created", category: "Folders" },
  { event: "folderUpdated", label: "Folder Updated", category: "Folders" },
];

// ── Signature verification ─────────────────────────────────────────────────

/**
 * Verify the ClickUp webhook signature (HMAC SHA-256).
 * ClickUp sends the signature in the `X-Signature` header.
 */
export function verifyClickUpSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

// ── Forward to n8n ─────────────────────────────────────────────────────────

/**
 * Forward a validated ClickUp webhook event to an n8n Webhook trigger.
 * Enriches the payload with a `received_at` timestamp.
 */
export async function forwardToN8n(
  n8nWebhookUrl: string,
  payload: ClickUpWebhookPayload
): Promise<WebhookForwardResult> {
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        received_at: new Date().toISOString(),
        source: "teamflow-portal",
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `n8n returned ${response.status}`,
      };
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    return {
      success: false,
      error: `Failed to reach n8n: ${String(error)}`,
    };
  }
}
