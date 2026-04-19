"use client";

import { useEffect, useState } from "react";
import { portalConfig } from "@/lib/config";

export default function WorkflowsPage() {
  const n8nUrl = portalConfig.n8nEditorUrl || "http://localhost:5678";
  const [canEmbed, setCanEmbed] = useState(false);

  useEffect(() => {
    const isLocalService =
      n8nUrl.includes("localhost") || n8nUrl.includes("127.0.0.1");
    const isLocalBrowser =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    setCanEmbed(!isLocalService || isLocalBrowser);
  }, [n8nUrl]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Workflows</h1>
          <p className="text-xs text-zinc-500">n8n visual workflow editor</p>
        </div>
        {canEmbed && (
          <a
            href={n8nUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Open in new tab ↗
          </a>
        )}
      </div>

      {canEmbed ? (
        <iframe
          src={n8nUrl}
          className="flex-1 border-0"
          title="n8n Workflow Editor"
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
              <span className="text-3xl">⚙️</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-200">
              n8n Workflow Editor
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              The n8n editor runs as part of the local Docker stack at{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                localhost:5678
              </code>
              . Run{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                docker compose up -d
              </code>{" "}
              to start it.
            </p>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left text-xs text-zinc-500">
              <p className="font-medium text-zinc-400">
                To embed in cloud previews:
              </p>
              <p className="mt-1">
                Set{" "}
                <code className="text-zinc-300">N8N_EDITOR_URL</code> to your
                cloud n8n instance URL in environment variables.
              </p>
            </div>
            <a
              href="https://docs.n8n.io/hosting/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              n8n hosting docs ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
