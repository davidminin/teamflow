import { NextResponse } from "next/server";
import {
  verifyClickUpSignature,
  forwardToN8n,
  type ClickUpWebhookPayload,
} from "@/lib/webhooks";
import { clickupEventToTask, createAndDispatch } from "@/lib/tasks";

function getWebhookConfig() {
  return {
    secret: process.env.CLICKUP_WEBHOOK_SECRET || "",
    n8nWebhookUrl:
      process.env.N8N_WEBHOOK_URL ||
      "http://n8n:5678/webhook/clickup-events",
    autoDispatch: process.env.CLICKUP_AUTO_DISPATCH !== "false",
  };
}

// POST /api/webhooks/clickup — receive ClickUp webhook events
export async function POST(request: Request) {
  const { secret, n8nWebhookUrl, autoDispatch } = getWebhookConfig();

  const rawBody = await request.text();
  let payload: ClickUpWebhookPayload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify signature if secret is configured
  if (secret) {
    const signature = request.headers.get("x-signature") || "";
    if (!verifyClickUpSignature(rawBody, signature, secret)) {
      console.warn(`[webhook] Invalid ClickUp signature for event: ${payload.event}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  console.log(`[webhook] ClickUp event: ${payload.event} (task: ${payload.task_id || "n/a"})`);

  // 1. Forward to n8n (existing behavior)
  const n8nResult = await forwardToN8n(n8nWebhookUrl, payload);

  // 2. Auto-dispatch to workers if enabled
  let taskResult = null;
  if (autoDispatch) {
    const taskInput = clickupEventToTask(payload);
    if (taskInput) {
      try {
        const task = await createAndDispatch(taskInput);
        taskResult = {
          dispatched: true,
          taskId: task.id,
          status: task.status,
        };
        console.log(`[webhook] Auto-dispatched task ${task.id} (${task.type})`);
      } catch (err) {
        taskResult = {
          dispatched: false,
          error: (err as Error).message,
        };
        console.error(`[webhook] Auto-dispatch failed:`, (err as Error).message);
      }
    }
  }

  return NextResponse.json({
    received: true,
    event: payload.event,
    task_id: payload.task_id,
    n8n: n8nResult,
    autoDispatch: taskResult,
    timestamp: new Date().toISOString(),
  });
}

// GET /api/webhooks/clickup — health check
export async function GET() {
  const { n8nWebhookUrl, autoDispatch } = getWebhookConfig();
  return NextResponse.json({
    status: "ready",
    n8nWebhookUrl,
    autoDispatch,
    hasSecret: !!getWebhookConfig().secret,
  });
}
