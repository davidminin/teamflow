"use client";

import { useEffect, useState, useCallback } from "react";

interface ProviderStatus {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  defaultModel: string;
  enabled: boolean;
  healthy: boolean;
  latencyMs?: number;
  availableModels?: string[];
  error?: string;
}

interface TestResult {
  success: boolean;
  response?: string;
  model?: string;
  error?: string;
}

export default function LLMSettingsPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/llm");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  async function testProvider(providerId: string) {
    setTesting(providerId);
    setTestResult(null);
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", provider: providerId }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setTesting(null);
    }
  }

  const statusIcon = (healthy: boolean) =>
    healthy ? "🟢" : "🔴";

  const typeLabel = (type: string) => {
    switch (type) {
      case "ollama": return "Local (Ollama)";
      case "openai-compatible": return "OpenAI-Compatible";
      case "openai": return "OpenAI Cloud";
      case "anthropic": return "Anthropic Cloud";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-zinc-500">
          Checking LLM providers...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">LLM Providers</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure which LLMs power your AI workers. Local models (Ollama) are
          tried first, cloud APIs are used as fallback.
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-lg text-zinc-300">No providers configured</p>
          <p className="mt-2 text-sm text-zinc-500">
            Set environment variables to enable LLM providers:
          </p>
          <div className="mt-4 inline-block rounded-lg bg-zinc-800 p-4 text-left text-sm">
            <code className="text-green-400">
              # Local (recommended — free)
              {"\n"}OLLAMA_URL=http://localhost:11434
              {"\n"}OLLAMA_MODEL=llama3.1:8b
              {"\n\n"}# OpenAI-compatible (vLLM, Together, OpenRouter)
              {"\n"}LLM_API_URL=http://localhost:8000/v1
              {"\n"}LLM_API_KEY=your-key
              {"\n"}LLM_MODEL=meta-llama/Llama-3.1-8B
              {"\n\n"}# Cloud fallback
              {"\n"}OPENAI_API_KEY=sk-...
              {"\n"}ANTHROPIC_API_KEY=sk-ant-...
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Priority order note */}
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-500">
            ⚡ Priority: Ollama → OpenAI-Compatible → OpenAI → Anthropic. Workers
            try local models first, fall back to cloud only if needed.
          </div>

          {providers.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statusIcon(p.healthy)}</span>
                    <h3 className="text-lg font-semibold text-white">
                      {p.name}
                    </h3>
                    {!p.enabled && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                        disabled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {typeLabel(p.type)} · {p.baseUrl}
                  </p>
                </div>

                <button
                  onClick={() => testProvider(p.id)}
                  disabled={testing === p.id}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                >
                  {testing === p.id ? "Testing..." : "Test"}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-zinc-500">Default Model</p>
                  <p className="font-mono text-zinc-300">{p.defaultModel}</p>
                </div>
                {p.latencyMs !== undefined && (
                  <div>
                    <p className="text-zinc-500">Latency</p>
                    <p className="text-zinc-300">{p.latencyMs}ms</p>
                  </div>
                )}
                {p.error && (
                  <div className="col-span-2">
                    <p className="text-zinc-500">Error</p>
                    <p className="text-red-400">{p.error}</p>
                  </div>
                )}
              </div>

              {p.availableModels && p.availableModels.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-zinc-500">Available Models</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.availableModels.slice(0, 12).map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                      >
                        {m}
                      </span>
                    ))}
                    {p.availableModels.length > 12 && (
                      <span className="text-xs text-zinc-600">
                        +{p.availableModels.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Test result */}
              {testResult && testing === null && testResult.model && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${
                    testResult.success
                      ? "bg-green-900/20 text-green-400"
                      : "bg-red-900/20 text-red-400"
                  }`}
                >
                  {testResult.success ? (
                    <>
                      <p className="font-medium">✅ Working</p>
                      <p className="mt-1 text-zinc-400">
                        {testResult.response}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Model: {testResult.model}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">❌ Failed</p>
                      <p className="mt-1">{testResult.error}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Architecture note */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <h3 className="text-sm font-semibold text-zinc-300">How it works</h3>
        <p className="mt-2 text-sm text-zinc-500">
          When you give feedback from the preview page, n8n dispatches a task to
          an available worker. The worker calls the LLM through this provider
          stack — trying local Ollama first (free), then cloud APIs only as
          fallback. All calls are traced in Langfuse for cost & quality
          monitoring.
        </p>
        <div className="mt-3 rounded-lg bg-zinc-800/50 p-3 font-mono text-xs text-zinc-500">
          feedback → n8n → worker → LLM (Ollama → cloud fallback) → commit → Vercel rebuild
        </div>
      </div>
    </div>
  );
}
