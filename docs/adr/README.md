# Architecture Decision Records

Numbered ADRs describe significant, stable technical choices. Each file is one decision.

## Format

- Filename: `adr-NNNN-short-kebab-title.md` (four-digit zero-padded number).
- Prefer YAML frontmatter with at least `status` and `date`.
- Body: **Context** → **Decision** → **Consequences** (optional **Notes** for ops links).

### Status values

| Status | Meaning |
|--------|---------|
| `proposed` | Under discussion |
| `accepted` | Active; follow unless superseded |
| `deprecated` | No longer recommended |
| `superseded` | Replaced; link to the newer ADR in frontmatter |

## Decisions

| ADR | Title | Status |
|-----|-------|--------|
| [0001](/docs/adr/adr-0001-portal-local-embed-proxies.md) | Portal local embed proxies (n8n, Langfuse) | accepted |
