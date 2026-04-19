# 🚀 TeamFlow

**Automate your team's work with open-source LLMs, visual workflows, and full observability.**

TeamFlow is a self-hosted platform that combines [n8n](https://n8n.io) workflow automation, [Langfuse](https://langfuse.com) LLM observability, and a Next.js command portal into a single Docker stack. Connect your project management tools, code repos, and communication channels — then let AI workflows handle the repetitive work.

> ⚠️ **Early-stage project** — expect rapid iteration and breaking changes.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Portal (Next.js :3001)                │
│                                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │
│  │ Dashboard  │ │  Tasks    │ │   Observability   │ │
│  │ (overview) │ │ (create)  │ │ (Langfuse embed)  │ │
│  └───────────┘ └───────────┘ └───────────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │
│  │ Workflows │ │   Teams   │ │     Workers       │ │
│  │(n8n embed)│ │           │ │ (MCP + HTTP)      │ │
│  └───────────┘ └───────────┘ └───────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
     ▼                 ▼                 ▼
┌─────────┐    ┌────────────┐    ┌────────────┐
│   n8n   │    │  Langfuse  │    │  Postgres  │
│  :5678  │    │   :3000    │    │   :5432    │
└────┬────┘    └────────────┘    └────────────┘
     │               │
     ▼         ┌─────┴─────┐
┌─────────┐    ▼           ▼
│  Redis  │  ┌──────────┐ ┌──────────┐
│  :6379  │  │ClickHouse│ │  MinIO   │
└─────────┘  │  :8123   │ │  :9001   │
             └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────┐
│              Local Worker (your PC)                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │           MCP Server (stdio)                  │  │
│  │                                               │  │
│  │  Tools: list_tasks · claim_task · get_task    │  │
│  │         create_branch · create_pr             │  │
│  │         complete_task · add_comment           │  │
│  │                                               │  │
│  │  Resources: teamflow://backlog                │  │
│  │  Prompts:   implement-ticket                  │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │                               │
│  ┌──────────┐  ┌────┴─────┐  ┌──────────────────┐  │
│  │  Cursor  │──│ ClickUp  │  │  HTTP Worker      │  │
│  │  (IDE)   │  │  GitHub   │  │  (n8n dispatch)  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Stack

| Service        | Purpose                                | Port |
| -------------- | -------------------------------------- | ---- |
| **Portal**     | Web UI — dashboard, tasks, auth        | 3001 |
| **n8n**        | Visual workflow automation engine       | 5678 |
| **Langfuse**   | LLM observability, tracing, analytics  | 3000 |
| **PostgreSQL** | Shared database (separate schemas)     | 5432 |
| **Redis**      | Queue & caching                        | 6379 |
| **ClickHouse** | Analytics column store (for Langfuse)  | 8123 |
| **MinIO**      | S3-compatible object storage           | 9001 |
| **Worker**     | Local MCP server + HTTP task agent     | 9800 |

---

## 🔌 MCP Integration (Cursor / Claude Desktop)

TeamFlow ships with a local MCP server that connects your IDE directly to your ClickUp tasks and GitHub repos. No browser switching — claim a ticket, implement it, and submit a PR all from your editor.

### Quick Setup

```bash
# 1. Install worker dependencies
cd worker && npm install

# 2. Copy and fill env vars
cp .env.example .env
# Set CLICKUP_API_TOKEN, CLICKUP_LIST_ID, GITHUB_TOKEN, etc.

# 3. Cursor will auto-detect .cursor/mcp.json — just restart Cursor!
```

### Available MCP Tools

| Tool                 | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `list_tasks`         | List tasks from ClickUp (filter by status)                     |
| `get_task`           | Get full task details, description, and comments               |
| `claim_task`         | Assign to yourself, set "in progress", create a git branch     |
| `update_task_status` | Change task status (to do / in progress / complete)            |
| `add_comment`        | Post a comment on any ClickUp task                             |
| `complete_task`      | Mark done, attach PR link, update portal                       |
| `create_branch`      | Create a feature branch from main                              |
| `create_pr`          | Open a pull request on GitHub                                  |
| `list_kb`            | Browse Knowledge Base articles in ClickUp                      |

### Workflow Example

```
You → Cursor:  "Show me available tasks"
Cursor → MCP:  list_tasks(status: "to do")
MCP → ClickUp: GET /list/{id}/task?statuses[]=to do

You → Cursor:  "Claim the auth refactor task"
Cursor → MCP:  claim_task(task_id: "86e0yp09t", create_branch: true)
MCP → ClickUp: PUT /task/86e0yp09t { status: "in progress", assignees: [...] }
MCP → GitHub:  POST /repos/.../git/refs { ref: "feat/86e0yp09t-auth-refactor" }

You → Cursor:  "Implement this task" (uses implement-ticket prompt)
Cursor → AI:   [reads task description, comments, KB context, implements]

You → Cursor:  "Create a PR and mark the task done"
Cursor → MCP:  create_pr(title: "...", head: "feat/86e0yp09t-auth-refactor")
Cursor → MCP:  complete_task(task_id: "86e0yp09t", pr_url: "https://...")
```

### Manual MCP Server (for testing)

```bash
cd worker
npm run mcp        # stdio mode (for MCP clients)
npm run mcp:dev    # stdio mode + file watching
```

---

## 💡 Why TeamFlow?

There's no shortage of AI tools that promise to automate your work — managed AI agents, copilots, and SaaS platforms. TeamFlow takes a fundamentally different approach.

### The Core Difference

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MANAGED AI AGENT                                │
│                                                                     │
│  "Do X" ──→  🧠 AI Brain  ──→  figures out steps  ──→  acts        │
│              (vendor-hosted)    (probabilistic)         (opaque)     │
│                                                                     │
│  ✅ Smart, autonomous          ❌ Data leaves your infra            │
│  ✅ No workflow to design      ❌ Per-seat / per-token pricing      │
│  ✅ Handles ambiguity          ❌ Black box — hard to audit         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        TEAMFLOW                                     │
│                                                                     │
│  "Do X" ──→  📋 Task  ──→  ⚡ n8n Workflow  ──→  🤖 Your LLMs     │
│              (ClickUp)      (deterministic)       (Ollama/vLLM)     │
│                                    │                                │
│                              📊 Langfuse                            │
│                             (full traces)                           │
│                                                                     │
│  ✅ Self-hosted, your data       ✅ Observable — full LLM traces    │
│  ✅ Deterministic workflows      ✅ Any LLM — local or cloud        │
│  ✅ Hardware cost only           ✅ Code-level customization        │
└─────────────────────────────────────────────────────────────────────┘
```

### Side by Side

|  | Managed AI Agents | TeamFlow |
|--|-------------------|----------|
| **How it works** | AI reasons autonomously, figures out steps on its own | You design workflows visually, LLMs power each step |
| **Hosting** | Vendor's cloud | Your infrastructure |
| **Your data** | Sent to third parties | Never leaves your servers |
| **LLM choice** | Vendor picks (GPT-4, Claude, etc.) | Your choice — Ollama, vLLM, or cloud fallback |
| **Cost** | Per-seat or per-token | Hardware + electricity |
| **Reliability** | Probabilistic — AI decides how | Deterministic — workflows run the same way every time |
| **Observability** | Limited | Full traces, costs, and evals via Langfuse |
| **Customization** | Prompt engineering | Code-level control over every step |

**Think of it this way:**
- **Managed AI Agent** = hiring an AI employee — smart, but you don't control how they think or where your data goes
- **TeamFlow** = building your own AI assembly line — you design every step, pick your own models, and keep full ownership

TeamFlow isn't trying to be an autonomous agent. It's the **self-hosted automation backbone** that lets your team plug in LLMs wherever they add value — with full observability, deterministic reliability, and zero vendor lock-in.

---

## 🚀 Quickstart

**Dependencies:** [Docker Desktop](https://docs.docker.com/desktop/) and Node.js 22+

```bash
# 1. Clone & configure
git clone git@github.com:davidminin/teamflow.git
cd teamflow
cp .env.example .env
# Edit .env — at minimum update NEXTAUTH_SECRET, N8N_ENCRYPTION_KEY,
# LANGFUSE_NEXTAUTH_SECRET, LANGFUSE_SALT, and passwords.

# 2. Bootstrap team structure
npm run bootstrap -- --departments "qa,eng,ops" --create-default-teams

# 3. Start the stack
docker compose up -d
```

Then open:

| Service      | URL                          |
| ------------ | ---------------------------- |
| **Portal**   | http://localhost:3001        |
| **n8n**      | http://localhost:5678        |
| **Langfuse** | http://localhost:3000        |

Register an account in the Portal, then sign in to access the dashboard.

---

## Preview Deployments (Vercel)

Every pull request gets a unique preview URL — review UI changes from your phone or any device.

### One-time Setup (2 minutes)

1. **Create a free Neon database** at [neon.tech](https://neon.tech)
   - Create a project → copy the connection string:
     `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

2. **Connect repo to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new) → Import `davidminin/teamflow`
   - Set **Root Directory** → `apps/portal`
   - Add these environment variables:

     | Variable          | Value                                |
     | ----------------- | ------------------------------------ |
     | `DATABASE_URL`    | Your Neon connection string          |
     | `NEXTAUTH_SECRET` | Any random 32+ character string      |

3. **Push the database schema** (once, from your machine):
   ```bash
   cd apps/portal
   DATABASE_URL="postgresql://..." npx prisma db push
   ```

4. ✅ Done! Every PR now gets a preview URL like:
   `teamflow-git-feat-xxx-davidminin.vercel.app`

### What works in preview vs. local

| Feature                  | Vercel Preview | Local Docker |
| ------------------------ | -------------- | ------------ |
| Auth (register / login)  | ✅              | ✅            |
| Dashboard                | ✅              | ✅            |
| Teams page               | ✅              | ✅            |
| Task creation forms      | ✅              | ✅            |
| n8n editor (embed)       | placeholder    | ✅            |
| Langfuse (embed)         | placeholder    | ✅            |
| n8n API (workflow data)   | —              | ✅            |

> Embedded services (n8n, Langfuse) show helpful placeholders in preview mode with setup instructions for connecting remote instances.

---

## Development

### Portal only (hot reload)

```bash
cd apps/portal
npm install                   # installs deps + runs prisma generate
cp ../.env.example .env.local # or set DATABASE_URL + NEXTAUTH_SECRET
npx prisma db push            # create/sync database tables
npm run dev                   # → http://localhost:3001
```

### Full stack

```bash
docker compose up -d          # starts all services
```

### Portal Tech

- **Framework:** Next.js 14 (App Router, standalone output)
- **Auth:** NextAuth.js v4 — email/password credentials
- **Database:** Prisma ORM → PostgreSQL
- **Styling:** Tailwind CSS
- **Runtime:** Node.js 22 (enforced via `.nvmrc` + `engines`)

---

## Project Management

Tasks tracked in [ClickUp](https://app.clickup.com/90171007544/v/l/2kz9rrhr-357):

- **Sprint** — current iteration
- **Backlog** — prioritized upcoming work
- **Knowledge Base** — architecture docs, ADRs

---

## Roadmap

- [x] Docker Compose stack (n8n, Langfuse, Postgres, Redis, ClickHouse, MinIO)
- [x] Portal with email/password auth (NextAuth + Prisma)
- [x] Dashboard with department & team overview
- [x] Embedded n8n & Langfuse with graceful degradation
- [x] Vercel preview deployments
- [x] Task creation form → ClickUp integration
- [x] ClickUp → n8n webhook connector
- [x] Worker registration system
- [x] MCP server for Cursor / Claude Desktop
- [ ] Slack bot entry point
- [ ] Local LLM integration (Ollama / vLLM)


| Category | Tools | Roadmap
| --- | --- | ---
| Workflow | n8n | |
| Observability | Langfuse | |
| Project Management | ClickUp | Jira, Confluence, Asana, Notion |
| Communication | Slack | Teams |
| Code | GitHub + MCP | |
| Local AI | Cursor MCP | Ollama, vLLM |

## License

MIT
