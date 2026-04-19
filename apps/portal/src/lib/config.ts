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
  clickupWebhookSecret: process.env.CLICKUP_WEBHOOK_SECRET || "",
  clickupApiToken: process.env.CLICKUP_API_TOKEN || "",
  clickupListId: process.env.CLICKUP_LIST_ID || "",
};

export function getAuthHeaders() {
  if (!portalConfig.n8nApiKey) return {};
  return { "X-N8N-API-KEY": portalConfig.n8nApiKey };
}
