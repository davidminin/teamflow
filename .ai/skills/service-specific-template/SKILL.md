# Service-Specific Skill Template

## Purpose

Provide a reusable template for constraints that apply to one service/domain.

## Trigger Conditions

- A team introduces service-specific workflows not covered by global skills.
- A service has unique operational, quality, or compliance requirements.

## Mandatory Constraints

- Add a clear service name and owner.
- Define non-negotiable constraints for the service.
- Include validation expectations (tests/monitoring/runbooks).
- Keep this aligned with `AGENTS.md` and shared standards.

## Examples

- A `portal-ui` skill that enforces accessibility and browser support constraints.
- An `n8n-flows` skill that enforces flow naming and rollout checks.

## Anti-Patterns

- Duplicating global policy content with minor wording changes.
- Creating service skills without an assigned owner.
- Defining conflicting guidance versus `AGENTS.md`.
