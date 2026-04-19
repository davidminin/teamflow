export const portalConfig = {
  n8nApiUrl: process.env.N8N_API_URL || "http://n8n:5678/api/v1",
  n8nEditorUrl:
    process.env.NEXT_PUBLIC_N8N_EDITOR_URL ||
    process.env.N8N_EDITOR_URL ||
    "http://localhost:5678",
  n8nApiKey: process.env.N8N_API_KEY || "",
  n8nWebhookUrl:
    process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook/clickup-events",
  langfuseUrl:
    process.env.NEXT_PUBLIC_LANGFUSE_URL ||
    process.env.LANGFUSE_URL ||
    "http://localhost:3000",
  workerApiKey: process.env.WORKER_API_KEY || "",
  clickupWebhookSecret: process.env.CLICKUP_WEBHOOK_SECRET || "",
  clickupApiToken: process.env.CLICKUP_API_TOKEN || "",
  clickupListId: process.env.CLICKUP_LIST_ID || "",

  // LLM Providers
  ollamaUrl: process.env.OLLAMA_URL || "",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  llmApiUrl: process.env.LLM_API_URL || "",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
  llmProviderName: process.env.LLM_PROVIDER_NAME || "OpenAI-Compatible",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  llmCloudFallback: process.env.LLM_CLOUD_FALLBACK !== "false",
};

export function getAuthHeaders() {
  if (!portalConfig.n8nApiKey) return {};
  return { "X-N8N-API-KEY": portalConfig.n8nApiKey };
}
