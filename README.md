# TeamFlow

Fully automate your team's work usingthe best open source LLMs.

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

### Supported Tools

| Category | Tools | Roadmap
| --- | --- | ---
| Workflow | n8n | |
| Observability | Langfuse | |
| Project Management | ClickUp | Jira, Confluence, Asana, Notion |
| Communication | ClickUp | Slack, Teams |
| Git Repo | Github | |

## 🚀 Quickstart
**Dependencies:** Docker Hub \([Mac](https://docs.docker.com/desktop/setup/install/mac-install/), [Windows](https://docs.docker.com/desktop/setup/install/windows-install)\)

### 1. Clone repo

```bash
git clone git@github.com:davidminin/teamflow.git
cd teamflow
```

### 2. Run Locally

```bash
docker compose up -d
```

### 3. Deploy To Cloud


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

