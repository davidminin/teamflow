"use client";

import { useEffect, useState } from "react";
import { portalConfig } from "@/lib/config";

export default function ObservabilityPage() {
  const langfuseUrl = portalConfig.langfuseUrl || "http://localhost:3000";
  const [canEmbed, setCanEmbed] = useState(false);

  useEffect(() => {
    const isLocalService =
      langfuseUrl.includes("localhost") || langfuseUrl.includes("127.0.0.1");
    const isEmbedProxy =
      langfuseUrl.includes("localhost:3002") ||
      langfuseUrl.includes("127.0.0.1:3002");
    setCanEmbed(!isLocalService || isEmbedProxy);
  }, [langfuseUrl]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute right-4 top-4 z-10">
        <a
          href={langfuseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-700 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur hover:bg-zinc-800"
        >
          Open in new tab ↗
        </a>
      </div>

      {canEmbed ? (
        <iframe
          src={langfuseUrl}
          className="h-full w-full border-0"
          title="Langfuse Dashboard"
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
              <span className="text-3xl">📈</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-200">
              Langfuse Observability
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Langfuse runs as part of the local Docker stack at{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                localhost:3000
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
                <code className="text-zinc-300">LANGFUSE_URL</code> to your
                Langfuse Cloud or self-hosted URL in environment variables.
              </p>
            </div>
            <a
              href="https://langfuse.com/docs/deployment/self-host"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              Langfuse hosting docs ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
