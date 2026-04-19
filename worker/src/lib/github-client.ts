/**
 * Lightweight GitHub API client for the MCP server.
 * Uses the GitHub REST API directly (no octokit dependency).
 */

const API = "https://api.github.com";

export class GitHubClient {
  private token: string;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${API}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this.headers(), ...(options.headers as any) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text}`);
    }
    return res.json();
  }

  /** Create a branch from a base ref */
  async createBranch(name: string, base: string = "main"): Promise<void> {
    // Get the SHA of the base branch
    const ref = await this.request(
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${base}`
    );
    const sha = ref.object.sha;

    // Create the new branch
    await this.request(`/repos/${this.owner}/${this.repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${name}`, sha }),
    });
  }

  /** Create a pull request */
  async createPR(opts: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<any> {
    return this.request(`/repos/${this.owner}/${this.repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title: opts.title,
        body: opts.body,
        head: opts.head,
        base: opts.base,
        draft: opts.draft || false,
      }),
    });
  }

  /** List open pull requests */
  async listPRs(state: string = "open"): Promise<any[]> {
    return this.request(
      `/repos/${this.owner}/${this.repo}/pulls?state=${state}&per_page=20`
    );
  }

  /** Get repo info */
  async getRepo(): Promise<any> {
    return this.request(`/repos/${this.owner}/${this.repo}`);
  }
}
