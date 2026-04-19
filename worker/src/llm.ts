/**
 * Worker LLM Client
 *
 * Lightweight LLM abstraction for the standalone worker.
 * Mirrors the portal's lib/llm.ts but runs independently.
 */

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMResponse {
  content: string;
  model: string;
}

interface LLMConfig {
  ollamaUrl?: string;
  ollamaModel?: string;
  llmApiUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  portalUrl?: string;
}

function getConfig(): LLMConfig {
  return {
    ollamaUrl: process.env.OLLAMA_URL,
    ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
    llmApiUrl: process.env.LLM_API_URL,
    llmApiKey: process.env.LLM_API_KEY,
    llmModel: process.env.LLM_MODEL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    portalUrl: process.env.PORTAL_URL || "http://localhost:3001",
  };
}

async function ollamaChat(url: string, model: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Ollama: ${res.status}`);
  const data = await res.json();
  return { content: data.message?.content || "", model: data.model || model };
}

async function openaiChat(url: string, key: string, model: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const res = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8192, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`OpenAI-compat: ${res.status}`);
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", model: data.model || model };
}

async function portalChat(portalUrl: string, messages: LLMMessage[]): Promise<LLMResponse> {
  const res = await fetch(`${portalUrl}/api/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete", messages }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Portal LLM: ${res.status}`);
  const data = await res.json();
  return { content: data.content || "", model: data.model || "portal" };
}

/**
 * Call the best available LLM. Tries local → cloud → portal fallback.
 */
export async function chat(messages: LLMMessage[]): Promise<LLMResponse> {
  const cfg = getConfig();
  const errors: string[] = [];

  // 1. Ollama (local, free)
  if (cfg.ollamaUrl) {
    try {
      return await ollamaChat(cfg.ollamaUrl, cfg.ollamaModel!, messages);
    } catch (e) {
      errors.push(`Ollama: ${(e as Error).message}`);
    }
  }

  // 2. OpenAI-compatible (vLLM, Together, etc.)
  if (cfg.llmApiUrl) {
    try {
      return await openaiChat(cfg.llmApiUrl, cfg.llmApiKey || "", cfg.llmModel || "default", messages);
    } catch (e) {
      errors.push(`LLM API: ${(e as Error).message}`);
    }
  }

  // 3. OpenAI cloud
  if (cfg.openaiApiKey) {
    try {
      return await openaiChat("https://api.openai.com/v1", cfg.openaiApiKey, cfg.openaiModel!, messages);
    } catch (e) {
      errors.push(`OpenAI: ${(e as Error).message}`);
    }
  }

  // 4. Portal proxy (uses portal's provider stack)
  if (cfg.portalUrl) {
    try {
      return await portalChat(cfg.portalUrl, messages);
    } catch (e) {
      errors.push(`Portal: ${(e as Error).message}`);
    }
  }

  throw new Error(`All LLM providers failed: ${errors.join("; ")}`);
}
