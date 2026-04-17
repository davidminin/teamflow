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
│  ┌───────────┐ ┌───────────┐                       │
│  │ Workflows │ │   Teams   │  Auth: NextAuth (JWT) │
│  │(n8n embed)│ │           │  DB:   Prisma + PG    │
│  └───────────┘ └───────────┘                       │
└──────────────────────┬──────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
     ▼                 ▼                 ▼
┌─────────┐    ┌────────────┐    ┌────────────┐
│   n8n   │    │  Langfuse  │    │  Postgres  │
│  :5678  │    │   :3000    │    │   :5432    │
└─────────┘    └────────────┘    └────────────┘
                     │
             ┌───────┴───────┐
             ▼               ▼
       ┌──────────┐   ┌──────────┐
       │ClickHouse│   │  MinIO   │
       │  :8123   │   │  :9001   │
       └──────────┘   └──────────┘
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

---

## Quick Start (Docker)

**Requirements:** [Docker Desktop](https://docs.docker.com/desktop/) and Node.js 22+

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
- [ ] Task creation form → ClickUp integration
- [ ] ClickUp → n8n webhook connector
- [ ] Slack bot entry point
- [ ] Worker registration system
- [ ] Local LLM integration (Ollama / vLLM)

---

## License

MIT
