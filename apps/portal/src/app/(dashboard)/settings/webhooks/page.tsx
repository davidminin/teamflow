"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WebhookStatus = {
  status: string;
  endpoint: string;
  signatureVerification: string;
  n8nTarget: string;
};

const SUPPORTED_EVENTS = [
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

export default function WebhooksPage() {
  const [status, setStatus] = useState<WebhookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/webhooks/clickup");
        if (!res.ok) throw new Error("Failed to check webhook status");
        const data = await res.json();
        setStatus(data);
      } catch {
        setError("Could not check webhook status");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  async function sendTestEvent() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/clickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_id: "test-webhook-id",
          event: "taskCreated",
          task_id: "test-task-123",
          history_items: [
            {
              id: "test",
              type: 1,
              date: new Date().toISOString(),
              field: "status",
              parent_id: "test-task-123",
              data: {},
              source: null,
              user: null,
              before: null,
              after: { status: "Open" },
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.forwarded) {
        setTestResult("✅ Test event sent and forwarded to n8n successfully!");
      } else {
        setTestResult(
          `⚠️ Event received but not forwarded: ${data.error || "n8n may not be running"}`
        );
      }
    } catch {
      setTestResult("❌ Failed to send test event");
    } finally {
      setTesting(false);
    }
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/clickup`
      : "/api/webhooks/clickup";

  const categories = SUPPORTED_EVENTS.reduce(
    (acc, ev) => {
      if (!acc[ev.category]) acc[ev.category] = [];
      acc[ev.category].push(ev);
      return acc;
    },
    {} as Record<string, typeof SUPPORTED_EVENTS>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <Link
          href="/settings"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back to Settings
        </Link>
      </div>

      <h1 className="text-2xl font-bold">ClickUp Webhooks</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Connect ClickUp events to n8n workflows through the portal webhook
        endpoint.
      </p>

      {/* Status Card */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Configuration Status
        </h2>

        {loading ? (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
            <span className="text-sm text-zinc-400">Checking...</span>
          </div>
        ) : error ? (
          <p className="mt-3 text-sm text-amber-400">{error}</p>
        ) : status ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Webhook Endpoint</span>
              <code className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                {status.endpoint}
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Signature Verification</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  status.signatureVerification === "enabled"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {status.signatureVerification}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">n8n Webhook Target</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  status.n8nTarget === "configured"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {status.n8nTarget}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Setup Instructions
        </h2>
        <div className="mt-4 space-y-4 text-sm text-zinc-300">
          <div>
            <p className="font-medium text-white">
              1. Set your webhook URL in ClickUp
            </p>
            <p className="mt-1 text-zinc-400">
              Go to ClickUp → Settings → Integrations → Webhooks and create a
              new webhook pointing to:
            </p>
            <code className="mt-2 block rounded-lg bg-zinc-800 p-3 text-xs text-blue-400">
              {webhookUrl}
            </code>
          </div>
          <div>
            <p className="font-medium text-white">
              2. Configure environment variables
            </p>
            <p className="mt-1 text-zinc-400">
              Add these to your <code className="rounded bg-zinc-800 px-1">.env</code>{" "}
              file:
            </p>
            <pre className="mt-2 rounded-lg bg-zinc-800 p-3 text-xs text-zinc-300">
{`# Optional — if set, the portal verifies ClickUp signatures
CLICKUP_WEBHOOK_SECRET=your-clickup-webhook-secret

# Where to forward events (must match n8n Webhook node path)
N8N_WEBHOOK_URL=http://n8n:5678/webhook/clickup-events`}
            </pre>
          </div>
          <div>
            <p className="font-medium text-white">
              3. Import the n8n workflow template
            </p>
            <p className="mt-1 text-zinc-400">
              Open n8n → Import Workflow → paste the{" "}
              <code className="rounded bg-zinc-800 px-1">
                n8n/workflows/clickup-task-router.json
              </code>{" "}
              template. Activate it and you&apos;re done.
            </p>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Test Connection
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Send a sample <code className="rounded bg-zinc-800 px-1">taskCreated</code>{" "}
          event through the full pipeline (portal → n8n).
        </p>
        <button
          onClick={sendTestEvent}
          disabled={testing}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {testing ? "Sending..." : "Send Test Event"}
        </button>
        {testResult && (
          <p className="mt-3 text-sm">{testResult}</p>
        )}
      </div>

      {/* Supported Events */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Supported Events
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          These ClickUp events are forwarded to n8n when received.
        </p>
        <div className="mt-4 space-y-4">
          {Object.entries(categories).map(([category, events]) => (
            <div key={category}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {category}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {events.map((ev) => (
                  <span
                    key={ev.event}
                    className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                  >
                    {ev.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
