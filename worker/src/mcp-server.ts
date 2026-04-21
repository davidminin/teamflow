#!/usr/bin/env node
import "dotenv/config";
/**
 * TeamFlow MCP Server
 *
 * Exposes ClickUp tasks, GitHub operations, and project context as MCP tools.
 * Connect via Cursor, Claude Desktop, or any MCP-compatible client.
 *
 * Usage (stdio — for Cursor / Claude Desktop):
 *   npx tsx worker/src/mcp-server.ts
 *
 * Configure in .cursor/mcp.json or claude_desktop_config.json.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ClickUpClient } from "./lib/clickup-client.js";
import { GitHubClient } from "./lib/github-client.js";
import { PortalClient } from "./lib/portal-client.js";

// ─── Config ─────────────────────────────────────────────────────────

const config = {
  clickup: {
    token: process.env.CLICKUP_API_TOKEN || "",
    listId: process.env.CLICKUP_LIST_ID || "",
    teamId: process.env.CLICKUP_TEAM_ID || "",
    userId: process.env.CLICKUP_USER_ID || "",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
  },
  portal: {
    url: process.env.PORTAL_URL || "",
    apiKey: process.env.WORKER_API_KEY || "",
    workerName: process.env.WORKER_NAME || `mcp-${require("os").hostname()}`,
  },
};

// ─── Clients ────────────────────────────────────────────────────────

const clickup = new ClickUpClient(config.clickup.token, config.clickup.listId);
const github = new GitHubClient(
  config.github.token,
  config.github.owner,
  config.github.repo
);
const portal = new PortalClient(
  config.portal.url,
  config.portal.apiKey,
  config.portal.workerName
);

// ─── MCP Server ─────────────────────────────────────────────────────

const server = new McpServer({
  name: "teamflow",
  version: "1.0.0",
});

// ────────────────────────────────────────────────────────────────────
// TOOLS
// ────────────────────────────────────────────────────────────────────

// 1. List tasks from ClickUp
server.tool(
  "list_tasks",
  "List tasks from the ClickUp backlog. Filter by status or assignee.",
  {
    status: z
      .enum(["to do", "in progress", "complete"])
      .optional()
      .describe("Filter by task status"),
    include_closed: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include completed tasks"),
  },
  async ({ status, include_closed }) => {
    if (!config.clickup.token) {
      return {
        content: [
          {
            type: "text",
            text: "❌ CLICKUP_API_TOKEN not set. Add it to your .env or MCP config.",
          },
        ],
      };
    }

    const tasks = await clickup.listTasks({ status, includeClosed: include_closed });
    const formatted = tasks
      .map(
        (t: any) =>
          `• [${t.id}] ${t.name} — ${t.status.status} (${t.priority?.priority || "none"})`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: tasks.length
            ? `Found ${tasks.length} tasks:\n\n${formatted}`
            : "No tasks found with the given filters.",
        },
      ],
    };
  }
);

// 2. Get full task details
server.tool(
  "get_task",
  "Get full details of a ClickUp task including description, comments, and metadata.",
  {
    task_id: z.string().describe("The ClickUp task ID (e.g. 86e0yp09t)"),
  },
  async ({ task_id }) => {
    const task = await clickup.getTask(task_id);
    const comments = await clickup.getComments(task_id);

    const commentsText = comments.length
      ? "\n\n## Comments\n" +
        comments
          .map(
            (c: any) =>
              `**${c.user?.username || "Unknown"}** (${new Date(parseInt(c.date)).toLocaleDateString()}):\n${c.comment_text}`
          )
          .join("\n\n")
      : "";

    return {
      content: [
        {
          type: "text",
          text: `# ${task.name}\n\n**ID:** ${task.id}\n**Status:** ${task.status.status}\n**Priority:** ${task.priority?.priority || "none"}\n**Assignees:** ${task.assignees?.map((a: any) => a.username).join(", ") || "unassigned"}\n**Created:** ${new Date(parseInt(task.date_created)).toLocaleDateString()}\n**URL:** ${task.url}\n\n## Description\n\n${task.markdown_description || task.description || "(no description)"}${commentsText}`,
        },
      ],
    };
  }
);

// 3. Claim a task — assign to self + set "in progress"
server.tool(
  "claim_task",
  "Claim a ClickUp task: assigns it to you, sets status to 'in progress', and optionally creates a git branch.",
  {
    task_id: z.string().describe("The ClickUp task ID to claim"),
    create_branch: z
      .boolean()
      .optional()
      .default(true)
      .describe("Also create a git branch for this task"),
  },
  async ({ task_id, create_branch }) => {
    const results: string[] = [];

    // Assign + set in progress
    const updated = await clickup.updateTask(task_id, {
      status: "in progress",
      assignees: config.clickup.userId ? { add: [parseInt(config.clickup.userId)] } : undefined,
    });
    results.push(`✅ Task "${updated.name}" claimed and set to *in progress*`);

    // Add a comment
    await clickup.addComment(task_id, "🚀 Task claimed via TeamFlow MCP — starting work.");
    results.push("✅ Added claim comment to task");

    // Create git branch
    if (create_branch && config.github.token) {
      const branchName = `feat/${task_id}-${slugify(updated.name)}`;
      try {
        await github.createBranch(branchName);
        results.push(`✅ Created branch: \`${branchName}\``);
        results.push(`\nRun: \`git fetch origin && git checkout ${branchName}\``);
      } catch (err: any) {
        results.push(`⚠️ Branch creation failed: ${err.message}`);
      }
    }

    // Register activity with portal
    if (config.portal.url) {
      await portal.reportStatus("busy", task_id);
    }

    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

// 4. Update task status
server.tool(
  "update_task_status",
  "Update a ClickUp task's status.",
  {
    task_id: z.string().describe("The ClickUp task ID"),
    status: z
      .enum(["to do", "in progress", "complete"])
      .describe("The new status"),
  },
  async ({ task_id, status }) => {
    const updated = await clickup.updateTask(task_id, { status });
    return {
      content: [
        {
          type: "text",
          text: `✅ Task "${updated.name}" status → *${status}*`,
        },
      ],
    };
  }
);

// 5. Add comment to task
server.tool(
  "add_comment",
  "Add a comment to a ClickUp task.",
  {
    task_id: z.string().describe("The ClickUp task ID"),
    comment: z.string().describe("The comment text (markdown supported)"),
  },
  async ({ task_id, comment }) => {
    await clickup.addComment(task_id, comment);
    return {
      content: [{ type: "text", text: `✅ Comment added to task ${task_id}` }],
    };
  }
);

// 6. Complete task — mark done, add PR link, update portal
server.tool(
  "complete_task",
  "Mark a task as complete. Optionally attach a PR URL and move to 'complete' status in ClickUp.",
  {
    task_id: z.string().describe("The ClickUp task ID"),
    pr_url: z
      .string()
      .optional()
      .describe("Pull request URL to attach as a comment"),
    status: z
      .enum(["in progress", "complete"])
      .optional()
      .default("complete")
      .describe("Target status (default: complete)"),
  },
  async ({ task_id, pr_url, status }) => {
    const results: string[] = [];

    // Update status
    const updated = await clickup.updateTask(task_id, { status });
    results.push(`✅ Task "${updated.name}" → *${status}*`);

    // Add PR comment
    if (pr_url) {
      await clickup.addComment(
        task_id,
        `🔗 Pull request ready for review: ${pr_url}`
      );
      results.push(`✅ PR link added: ${pr_url}`);
    }

    // Notify portal
    if (config.portal.url) {
      await portal.reportStatus("idle");
    }

    return { content: [{ type: "text", text: results.join("\n") }] };
  }
);

// 7. Create a git branch
server.tool(
  "create_branch",
  "Create a new git branch from main for working on a task.",
  {
    branch_name: z
      .string()
      .describe(
        "Branch name (e.g. feat/86e0yp09t-add-auth or fix/login-bug)"
      ),
    base: z
      .string()
      .optional()
      .default("main")
      .describe("Base branch (default: main)"),
  },
  async ({ branch_name, base }) => {
    if (!config.github.token) {
      return {
        content: [
          { type: "text", text: "❌ GITHUB_TOKEN not set. Add it to your .env or MCP config." },
        ],
      };
    }

    await github.createBranch(branch_name, base);
    return {
      content: [
        {
          type: "text",
          text: `✅ Branch \`${branch_name}\` created from \`${base}\`\n\nRun: \`git fetch origin && git checkout ${branch_name}\``,
        },
      ],
    };
  }
);

// 8. Create a pull request
server.tool(
  "create_pr",
  "Create a GitHub pull request for the current branch.",
  {
    title: z.string().describe("PR title"),
    body: z.string().optional().describe("PR description (markdown)"),
    head: z.string().describe("Source branch name"),
    base: z
      .string()
      .optional()
      .default("main")
      .describe("Target branch (default: main)"),
    draft: z
      .boolean()
      .optional()
      .default(false)
      .describe("Create as draft PR"),
  },
  async ({ title, body, head, base, draft }) => {
    if (!config.github.token) {
      return {
        content: [
          { type: "text", text: "❌ GITHUB_TOKEN not set." },
        ],
      };
    }

    const pr = await github.createPR({ title, body: body || "", head, base, draft });
    return {
      content: [
        {
          type: "text",
          text: `✅ PR created: ${pr.html_url}\n\n**#${pr.number}** — ${pr.title}`,
        },
      ],
    };
  }
);

// 9. List knowledge base articles (from ClickUp KB list)
server.tool(
  "list_kb",
  "List knowledge base articles from the TeamFlow KB in ClickUp.",
  {},
  async () => {
    const kbListId = process.env.CLICKUP_KB_LIST_ID;
    if (!kbListId) {
      return {
        content: [
          {
            type: "text",
            text: "ℹ️ No CLICKUP_KB_LIST_ID configured. Set it to your Knowledge Base list ID.",
          },
        ],
      };
    }

    const articles = await clickup.listTasks({ listId: kbListId });
    const formatted = articles
      .map(
        (a: any) =>
          `• [${a.id}] ${a.name}${a.description ? " — " + a.description.slice(0, 80) : ""}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: articles.length
            ? `Knowledge Base (${articles.length} articles):\n\n${formatted}\n\nUse \`get_task\` with the article ID to read the full content.`
            : "No KB articles found.",
        },
      ],
    };
  }
);

// ────────────────────────────────────────────────────────────────────
// RESOURCES
// ────────────────────────────────────────────────────────────────────

server.resource(
  "backlog",
  "teamflow://backlog",
  { description: "Current task backlog from ClickUp", mimeType: "text/plain" },
  async (uri) => {
    const tasks = await clickup.listTasks({});
    const text = tasks
      .map(
        (t: any) =>
          `[${t.id}] ${t.name} | ${t.status.status} | ${t.priority?.priority || "none"} | ${t.assignees?.map((a: any) => a.username).join(", ") || "unassigned"}`
      )
      .join("\n");

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: text || "No tasks in backlog.",
        },
      ],
    };
  }
);

// ────────────────────────────────────────────────────────────────────
// PROMPTS
// ────────────────────────────────────────────────────────────────────

server.prompt(
  "implement-ticket",
  "Get a structured prompt for implementing a ClickUp ticket. Fetches the task details and provides a step-by-step implementation plan.",
  { task_id: z.string().describe("The ClickUp task ID to implement") },
  async ({ task_id }) => {
    const task = await clickup.getTask(task_id);
    const comments = await clickup.getComments(task_id);

    const commentContext = comments.length
      ? "\n\n### Discussion\n" +
        comments.map((c: any) => `- ${c.user?.username}: ${c.comment_text}`).join("\n")
      : "";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are implementing a task from the TeamFlow project backlog.

## Task: ${task.name}
**ID:** ${task.id}
**Priority:** ${task.priority?.priority || "normal"}
**Status:** ${task.status.status}

### Description
${task.markdown_description || task.description || "(no description)"}
${commentContext}

## Instructions

1. Read the task description and any comments carefully
2. Identify the files that need to be created or modified
3. Implement the changes following the project's coding standards:
   - TypeScript strict mode
   - Next.js App Router patterns
   - Tailwind CSS for styling
   - Follow existing code conventions in the repo
4. After implementation, use the \`complete_task\` tool to update the task status
5. If creating a PR, use the \`create_pr\` tool and include the ClickUp task ID in the PR description

Work branch: \`feat/${task_id}-${slugify(task.name)}\``,
          },
        },
      ],
    };
  }
);

// ─── Helpers ────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// ─── Start ──────────────────────────────────────────────────────────

async function main() {
  // Register with portal if configured
  if (config.portal.url) {
    try {
      await portal.register(["mcp", "code-gen", "review"]);
      console.error("[mcp] Registered with portal");
    } catch (err: any) {
      console.error("[mcp] Portal registration skipped:", err.message);
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] TeamFlow MCP server running on stdio");
}

main().catch((err) => {
  console.error("[mcp] Fatal:", err);
  process.exit(1);
});
