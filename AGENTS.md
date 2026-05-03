# TeamFlow AI Operating Policy

This document is the canonical, repo-level policy for AI-assisted work in TeamFlow.

## Scope

- Applies to all AI sessions and contributors working in this repository.
- If local or personal guidance conflicts with this file, this file wins.
- Shared team skills referenced here are the only authoritative skill source.

## Mandatory Startup Context

Before coding, AI assistants and contributors should load:

1. This file (`AGENTS.md`)
2. `.ai/skills/INDEX.md`
3. Any skill listed in the index that matches the current task

## Definition Of Done

Every code change should:

- Solve the requested behavior end-to-end.
- Include or update tests when behavior changes.
- Pass project checks (`npm test` and relevant lint/type checks).
- Update docs and/or skills when workflow, architecture, or process changes.
- Avoid introducing secrets, insecure defaults, or unsupported migrations.

## Engineering Constraints

- Prefer small, reviewable changes over broad rewrites.
- Keep backward compatibility unless a breaking change is explicitly requested.
- Do not commit generated artifacts unless required by repo conventions.
- Keep changes consistent with existing project style and naming.
- Use clear, minimal comments only where logic is non-obvious.

## Security And Data Handling

- Never commit secrets, tokens, private keys, or raw credential dumps.
- Redact sensitive values in logs, examples, and screenshots.
- Treat all production-like data as sensitive by default.
- Prefer least-privilege integrations and scoped credentials.

## Architecture And Process Change Policy

If implementation changes how the system is built or operated, update:

- `AGENTS.md` when policy-level expectations change, and/or
- the relevant `.ai/skills/*/SKILL.md` file when task-specific behavior changes.

No architecture/process behavior change is complete without these updates.

## Ownership And Review Cadence

- Owners: Engineering team maintainers for TeamFlow.
- Policy and shared-skill updates require code review approval.
- Review cadence: validate policy and skill accuracy at least once per sprint.

## Team Skill Contract

All shared skill files must include:

- Purpose
- Trigger conditions
- Mandatory constraints
- Examples
- Anti-patterns

See `.ai/skills/INDEX.md` for the canonical list and owners.

## Local Development Validation Notes

- Verified bootstrap command: `npm run bootstrap -- --departments "qa,eng,ops" --create-default-teams`.
- `docker compose up -d` requires Docker daemon/Desktop running; otherwise startup fails before containers are created.
- For portal-only development from `apps/portal`, copy env with `cp .env.example .env.local`; the portal template includes `DATABASE_URL` for local Prisma usage.
- Worker scripts (`npm run start`, `npm run mcp`) load `worker/.env`; keep `worker/.env.example` keys aligned with runtime expectations (`GITHUB_OWNER`, `GITHUB_REPO`).
