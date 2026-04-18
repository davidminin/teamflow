# TeamFlow

Fully automate your team's work using the best open source LLMs.

## Overview

***Note:** This is an experimental project so expect some work in progress*

###  ✊ **Automate for cheap at scale**

Open source tooling is dramatically cheaper than frontier LLM usage and rather than paying per token, you should just be covering hardware and electricity (which you already pay for).

Enjoy incredible cost savings by running most flows on your local device and falling back on cloud and frontier LLMs only when necessary. Synchronize all your work in your preferred cloud project management and communication tools.

### Key features:
- **Observability** for monitoring, budgeting and data governance
- **Visual Editor** for creating workflows
- **Hybrid** usage between open source LLMs and paid providers

### Bring your own:
- **Project management** tool like Jira, ClickUp, Notion, etc.
- **Hardware** like your laptop, pc, cloud worker, etc.
- **Standards** so that the work is representative of your quality

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

## 🚀 Quickstart
**Dependencies:** Docker Hub \([Mac](https://docs.docker.com/desktop/setup/install/mac-install/), [Windows](https://docs.docker.com/desktop/setup/install/windows-install)\)

**Node requirement:** Node.js `22.x` is enforced via `.nvmrc`, `.npmrc`, and `engines`.

### 1. Clone repo

```bash
git clone git@github.com:davidminin/teamflow.git
cd teamflow
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Then update secrets in `.env` (at minimum: `N8N_ENCRYPTION_KEY`, `LANGFUSE_NEXTAUTH_SECRET`, `LANGFUSE_SALT`, `LANGFUSE_INIT_USER_PASSWORD`, and project keys).

This setup uses one shared Postgres instance/database (`POSTGRES_DB`) with separate schemas:
- `n8n` service uses schema `n8n`
- `Langfuse` uses schema `langfuse`

Bootstrap team folders and department mapping:

```bash
npm run bootstrap -- --departments "qa,eng,ops" --create-default-teams
```

This creates `teams/<department>/<team>/{workflows,code,docs}` and updates portal manifest data.

### 3. Run Locally

```bash
docker compose up -d
```

Open:
- `Portal`: [http://localhost:3001](http://localhost:3001)
- `n8n`: [http://localhost:5678](http://localhost:5678)
- `Langfuse`: [http://localhost:3000](http://localhost:3000)

The stack auto-creates one shared Langfuse project using the `.env` values:
- Organization: `LANGFUSE_INIT_ORG_NAME`
- Project: `LANGFUSE_INIT_PROJECT_NAME`
- Admin user: `LANGFUSE_INIT_USER_EMAIL`

### 4. Deploy To Cloud


Coming soon!


## 🏗️ Architecture

```
Hosted Chat (Web / Mobile / Slack Bot)
        ↓
Backend API (Controller)
        ↓
 ├── Task & Knowledge Model (internal)
 ├── Workflow Engine (n8n)
 ├── Connector Layer (ClickUp, Jira, etc.)
 └── Task Queue (Redis / SQS)
        ↓
Workers (local or cloud)
```

## Supported Tools

| Category | Tools | Roadmap
| --- | --- | ---
| Workflow | n8n | |
| Observability | Langfuse | |
| Project Management | ClickUp | Jira, Confluence, Asana, Notion |
| Communication | ClickUp | Slack, Teams |
| Git Repo | Github | |
