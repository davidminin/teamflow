# Delivery Standards

## Purpose

Ensure implementation quality is consistent, test-backed, and review-ready.

## Trigger Conditions

- Any task that modifies product behavior or repository code.
- Any change that can impact runtime behavior, reliability, or developer workflow.

## Mandatory Constraints

- Implement the full requested behavior, not partial scaffolding.
- Add or update tests when behavior changes.
- Keep changes minimal and focused; avoid unrelated refactors.
- Preserve backward compatibility unless explicitly approved.
- Run relevant checks before finalizing (tests, lint, type checks when applicable).

## Examples

- A workflow update that changes runtime output includes an updated test/assertion.
- A bug fix includes a regression test that fails before and passes after the fix.

## Anti-Patterns

- Shipping behavior changes with no validation.
- Touching broad unrelated files "while here."
- Merging known failing checks without explicit approval.
