import manifest from "@/data/manifest.json";

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Teams</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Manage departments and team configurations.
      </p>

      <div className="mt-6 space-y-4">
        {manifest.departments.map((dept) => (
          <div
            key={dept.slug}
            className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm">
                👥
              </span>
              <div>
                <h2 className="font-semibold capitalize">{dept.slug}</h2>
                <p className="text-xs text-zinc-500">
                  {dept.teams.length} team{dept.teams.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {dept.teams.map((team) => (
                <div
                  key={team.slug}
                  className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{team.slug}</p>
                    <p className="text-xs text-zinc-500">
                      n8n namespace: {team.n8nNamespace}
                    </p>
                  </div>
                  <code className="text-xs text-zinc-600">{team.workflowsPath}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-700 p-6 text-center">
        <p className="text-sm text-zinc-500">
          Run{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
            npm run bootstrap -- --departments &quot;dept1,dept2&quot; --create-default-teams
          </code>{" "}
          to add departments.
        </p>
      </div>
    </div>
  );
}
