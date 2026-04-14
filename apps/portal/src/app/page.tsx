import manifest from "@/data/manifest.json";
import { getAuthHeaders, portalConfig } from "@/lib/config";

type WorkflowRecord = {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
  updatedAt?: string;
};

async function getWorkflows() {
  if (!portalConfig.n8nApiKey) {
    return { error: "Set N8N_API_KEY in .env", data: [] as WorkflowRecord[] };
  }

  try {
    const response = await fetch(`${portalConfig.n8nApiUrl}/workflows`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return { error: "n8n workflow fetch failed", data: [] as WorkflowRecord[] };
    }

    const payload = await response.json();
    return { error: "", data: (payload.data || []) as WorkflowRecord[] };
  } catch {
    return { error: "portal API unavailable", data: [] as WorkflowRecord[] };
  }
}

export default async function Home() {
  const workflows = await getWorkflows();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">TeamFlow Admin Portal</h1>
      <p className="mt-2 text-zinc-300">
        Department-based control plane for n8n workflows and Langfuse observability.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <a className="rounded-lg border border-zinc-700 p-4 hover:bg-zinc-900" href="http://localhost:5678">
          <h2 className="font-medium">Open n8n</h2>
          <p className="mt-1 text-sm text-zinc-400">Visual workflow editor</p>
        </a>
        <a className="rounded-lg border border-zinc-700 p-4 hover:bg-zinc-900" href="http://localhost:3000">
          <h2 className="font-medium">Open Langfuse</h2>
          <p className="mt-1 text-sm text-zinc-400">Tracing and observability</p>
        </a>
        <a className="rounded-lg border border-zinc-700 p-4 hover:bg-zinc-900" href="/api/health">
          <h2 className="font-medium">Portal Health</h2>
          <p className="mt-1 text-sm text-zinc-400">API status endpoint</p>
        </a>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Departments and Teams</h2>
        <div className="mt-4 space-y-3">
          {manifest.departments.map((department) => (
            <div key={department.slug} className="rounded-lg border border-zinc-800 p-4">
              <p className="text-sm uppercase tracking-wide text-zinc-400">{department.slug}</p>
              <ul className="mt-2 list-inside list-disc text-zinc-200">
                {department.teams.map((team) => (
                  <li key={team.slug}>
                    {team.slug} -> <span className="text-zinc-400">{team.workflowsPath}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">n8n Workflows</h2>
        {workflows.error ? (
          <p className="mt-3 text-sm text-amber-300">{workflows.error}</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2">Tags</th>
                </tr>
              </thead>
              <tbody>
                {workflows.data.slice(0, 15).map((workflow) => (
                  <tr key={workflow.id} className="border-t border-zinc-800">
                    <td className="px-3 py-2">{workflow.name}</td>
                    <td className="px-3 py-2">{workflow.active ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{(workflow.tags || []).join(", ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
