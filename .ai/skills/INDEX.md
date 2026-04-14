# TeamFlow Shared Skills Index

This index is the canonical map of repo-owned team skills used by AI and contributors.

## Usage

- Start with `AGENTS.md`.
- Use this index to select task-relevant skills.
- When a skill changes expected engineering behavior, update that skill in the same PR.

## Skills

| Skill | Path | Use When | Owner | Review Cadence |
| --- | --- | --- | --- | --- |
| Delivery Standards | `.ai/skills/delivery-standards/SKILL.md` | Implementing or modifying code | Engineering maintainers | Each sprint |
| Architecture Decisions | `.ai/skills/architecture-decisions/SKILL.md` | Architecture/process behavior changes | Engineering maintainers | Each sprint |
| Repo Workflows | `.ai/skills/repo-workflows/SKILL.md` | Branching, PR prep, release workflows | Engineering maintainers | Each sprint |
| Safety And Secrets | `.ai/skills/safety-and-secrets/SKILL.md` | Handling configuration, logs, credentials, external integrations | Engineering maintainers | Each sprint |
| Service-Specific (Template) | `.ai/skills/service-specific-template/SKILL.md` | Creating new service-level constraints | Service owner + maintainers | Each sprint |

## Skill Authoring Contract

Each shared skill must contain:

1. Purpose
2. Trigger Conditions
3. Mandatory Constraints
4. Examples
5. Anti-Patterns
