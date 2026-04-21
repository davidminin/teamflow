# 📱 TeamFlow

**Develop from your phone for the cost of electricity.**

TeamFlow is a self-hosted platform that turns your phone into a full development environment. Review live previews, give feedback in natural language, and watch AI workers implement your changes — all from a mobile browser. No laptop required.

The stack: [n8n](https://n8n.io) visual workflows, [Langfuse](https://langfuse.com) LLM observability, a Next.js command portal, and local AI workers — all running on your own hardware in a single Docker stack. Connect ClickUp, GitHub, and Slack, then develop by conversation.

> ⚠️ **Early-stage project** — expect rapid iteration and breaking changes.

---

## 💡 Why TeamFlow?

### The Problem

You're away from your desk. You have an idea — a bug fix, a feature tweak, a UI change. Your options:

1. **Wait** until you're back at your laptop
2. **Try** to code on your phone (good luck)
3. **Pay** $50+/seat/month for a managed AI agent to do it for you

### The TeamFlow Way

Open your phone → see the live app → type "make the header blue" → watch it happen.

```
┌─────────────────────────────────────────────────────────┐
│                YOUR PHONE (browser)                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │         TeamFlow Portal (/preview)                 │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │                                              │  │  │
│  │  │          Live Preview (iframe)               │  │  │
│  │  │          your-app-git-feat-xxx.vercel.app    │  │  │
│  │  │                                              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  💬 "move the login button to the right"           │  │
│  │  ┌──────────────────────────────────┐ [Send]       │  │
│  │  └──────────────────────────────────┘              │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼ feedback becomes a requirement
┌─────────────────────────────────────────────────────────┐
│  n8n picks up task → dispatches to idle worker →        │
│  worker reads codebase + requirement → makes change →   │
│  commits → Vercel rebuilds → preview refreshes →        │
│  you see the change on your phone                       │
└─────────────────────────────────────────────────────────┘
```

**Cost: your electricity bill.** Self-hosted LLMs, your own hardware, no per-seat pricing.

### Side by Side

|  | Managed AI Agent | TeamFlow |
|--|------------------|----------|
| **What it costs** | $50-200/seat/month + token costs | Hardware + electricity |
| **Where it runs** | Vendor's cloud | Your machine |
| **Your data** | Sent to third parties | Never leaves your servers |
| **Dev from phone?** | Chat-only — can't see the app | Live preview + feedback in one view |
| **LLM choice** | Vendor picks | Your choice — Ollama, vLLM, or cloud |
| **Observability** | Limited | Full traces via Langfuse |
| **Reliability** | Probabilistic | Deterministic n8n workflows |

**Think of it this way:** other tools give you an AI that *talks about* your code. TeamFlow gives you an AI that *changes* your code while you watch the result live on your phone.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Portal (Next.js :3001)                    │
│                                                          │
│  ┌───────────┐ ┌───────────┐ ┌────────────────────────┐ │
│  │ Dashboard  │ │ Preview   │ │   Observability        │ │
│  │ (overview) │ │ (live app)│ │   (Langfuse embed)     │ │
│  └───────────┘ └───────────┘ └────────────────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌────────────────────────┐ │
│  │ Workflows │ │  Workers  │ │     Feedback           │ │
│  │ (n8n)     │ │ (status)  │ │ (chat → requirements)  │ │
│  └───────────┘ └───────────┘ └────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │
     ┌─────────────────┼──────────────────┐
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────┐    ┌────────────┐     ┌────────────┐
│   n8n   │    │  Langfuse  │     │  Postgres  │
│  :5678  │    │   :3000    │     │   :5432    │
└────┬────┘    └────────────┘     └────────────┘
     │               │
     ▼         ┌─────┴──────┐
┌─────────┐    ▼            ▼
│  Redis  │  ┌──────────┐ ┌──────────┐
│  :6379  │  │ClickHouse│ │  MinIO   │
└─────────┘  │  :8123   │ │  :9001   │
             └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│              Local Worker (your PC / server)             │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │           MCP Server (stdio)                      │   │
│  │                                                   │   │
│  │  Tools: list_tasks · claim_task · get_task        │   │
│  │         create_branch · create_pr                 │   │
│  │         complete_task · add_comment               │   │
│  │                                                   │   │
│  │  Resources: teamflow://backlog                    │   │
│  │  Prompts:   implement-ticket                      │   │
│  └──────────────────┬────────────────────────────────┘   │
│                     │                                    │
│  ┌──────────┐  ┌────┴─────┐  ┌───────────────────────┐  │
│  │  Cursor  │──│ ClickUp  │  │  HTTP Worker           │  │
│  │  (IDE)   │  │  GitHub  │  │  (n8n task dispatch)   │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### The Phone Dev Loop

```
1. You open /preview on your phone
2. Live app loads in iframe (Vercel preview deployment)
3. You tap the feedback button: "make the sidebar wider"
4. Feedback → ClickUp task tagged to current branch
5. n8n workflow detects new task → dispatches to idle worker
6. Worker reads codebase + requirement → commits fix
7. Vercel rebuilds preview → portal refreshes iframe
8. You see the change — give more feedback or approve
```

---

## Stack

| Service        | Purpose                                | Port |
| -------------- | -------------------------------------- | ---- |
| **Portal**     | Web UI — dashboard, preview, feedback  | 3001 |
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
# Set CLICKUP_API_TOKEN, CLICKUP_LIST_ID, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, etc.

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

## 🚀 Quickstart

**Dependencies:** [Docker Desktop](https://docs.docker.com/desktop/) and Node.js 22+

```bash
# 0. Use required Node version (from .nvmrc)
nvm use

# 1. Clone & configure
git clone git@github.com:davidminin/teamflow.git
cd teamflow
cp .env.example .env
# Edit .env — at minimum update NEXTAUTH_SECRET, N8N_ENCRYPTION_KEY,
# LANGFUSE_NEXTAUTH_SECRET, LANGFUSE_SALT, and passwords.

# 2. Bootstrap team structure
npm run bootstrap -- --departments "qa,eng,ops" --create-default-teams

# 3. Ensure Docker daemon is running (macOS)
open -a Docker
until docker info >/dev/null 2>&1; do sleep 1; done

# Linux alternative:
# sudo systemctl start docker
# until docker info >/dev/null 2>&1; do sleep 1; done

# 4. Start the stack
docker compose up -d
```

If Docker is not running, `docker compose up -d` fails with a daemon socket error. Start Docker Desktop first.

Then open:

| Service      | URL                          |
| ------------ | ---------------------------- |
| **Portal**   | http://localhost:3001        |
| **n8n**      | http://localhost:5678        |
| **Langfuse** | http://localhost:3000        |

Register an account in the Portal, then sign in to access the dashboard.

---

## AI PR Autofill via n8n (No GitHub Actions)

If you want PR descriptions drafted automatically on open while keeping costs low, use the bundled n8n workflow instead of GitHub Actions minutes.

### What you get

- Trigger on `pull_request` events (`opened`, `reopened`, `ready_for_review`)
- AI-drafted PR body that matches `.github/pull_request_template.md`
- CI remains the source of truth for checks and merge gates

### Setup

1. Add env vars in your root `.env`:
   - `GITHUB_WEBHOOK_SECRET`
   - `GITHUB_TOKEN`
   - `OPENAI_API_KEY`
   - `PR_AUTOFILL_MODEL` (optional, default `gpt-4o-mini`)
2. Restart n8n (`docker compose up -d n8n`).
3. Import workflow: `n8n/workflows/github-pr-autofill.json`.
4. In GitHub repo settings → Webhooks:
   - Payload URL: `http://<your-host>:5678/webhook/github-pr-opened`
   - Content type: `application/json`
   - Secret: same as `GITHUB_WEBHOOK_SECRET`
   - Events: select **Pull requests** only
5. Open a PR and verify the description is replaced with an AI draft.

### Cost controls

- Run only on PR open/reopen/ready-for-review (default in workflow).
- Keep prompt input capped (workflow truncates long diffs).
- Use low-cost model by default; upgrade model only when needed.

Prompt reference: `n8n/prompts/pr-autofill.md`

---

## Preview Deployments (Vercel)

Every pull request gets a unique preview URL — review UI changes from your phone or any device. This is the foundation of the phone dev loop.

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
cp ../../.env.example .env.local
# REQUIRED for Prisma:
export DATABASE_URL="postgresql://postgres:postgres_password_change_me@localhost:5432/teamflow?schema=portal"
# Optional for local embeds/API:
export N8N_EDITOR_URL="http://localhost:5678"
export LANGFUSE_URL="http://localhost:3000"
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
- [x] Worker registration system (heartbeat, dispatch, dashboard)
- [x] MCP server for Cursor / Claude Desktop
- [ ] **Preview embed + feedback widget (phone dev loop)**
- [ ] **Feedback → code workflow (n8n → worker → commit → rebuild)**
- [ ] Slack bot entry point
- [ ] Local LLM integration (Ollama / vLLM)
- [ ] Branch switcher in preview page
- [ ] Vercel deploy webhook listener (auto-refresh preview)


| Category | Tools | Roadmap
| --- | --- | ---
| Workflow | n8n | |
| Observability | Langfuse | |
| Project Management | ClickUp | Jira, Confluence, Asana, Notion |
| Communication | Slack | Teams |
| Code | GitHub + MCP | |
| Local AI | Cursor MCP | Ollama, vLLM |
| Phone Dev | Portal preview + feedback | |

## License

MIT
