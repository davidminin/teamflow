import { NextResponse } from "next/server";
import {
  verifyClickUpSignature,
  forwardToN8n,
  type ClickUpWebhookPayload,
} from "@/lib/webhooks";

function getWebhookConfig() {
  return {
    secret: process.env.CLICKUP_WEBHOOK_SECRET || "",
    n8nWebhookUrl:
      process.env.N8N_WEBHOOK_URL ||
      "http://n8n:5678/webhook/clickup-events",
  };
}

// POST /api/webhooks/clickup — receive ClickUp webhook events
export async function POST(request: Request) {
  const { secret, n8nWebhookUrl } = getWebhookConfig();

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify signature if a secret is configured
  if (secret) {
    const signature = request.headers.get("x-signature") || "";
    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Signature header" },
        { status: 401 }
      );
    }
    if (!verifyClickUpSignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // Parse the payload
  let payload: ClickUpWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!payload.event || !payload.webhook_id) {
    return NextResponse.json(
      { error: "Missing required fields: event, webhook_id" },
      { status: 400 }
    );
  }

  // Forward to n8n
  const result = await forwardToN8n(n8nWebhookUrl, payload);

  if (!result.success) {
    console.error(
      `[webhook] Failed to forward ${payload.event} to n8n:`,
      result.error
    );
    // Still return 200 to ClickUp so it doesn't retry endlessly.
    // The portal logs the error for debugging.
    return NextResponse.json({
      received: true,
      forwarded: false,
      event: payload.event,
      error: result.error,
    });
  }

  console.log(
    `[webhook] Forwarded ${payload.event} (task=${payload.task_id || "n/a"}) → n8n`
  );

  return NextResponse.json({
    received: true,
    forwarded: true,
    event: payload.event,
  });
}

// GET /api/webhooks/clickup — health check / info
export async function GET() {
  const { secret, n8nWebhookUrl } = getWebhookConfig();

  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/clickup",
    signatureVerification: secret ? "enabled" : "disabled",
    n8nTarget: n8nWebhookUrl ? "configured" : "not configured",
  });
}
