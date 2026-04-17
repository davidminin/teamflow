import Link from "next/link";

const integrations = [
  {
    name: "ClickUp Webhooks",
    href: "/settings/webhooks",
    icon: "🔗",
    description:
      "Receive ClickUp events and route them to n8n workflows automatically.",
    status: "configure",
  },
  {
    name: "n8n Workflows",
    href: "/workflows",
    icon: "⚙️",
    description: "View and manage your n8n automation workflows.",
    status: "view",
  },
  {
    name: "Langfuse",
    href: "/observability",
    icon: "📈",
    description: "LLM observability and tracing dashboard.",
    status: "view",
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Manage integrations, webhooks, and platform configuration.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white">
                  {item.name}
                </h3>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {item.description}
              </p>
              <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {item.status === "configure" ? "Configure →" : "View →"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
