"use client";

import { useState, useEffect, useCallback } from "react";

interface TaskResult {
  commitSha?: string;
  commitUrl?: string;
  filesChanged?: number;
  summary?: string;
  model?: string;
  error?: string;
}

interface Task {
  id: string;
  type: string;
  status: string;
  title: string;
  requirement: string;
  branch?: string;
  baseBranch: string;
  clickupTaskId?: string;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  workerId?: string;
  result?: TaskResult;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dispatched: "bg-blue-100 text-blue-800",
  running: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // New task form
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<string>("code-gen");
  const [newRequirement, setNewRequirement] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newRequirement.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          requirement: newRequirement,
          branch: newBranch || undefined,
          dispatch: true,
        }),
      });
      if (res.ok) {
        setNewRequirement("");
        setNewBranch("");
        setShowForm(false);
        await fetchTasks();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">
            Code generation tasks dispatched to workers
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
        >
          {showForm ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["total", "pending", "dispatched", "completed", "failed"].map((key) => (
          <div key={key} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{key}</p>
            <p className="text-xl font-bold text-white mt-1">{summary[key] || 0}</p>
          </div>
        ))}
      </div>

      {/* New Task Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Task Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="code-gen">Code Generation</option>
              <option value="feedback">Feedback</option>
              <option value="review">Code Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Requirement</label>
            <textarea
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Describe what you want to build or change..."
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Branch (optional)</label>
            <input
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="auto-generated if empty"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newRequirement.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? "Dispatching..." : "Create & Dispatch"}
          </button>
        </form>
      )}

      {/* Task List */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No tasks yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Create a task above, or tasks will appear automatically from ClickUp webhooks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[task.status] || "bg-gray-600 text-gray-200"}`}>
                      {task.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      {task.type}
                    </span>
                    {task.clickupTaskId && (
                      <a
                        href={`https://app.clickup.com/t/${task.clickupTaskId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        ClickUp ↗
                      </a>
                    )}
                  </div>
                  <p className="text-white text-sm mt-1 font-medium truncate">{task.title}</p>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{task.requirement}</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(task.createdAt)}</p>
              </div>

              {/* Result */}
              {task.result && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  {task.result.error ? (
                    <p className="text-red-400 text-xs">{task.result.error}</p>
                  ) : (
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {task.result.commitUrl && (
                        <a href={task.result.commitUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          Commit ↗
                        </a>
                      )}
                      {task.result.filesChanged && <span>{task.result.filesChanged} files changed</span>}
                      {task.result.model && <span>via {task.result.model}</span>}
                      {task.result.summary && <span className="truncate">{task.result.summary}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Branch info */}
              {task.branch && (
                <p className="text-xs text-gray-500 mt-2">
                  Branch: <code className="text-gray-400">{task.branch}</code>
                  {task.baseBranch !== "main" && <> from <code className="text-gray-400">{task.baseBranch}</code></>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
