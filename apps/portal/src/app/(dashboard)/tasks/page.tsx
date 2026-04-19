"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  name: string;
  status: { status: string; type: string };
  priority: { priority: string } | null;
  date_created: string;
  url: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load tasks");
          return;
        }
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch {
        setError("Unable to connect to tasks API");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-500/10 text-red-400",
    high: "bg-orange-500/10 text-orange-400",
    normal: "bg-blue-500/10 text-blue-400",
    low: "bg-zinc-700/50 text-zinc-400",
  };

  const statusColors: Record<string, string> = {
    open: "bg-zinc-700/50 text-zinc-400",
    "in progress": "bg-blue-500/10 text-blue-400",
    review: "bg-purple-500/10 text-purple-400",
    closed: "bg-green-500/10 text-green-400",
    done: "bg-green-500/10 text-green-400",
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create and track tasks synced with ClickUp.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          + New Task
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-amber-400">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Make sure <code className="rounded bg-zinc-800 px-1">CLICKUP_API_TOKEN</code>{" "}
            and <code className="rounded bg-zinc-800 px-1">CLICKUP_LIST_ID</code>{" "}
            are set in your environment variables.
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <span className="text-3xl">📋</span>
          </div>
          <h2 className="text-lg font-semibold text-zinc-200">No tasks yet</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create your first task to get started.
          </p>
          <Link
            href="/tasks/new"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Create Task
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-400">Task</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Priority</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-zinc-800 transition hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-200 hover:text-blue-400 hover:underline"
                    >
                      {task.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        statusColors[task.status?.status?.toLowerCase()] ||
                        "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {task.status?.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        priorityColors[
                          task.priority?.priority?.toLowerCase() || ""
                        ] || "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {task.priority?.priority || "None"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(Number(task.date_created)).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
