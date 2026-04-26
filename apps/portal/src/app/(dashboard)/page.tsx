import manifest from "@/data/manifest.json";
import { getAuthHeaders, portalConfig } from "@/lib/config";
import EmbeddedProjectsPanel from "@/components/EmbeddedProjectsPanel";

type WorkflowRecord = {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
};

async function getWorkflows() {
  if (!portalConfig.n8nApiKey) {
    return { error: "Set N8N_API_KEY in .env", data: [] as WorkflowRecord[] };
  }
  try {
    const response = await fetch(`${portalConfig.n8nApiUrl}/workflows`, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    if (!response.ok) {
      return { error: "n8n workflow fetch failed", data: [] as WorkflowRecord[] };
    }
    const payload = await response.json();
    return { error: "", data: (payload.data || []) as WorkflowRecord[] };
  } catch {
    return { error: "Cannot reach n8n API", data: [] as WorkflowRecord[] };
  }
}

export default async function DashboardPage() {
  const workflows = await getWorkflows();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Overview of departments, teams, and active workflows.
      </p>

      {/* Quick Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-400">Departments</p>
          <p className="mt-1 text-2xl font-semibold">{manifest.departments.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-400">Teams</p>
          <p className="mt-1 text-2xl font-semibold">
            {manifest.departments.reduce((acc, d) => acc + d.teams.length, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-400">Workflows</p>
          <p className="mt-1 text-2xl font-semibold">
            {workflows.error ? "—" : workflows.data.length}
          </p>
        </div>
      </div>

      {/* Departments & Teams */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Departments & Teams</h2>
        <div className="mt-3 space-y-3">
          {manifest.departments.map((department) => (
            <div
              key={department.slug}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {department.slug}
              </p>
              <ul className="mt-2 space-y-1">
                {department.teams.map((team) => (
                  <li key={team.slug} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span className="text-zinc-200">{team.slug}</span>
                    <span className="text-zinc-600">→ {team.workflowsPath}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <EmbeddedProjectsPanel />

      {/* Workflows Table */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">n8n Workflows</h2>
        {workflows.error ? (
          <p className="mt-3 text-sm text-amber-400">{workflows.error}</p>
        ) : workflows.data.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No workflows yet. Create your first in the{" "}
            <a href="/workflows" className="text-blue-400 hover:underline">
              Workflows
            </a>{" "}
            tab.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 font-medium text-zinc-400">Name</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">Tags</th>
                </tr>
              </thead>
              <tbody>
                {workflows.data.slice(0, 20).map((wf) => (
                  <tr key={wf.id} className="border-t border-zinc-800">
                    <td className="px-3 py-2">{wf.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          wf.active
                            ? "bg-green-500/10 text-green-400"
                            : "bg-zinc-700/50 text-zinc-400"
                        }`}
                      >
                        {wf.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {(wf.tags || []).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
