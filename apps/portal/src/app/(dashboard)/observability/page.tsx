"use client";

import { portalConfig } from "@/lib/config";

export default function ObservabilityPage() {
  const langfuseUrl = portalConfig.langfuseUrl || "http://localhost:3000";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Observability</h1>
          <p className="text-xs text-zinc-500">Langfuse LLM tracing and analytics</p>
        </div>
        <a
          href={langfuseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={langfuseUrl}
        className="flex-1 border-0"
        title="Langfuse Dashboard"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
