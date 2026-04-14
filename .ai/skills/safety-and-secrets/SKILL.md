# Safety And Secrets

## Purpose

Protect credentials and sensitive data while maintaining secure operational defaults.

## Trigger Conditions

- Editing environment/configuration files.
- Adding integrations, logs, telemetry, or external API usage.
- Handling data that may contain user, org, or infrastructure details.

## Mandatory Constraints

- Never commit secrets or credentials to the repository.
- Redact sensitive values from logs, docs, and examples.
- Prefer scoped, least-privilege credentials.
- Use `.env.example` placeholders rather than real values.

## Examples

- New integration docs use placeholder keys and reference `.env` variables.
- Debug logs are sanitized before being checked into tests or fixtures.

## Anti-Patterns

- Committing live API tokens in scripts or docs.
- Copying production-like data into tests without sanitization.
- Logging full request payloads that may include secrets.
