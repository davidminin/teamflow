"use client";

import { portalConfig } from "@/lib/config";

export default function WorkflowsPage() {
  const n8nUrl = portalConfig.n8nEditorUrl || "http://localhost:5678";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Workflows</h1>
          <p className="text-xs text-zinc-500">n8n visual workflow editor</p>
        </div>
        <a
          href={n8nUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={n8nUrl}
        className="flex-1 border-0"
        title="n8n Workflow Editor"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
