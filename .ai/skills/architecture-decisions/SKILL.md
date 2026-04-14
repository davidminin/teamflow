# Architecture Decisions

## Purpose

Keep architecture and process decisions explicit, consistent, and captured in-repo.

## Trigger Conditions

- Introducing a new service/component boundary.
- Changing data flow, deployment model, or integration contracts.
- Updating developer workflow that changes how teams build or ship.

## Mandatory Constraints

- Document architecture-impacting changes in the same PR.
- Update `AGENTS.md` for policy-level behavior changes.
- Update the relevant shared skill for task-level process changes.
- Describe intended behavior and migration impact in PR context.

## Examples

- Replacing one connector flow with another includes updated constraints in skill docs.
- New deployment expectations are captured in policy and linked from README.

## Anti-Patterns

- Silent architecture drift with no doc changes.
- Deferring policy updates to "later."
- Conflicting guidance across `AGENTS.md` and skills.
