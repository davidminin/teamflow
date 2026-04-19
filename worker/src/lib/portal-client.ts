/**
 * Portal API client — registers the MCP worker and reports status.
 * Optional: only used when PORTAL_URL is configured.
 */

export class PortalClient {
  private url: string;
  private apiKey: string;
  private workerName: string;
  private workerId: string | null = null;

  constructor(url: string, apiKey: string, workerName: string) {
    this.url = url;
    this.apiKey = apiKey;
    this.workerName = workerName;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["X-Worker-API-Key"] = this.apiKey;
    return h;
  }

  /** Register this MCP instance as a worker with the portal */
  async register(capabilities: string[]): Promise<void> {
    const res = await fetch(`${this.url}/api/workers`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        name: this.workerName,
        endpoint: "mcp://local",
        capabilities,
        metadata: {
          type: "mcp",
          hostname: require("os").hostname(),
          platform: process.platform,
        },
      }),
    });

    const data = await res.json();
    if (data.worker?.id) {
      this.workerId = data.worker.id;
    }
  }

  /** Report worker status back to the portal */
  async reportStatus(
    status: "idle" | "busy",
    taskId?: string
  ): Promise<void> {
    if (!this.workerId) return;
    try {
      await fetch(`${this.url}/api/workers/${this.workerId}`, {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify({
          heartbeat: true,
          status,
          currentTask: taskId,
        }),
      });
    } catch {
      // Silently skip — portal is optional
    }
  }
}
