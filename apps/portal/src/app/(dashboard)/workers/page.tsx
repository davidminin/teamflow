"use client";

import { useEffect, useState, useCallback } from "react";

interface Worker {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[];
  status: "idle" | "busy" | "offline";
  lastHeartbeat: number;
  registeredAt: number;
}

interface WorkerSummary {
  total: number;
  idle: number;
  busy: number;
  offline: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [summary, setSummary] = useState<WorkerSummary>({
    total: 0,
    idle: 0,
    busy: 0,
    offline: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/workers");
      if (!res.ok) throw new Error("Failed to fetch workers");
      const data = await res.json();
      setWorkers(data.workers);
      setSummary(data.summary);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
    // Auto-refresh every 10s
    const interval = setInterval(fetchWorkers, 10_000);
    return () => clearInterval(interval);
  }, [fetchWorkers]);

  const removeWorker = async (id: string) => {
    try {
      await fetch(`/api/workers/${id}`, { method: "DELETE" });
      fetchWorkers();
    } catch {
      setError("Failed to remove worker");
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "idle":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "busy":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "offline":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workers</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Local machines registered to receive tasks from n8n workflows
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, color: "text-white" },
          { label: "Idle", value: summary.idle, color: "text-green-400" },
          { label: "Busy", value: summary.busy, color: "text-yellow-400" },
          { label: "Offline", value: summary.offline, color: "text-zinc-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Workers list */}
      {loading ? (
        <div className="text-center text-zinc-500 py-12">
          Loading workers...
        </div>
      ) : workers.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-lg text-zinc-300">No workers registered</p>
          <p className="mt-2 text-sm text-zinc-500">
            Start a worker agent on your local machine to register it:
          </p>
          <pre className="mt-4 inline-block rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 text-left text-sm text-zinc-300">
            <code>{`cd worker\nnpm install\nnpm start -- --name "My PC" --port 9800`}</code>
          </pre>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🖥️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{worker.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(
                          worker.status
                        )}`}
                      >
                        {worker.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {worker.endpoint}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-zinc-500">
                    <p>Last seen: {formatTime(worker.lastHeartbeat)}</p>
                    <p>
                      Registered:{" "}
                      {new Date(worker.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWorker(worker.id)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {worker.capabilities.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {worker.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Setup guide */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-white mb-3">
          How it works
        </h2>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-300">1.</span> Start the worker agent on
            any machine (laptop, server, etc.)
          </p>
          <p>
            <span className="text-zinc-300">2.</span> The worker registers with
            the portal and sends heartbeats every 30s
          </p>
          <p>
            <span className="text-zinc-300">3.</span> n8n workflows dispatch
            tasks to available workers via{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
              POST /api/workers
            </code>
          </p>
          <p>
            <span className="text-zinc-300">4.</span> Workers execute the task
            (Cursor, LLM, scripts) and report completion
          </p>
        </div>

        <div className="mt-4 rounded-md bg-zinc-950 border border-zinc-800 p-3">
          <p className="text-xs text-zinc-500 mb-2">
            Architecture (webhook mode):
          </p>
          <pre className="text-xs text-zinc-400">
{`n8n workflow → POST /api/workers { action: "dispatch", task: {...} }
                    ↓
              Portal finds idle worker
                    ↓
              POST worker:9800/tasks { taskId, type, payload }
                    ↓
              Worker executes → PATCH /api/workers/:id { status: "idle" }`}
          </pre>
        </div>
      </div>
    </div>
  );
}
