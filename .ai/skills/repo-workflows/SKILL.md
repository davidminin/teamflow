# Repo Workflows

## Purpose

Standardize branch, pull request, and release hygiene across contributors and AI sessions.

## Trigger Conditions

- Creating or updating pull requests.
- Performing branch management or release-related repo operations.
- Making process/documentation updates that affect team workflows.

## Mandatory Constraints

- Keep commits and PRs scoped to a clear objective.
- Include test evidence or rationale when tests are not run.
- Reflect process/architecture behavior changes in policy or skill files.
- Use reviewable, non-destructive git operations by default.

## Examples

- PR includes a concise change summary and test plan checklist.
- A workflow policy change updates `AGENTS.md` and references affected skills.
- Local bootstrap on Windows PowerShell uses `npm run bootstrap:quickstart` or `TEAMFLOW_DEPARTMENTS` / `TEAMFLOW_CREATE_DEFAULT_TEAMS` with `npm run bootstrap` when `npm run` strips `--` script flags (see `README.md` Quickstart).

## Anti-Patterns

- Combining unrelated changes in one PR.
- Merging without documenting validation status.
- Treating local-only habits as team-wide policy.
