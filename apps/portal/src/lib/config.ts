export const portalConfig = {
  n8nApiUrl: process.env.N8N_API_URL || "http://n8n:5678/api/v1",
  n8nEditorUrl: process.env.N8N_EDITOR_URL || "http://localhost:5678",
  n8nApiKey: process.env.N8N_API_KEY || "",
  langfuseUrl: process.env.LANGFUSE_URL || "http://localhost:3000",
};

export function getAuthHeaders() {
  if (!portalConfig.n8nApiKey) {
    return {};
  }

  return {
    "X-N8N-API-KEY": portalConfig.n8nApiKey,
  };
}
