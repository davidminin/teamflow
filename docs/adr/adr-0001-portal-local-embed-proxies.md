---
status: accepted
date: 2026-05-03
---

# ADR-0001: Portal local embed proxies for n8n and Langfuse

## Context

The dashboard embeds n8n and Langfuse in iframes for local development. Those services often respond with frame-blocking headers (`X-Frame-Options`, CSP `frame-ancestors`) on their default localhost URLs, which prevents embedding from the portal origin.

Running the portal in Docker Compose must remain straightforward: developers expect hot reload, predictable URLs, and no manual header patching inside third-party images.

## Decision

1. Run **Caddy** reverse proxies as dedicated Compose services (`embed-proxy-n8n`, `embed-proxy-langfuse`) that expose iframe-friendly endpoints on host ports **5680** (n8n editor/UI path) and **3002** (Langfuse for portal use).
2. Store proxy configs under `docker/embed-proxy/` (e.g. `n8n.Caddyfile`, `langfuse.Caddyfile`).
3. Point portal defaults at those URLs from the browser’s perspective: `N8N_EDITOR_URL` → `http://localhost:5680`, Langfuse via `PORTAL_LANGFUSE_URL` → `http://localhost:3002`.
4. In the portal UI (`EmbeddedProjectsPanel`), treat localhost embeds as allowed **only** when the URL uses these proxy ports; otherwise prefer opening the raw service URL in a new tab instead of a broken iframe.
5. For **local-only** ergonomics, allow a documented dev fallback when `NEXTAUTH_SECRET` is unset if the runtime is clearly local (localhost URLs or non-production); production-like deployments must set `NEXTAUTH_SECRET` explicitly.

## Consequences

**Positive**

- Dashboard embeds work locally without forking n8n/Langfuse images for header tweaks.
- Single compose stack remains the source of truth for dependencies between portal, proxies, and backends.

**Negative / constraints**

- Operators must use the proxy URLs for embedding, not raw `:5678` / `:3000` Langfuse URLs from the portal iframe.
- n8n continues to require embedding-friendly settings (e.g. `N8N_EDITOR_ALLOW_EMBEDDING`) in addition to the proxy.

**Follow-ups**

- Phone preview loop, feedback widget, and feedback-to-code workflows are out of scope for this ADR; see repository roadmap.

## Notes

- Full stack with watch mode: `npm run dev` (`docker compose up --watch`).
