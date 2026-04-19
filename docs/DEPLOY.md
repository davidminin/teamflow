# Deploying TeamFlow Portal (Vercel + Neon)

## Architecture Decision

TeamFlow splits into two halves:

| Layer | Where it runs | Services |
|-------|--------------|----------|
| **Portal UI** | Vercel (free) | Next.js dashboard, auth, task forms |
| **Compute** | Your local machine | n8n, Langfuse, ClickHouse, MinIO, Redis, MCP worker |

**Why this split?**
- The Portal is a standard Next.js 14 app — Vercel is purpose-built for it
- All heavy compute (workflows, LLM observability, MCP tools) runs locally via Docker Compose
- Stays within free tier limits for both Vercel and Neon
- Every PR gets a free preview URL automatically

---

## Free Tier Limits

| Service | Free Tier | More Than Enough? |
|---------|-----------|-------------------|
| **Vercel Hobby** | 100GB bandwidth/mo, 100 deployments/day, serverless functions | ✅ Dashboard traffic is minimal |
| **Neon Free** | 0.5GB storage, 1 project, auto-suspend compute | ✅ Only stores users + tasks |
| **Langfuse Cloud** *(optional)* | 50K observations/month | ✅ Good for dev/demo |

---

## Prerequisites

- GitHub account (you already have this)
- [Neon](https://neon.tech) account (GitHub OAuth, 30 sec)
- [Vercel](https://vercel.com) account (GitHub OAuth, 30 sec)

---

## Step-by-Step Setup

### 1. Create a Neon Database (30 seconds)

1. Go to [neon.tech](https://neon.tech) → **Sign in with GitHub**
2. Create a project:
   - **Name:** `teamflow`
   - **Region:** closest to your users (e.g., `US East` for Toronto)
   - **PostgreSQL version:** 16 (default)
3. Copy the connection string — looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

> **Tip:** Neon gives you two URLs — a "pooled" and "direct" connection. Use the pooled one (default) for `DATABASE_URL`.

### 2. Import to Vercel (30 seconds)

1. Go to [vercel.com/new](https://vercel.com/new) → **Sign in with GitHub**
2. Find and import `davidminin/teamflow`
3. Configure:
   - **Root Directory** → `apps/portal`
   - **Framework Preset** → Next.js (auto-detected)
4. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string from step 1 |
   | `NEXTAUTH_SECRET` | Any random 32+ character string (e.g., run `openssl rand -base64 48`) |

5. Click **Deploy**

That's it. First deploy takes ~90 seconds. You'll get a URL like:
```
teamflow-davidminin.vercel.app
```

### 3. Optional: Connect Remote Services

If you want Langfuse or n8n accessible from the hosted portal (not just locally), add these env vars in Vercel project settings:

| Variable | Value | Purpose |
|----------|-------|---------|
| `N8N_EDITOR_URL` | URL of your n8n instance | Embeds n8n editor in portal |
| `LANGFUSE_URL` | URL of your Langfuse instance | Embeds observability dashboard |
| `N8N_API_KEY` | Your n8n API key | Enables workflow data in portal |

Without these, the portal shows helpful placeholder pages with setup instructions.

---

## How It Works

### Auto-Deploy Pipeline

```
Push to main → Vercel builds → prisma generate → prisma db push → next build → Live
Open a PR   → Vercel builds → preview URL → review on any device
```

The `vercel-build` script in `apps/portal/package.json` handles the full build chain:
```json
"vercel-build": "prisma generate && prisma db push && next build"
```

This means:
- **Schema changes auto-apply** — no manual `prisma db push` needed
- **Prisma client regenerates** on every deploy
- **Local dev is unaffected** — `npm run build` still just runs `next build`

### What Works Where

| Feature | Vercel (hosted) | Local Docker |
|---------|----------------|--------------|
| Auth (register / login) | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Teams page | ✅ | ✅ |
| Task creation forms | ✅ | ✅ |
| Workers page | ✅ | ✅ |
| n8n editor (embed) | placeholder* | ✅ |
| Langfuse (embed) | placeholder* | ✅ |
| n8n API (workflow data) | —* | ✅ |

*\*Unless you point `N8N_EDITOR_URL` / `LANGFUSE_URL` to remote instances or use their cloud tiers.*

---

## Environment Variables Reference

### Required (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | Random secret for session encryption (32+ chars) | `openssl rand -base64 48` |

### Optional (Vercel)

| Variable | Description | Default |
|----------|-------------|---------|
| `N8N_EDITOR_URL` | URL to embed n8n editor | `http://localhost:5678` |
| `LANGFUSE_URL` | URL to embed Langfuse dashboard | `http://localhost:3000` |
| `N8N_API_KEY` | n8n API key for workflow data | — |
| `NEXTAUTH_URL` | Override auth callback URL | Auto-detected on Vercel |

---

## Troubleshooting

### Build fails with Prisma error
Ensure `DATABASE_URL` is set in Vercel environment variables. The `vercel-build` script runs `prisma db push` which needs a valid database connection at build time.

### "Invalid `prisma.user.findUnique()` invocation" after deploy
The database tables haven't been created yet. Redeploy — the `vercel-build` script runs `prisma db push` automatically.

### Auth redirects to localhost
Vercel auto-sets `NEXTAUTH_URL` from the deployment URL. If you see localhost redirects, explicitly set `NEXTAUTH_URL` to your Vercel domain in project settings.

### Neon database sleeping / slow first request
Neon free tier auto-suspends after 5 minutes of inactivity. First request after sleep takes ~1 second to wake. This is normal and only affects the very first request.

### Preview deployments can't reach n8n / Langfuse
Expected — these run locally. Preview deploys show placeholder pages with instructions. For full functionality, use local Docker Compose or point to cloud-hosted instances.

---

## Updating

After merging PRs to `main`:
- **Portal:** auto-deploys to Vercel (zero downtime)
- **Schema changes:** auto-applied via `prisma db push` during build
- **Local stack:** `docker compose pull && docker compose up -d`

---

## Cost Summary

For a dashboard with a handful of users:

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hobby | $0 |
| Neon Free | $0 |
| Langfuse Cloud *(optional)* | $0 (under 50K obs) |
| Local Docker stack | $0 (your hardware) |
| **Total** | **$0** |
