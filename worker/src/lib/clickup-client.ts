/**
 * Lightweight ClickUp API client for the MCP server.
 * Talks directly to the ClickUp REST API v2.
 */

const API = "https://api.clickup.com/api/v2";

export class ClickUpClient {
  private token: string;
  private defaultListId: string;

  constructor(token: string, defaultListId: string) {
    this.token = token;
    this.defaultListId = defaultListId;
  }

  private headers() {
    return {
      Authorization: this.token,
      "Content-Type": "application/json",
    };
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = path.startsWith("http") ? path : `${API}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this.headers(), ...(options.headers as any) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ClickUp API ${res.status}: ${text}`);
    }
    return res.json();
  }

  /** List tasks in a ClickUp list */
  async listTasks(opts: {
    listId?: string;
    status?: string;
    includeClosed?: boolean;
    assignees?: number[];
  }): Promise<any[]> {
    const listId = opts.listId || this.defaultListId;
    if (!listId) throw new Error("No list ID configured");

    const params = new URLSearchParams();
    params.set("order_by", "created");
    params.set("reverse", "true");
    params.set("subtasks", "true");
    if (opts.status) params.append("statuses[]", opts.status);
    if (opts.includeClosed) params.set("include_closed", "true");
    if (opts.assignees) {
      opts.assignees.forEach((a) => params.append("assignees[]", String(a)));
    }

    const data = await this.request(
      `/list/${listId}/task?${params.toString()}`
    );
    return data.tasks || [];
  }

  /** Get a single task by ID */
  async getTask(taskId: string): Promise<any> {
    return this.request(`/task/${taskId}?include_markdown_description=true`);
  }

  /** Update a task (status, assignees, name, etc.) */
  async updateTask(
    taskId: string,
    updates: {
      name?: string;
      status?: string;
      priority?: number;
      assignees?: { add?: number[]; rem?: number[] };
    }
  ): Promise<any> {
    return this.request(`/task/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  /** Get comments on a task */
  async getComments(taskId: string): Promise<any[]> {
    const data = await this.request(`/task/${taskId}/comment`);
    return data.comments || [];
  }

  /** Add a comment to a task */
  async addComment(taskId: string, text: string): Promise<any> {
    return this.request(`/task/${taskId}/comment`, {
      method: "POST",
      body: JSON.stringify({ comment_text: text, notify_all: false }),
    });
  }

  /** Get lists in a space (for KB discovery) */
  async getLists(spaceId: string): Promise<any[]> {
    const data = await this.request(`/space/${spaceId}/list`);
    return data.lists || [];
  }
}
