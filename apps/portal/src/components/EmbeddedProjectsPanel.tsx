"use client";

import { useEffect, useState } from "react";
import { portalConfig } from "@/lib/config";

type EmbedPanelProps = {
  title: string;
  description: string;
  url: string;
  fallbackIcon: string;
  fallbackText: string;
  envVarName: string;
  docsUrl: string;
  docsLabel: string;
};

function EmbedPanel({
  title,
  description,
  url,
  fallbackIcon,
  fallbackText,
  envVarName,
  docsUrl,
  docsLabel,
}: EmbedPanelProps) {
  const [canEmbed, setCanEmbed] = useState(false);

  useEffect(() => {
    const isLocalService =
      url.includes("localhost") || url.includes("127.0.0.1");
    const isEmbedProxy =
      url.includes("localhost:5680") ||
      url.includes("127.0.0.1:5680") ||
      url.includes("localhost:3002") ||
      url.includes("127.0.0.1:3002");
    // Local service UIs often send frame-blocking headers (X-Frame-Options/CSP).
    // Allow iframe-safe local proxy endpoints for local development.
    setCanEmbed(!isLocalService || isEmbedProxy);
  }, [url]);

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Open in new tab ↗
        </a>
      </div>

      {canEmbed ? (
        <iframe
          src={url}
          className="h-[420px] w-full border-0"
          title={title}
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="p-5">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80">
              <span className="text-2xl">{fallbackIcon}</span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
            <p className="mt-2 text-sm text-zinc-400">{fallbackText}</p>
            <p className="mt-3 text-xs text-zinc-500">
              Set <code className="text-zinc-300">{envVarName}</code> to a
              remotely reachable URL to enable embedding in cloud previews.
            </p>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              {docsLabel} ↗
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

export default function EmbeddedProjectsPanel() {
  const n8nUrl = portalConfig.n8nEditorUrl || "http://localhost:5678";
  const langfuseUrl = portalConfig.langfuseUrl || "http://localhost:3000";

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Embedded Projects</h2>
        <p className="text-sm text-zinc-400">
          Access all embedded services from this single dashboard URL.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmbedPanel
          title="n8n Workflows"
          description="Visual workflow editor"
          url={n8nUrl}
          fallbackIcon="⚙️"
          fallbackText="The n8n editor is unavailable for embedding from this host."
          envVarName="N8N_EDITOR_URL"
          docsUrl="https://docs.n8n.io/hosting/"
          docsLabel="n8n hosting docs"
        />
        <EmbedPanel
          title="Langfuse Observability"
          description="LLM tracing and analytics"
          url={langfuseUrl}
          fallbackIcon="📈"
          fallbackText="Langfuse is unavailable for embedding from this host."
          envVarName="LANGFUSE_URL"
          docsUrl="https://langfuse.com/docs/deployment/self-host"
          docsLabel="Langfuse hosting docs"
        />
      </div>
    </section>
  );
}
