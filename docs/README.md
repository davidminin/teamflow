# TeamFlow documentation

Engineering knowledge lives **in git** so it is reviewed with code and stays traceable.

## What goes where

| Location | Use for |
|----------|---------|
| **`/docs/adr/`** | Architecture decision records (ADR): context, decision, consequences. Canonical for cross-cutting technical choices. |
| **`/docs/architecture/`** | Long-form narratives, diagrams, and topic guides that are not a single decision (optional). |
| **`teams/<dept>/<team>/docs/`** | Team-owned runbooks and scoped how-tos (on-call, workflows, team conventions). |
| **`.ai/skills/`** | Contributor and AI **policy**: triggers, constraints, process—not deep system design. |
| **`README.md`**, **`AGENTS.md`** | Top-level onboarding and repo-wide operating policy. |
| **[ClickUp Knowledge Base](https://app.clickup.com/90171007544/v/l/2kz9rrhr-357)** | Optional pointers for teammates who live in ClickUp: **link to `/docs` on GitHub** (or paste a short summary). Git is canonical; avoid maintaining a parallel full KB unless someone explicitly requires it. |

## Index

- [Architecture Decision Records](/docs/adr/README.md)

When you change architecture or integration contracts, add or update an ADR in the same PR when practical (see `.ai/skills/architecture-decisions/SKILL.md`).
