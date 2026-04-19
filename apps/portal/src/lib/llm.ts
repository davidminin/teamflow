/**
 * LLM Provider Abstraction
 *
 * Supports Ollama (local), OpenAI-compatible (vLLM, Together, OpenRouter),
 * and direct OpenAI/Anthropic cloud APIs.
 *
 * All providers expose the same interface: chat completion with streaming.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  type: "ollama" | "openai-compatible" | "openai" | "anthropic";
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
  models?: string[];
  enabled: boolean;
}

export interface LLMProviderStatus {
  provider: LLMProvider;
  healthy: boolean;
  latencyMs?: number;
  availableModels?: string[];
  error?: string;
}

// ─── Provider Registry ──────────────────────────────────────────────

function getProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  // Ollama (local)
  if (process.env.OLLAMA_URL) {
    providers.push({
      id: "ollama",
      name: "Ollama (local)",
      type: "ollama",
      baseUrl: process.env.OLLAMA_URL,
      defaultModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
      enabled: true,
    });
  }

  // OpenAI-compatible (vLLM, Together, OpenRouter, LiteLLM, etc.)
  if (process.env.LLM_API_URL) {
    providers.push({
      id: "openai-compat",
      name: process.env.LLM_PROVIDER_NAME || "OpenAI-Compatible",
      type: "openai-compatible",
      baseUrl: process.env.LLM_API_URL,
      apiKey: process.env.LLM_API_KEY || undefined,
      defaultModel: process.env.LLM_MODEL || "gpt-3.5-turbo",
      enabled: true,
    });
  }

  // Direct OpenAI (cloud fallback)
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      id: "openai",
      name: "OpenAI",
      type: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      enabled: process.env.LLM_CLOUD_FALLBACK !== "false",
    });
  }

  // Direct Anthropic (cloud fallback)
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      id: "anthropic",
      name: "Anthropic",
      type: "anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      enabled: process.env.LLM_CLOUD_FALLBACK !== "false",
    });
  }

  return providers;
}

// ─── Health Check ───────────────────────────────────────────────────

async function checkOllamaHealth(
  provider: LLMProvider
): Promise<LLMProviderStatus> {
  const start = Date.now();
  try {
    const res = await fetch(`${provider.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models = (data.models || []).map(
      (m: { name: string }) => m.name
    );
    return {
      provider,
      healthy: true,
      latencyMs: Date.now() - start,
      availableModels: models,
    };
  } catch (err) {
    return {
      provider,
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkOpenAICompatHealth(
  provider: LLMProvider
): Promise<LLMProviderStatus> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = {};
    if (provider.apiKey) headers["Authorization"] = `Bearer ${provider.apiKey}`;

    const res = await fetch(`${provider.baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models = (data.data || []).map(
      (m: { id: string }) => m.id
    );
    return {
      provider,
      healthy: true,
      latencyMs: Date.now() - start,
      availableModels: models,
    };
  } catch (err) {
    return {
      provider,
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkAnthropicHealth(
  provider: LLMProvider
): Promise<LLMProviderStatus> {
  const start = Date.now();
  try {
    // Anthropic doesn't have a /models endpoint — do a minimal completion
    const res = await fetch(`${provider.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": provider.apiKey || "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    return {
      provider,
      healthy: res.ok,
      latencyMs: Date.now() - start,
      availableModels: [provider.defaultModel],
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      provider,
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function checkProviderHealth(
  provider: LLMProvider
): Promise<LLMProviderStatus> {
  switch (provider.type) {
    case "ollama":
      return checkOllamaHealth(provider);
    case "anthropic":
      return checkAnthropicHealth(provider);
    case "openai":
    case "openai-compatible":
    default:
      return checkOpenAICompatHealth(provider);
  }
}

export async function checkAllProviders(): Promise<LLMProviderStatus[]> {
  const providers = getProviders();
  return Promise.all(providers.map(checkProviderHealth));
}

// ─── Chat Completion ────────────────────────────────────────────────

async function ollamaChat(
  provider: LLMProvider,
  req: LLMCompletionRequest
): Promise<LLMCompletionResponse> {
  const res = await fetch(`${provider.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model || provider.defaultModel,
      messages: req.messages,
      stream: false,
      options: {
        temperature: req.temperature ?? 0.7,
        num_predict: req.maxTokens ?? 4096,
      },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  return {
    content: data.message?.content || "",
    model: data.model || req.model || provider.defaultModel,
    usage: data.eval_count
      ? {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        }
      : undefined,
    finishReason: "stop",
  };
}

async function openaiChat(
  provider: LLMProvider,
  req: LLMCompletionRequest
): Promise<LLMCompletionResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider.apiKey) headers["Authorization"] = `Bearer ${provider.apiKey}`;

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: req.model || provider.defaultModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || "",
    model: data.model || req.model || provider.defaultModel,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        }
      : undefined,
    finishReason: choice?.finish_reason || "stop",
  };
}

async function anthropicChat(
  provider: LLMProvider,
  req: LLMCompletionRequest
): Promise<LLMCompletionResponse> {
  // Extract system message
  const systemMsg = req.messages.find((m) => m.role === "system");
  const messages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(`${provider.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": provider.apiKey || "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: req.model || provider.defaultModel,
      max_tokens: req.maxTokens ?? 4096,
      system: systemMsg?.content,
      messages,
      temperature: req.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  return {
    content: data.content?.[0]?.text || "",
    model: data.model || req.model || provider.defaultModel,
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens || 0,
          completionTokens: data.usage.output_tokens || 0,
          totalTokens:
            (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
        }
      : undefined,
    finishReason: data.stop_reason || "stop",
  };
}

// ─── Main Entry Point ───────────────────────────────────────────────

/**
 * Send a chat completion request to the best available provider.
 * Priority: Ollama → OpenAI-compatible → OpenAI → Anthropic
 * If a specific providerId is given, only that provider is used.
 */
export async function chatCompletion(
  req: LLMCompletionRequest,
  providerId?: string
): Promise<LLMCompletionResponse> {
  const providers = getProviders().filter((p) => p.enabled);

  if (providers.length === 0) {
    throw new Error(
      "No LLM providers configured. Set OLLAMA_URL, LLM_API_URL, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
    );
  }

  // If specific provider requested
  const targets = providerId
    ? providers.filter((p) => p.id === providerId)
    : providers;

  if (targets.length === 0) {
    throw new Error(`Provider "${providerId}" not found or not enabled.`);
  }

  // Try each provider in priority order
  let lastError: Error | null = null;
  for (const provider of targets) {
    try {
      switch (provider.type) {
        case "ollama":
          return await ollamaChat(provider, req);
        case "anthropic":
          return await anthropicChat(provider, req);
        case "openai":
        case "openai-compatible":
        default:
          return await openaiChat(provider, req);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[llm] Provider ${provider.id} failed:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error("All LLM providers failed.");
}

/**
 * Get the list of configured providers (safe — no API keys exposed).
 */
export function getConfiguredProviders(): Omit<LLMProvider, "apiKey">[] {
  return getProviders().map(({ apiKey, ...rest }) => ({
    ...rest,
    hasApiKey: !!apiKey,
  })) as Omit<LLMProvider, "apiKey">[];
}
