"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsItems = [
  {
    href: "/settings/llm",
    label: "LLM Providers",
    icon: "🧠",
    description: "Configure local and cloud AI models",
  },
  {
    href: "/settings/webhooks",
    label: "Webhooks",
    icon: "🔗",
    description: "ClickUp and Vercel webhook configuration",
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure your TeamFlow instance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-400">
                  {item.label}
                </h3>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
