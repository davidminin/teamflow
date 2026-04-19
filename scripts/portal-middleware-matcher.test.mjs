import assert from "node:assert/strict";
import test from "node:test";

/**
 * Must stay in sync with `apps/portal/src/middleware.ts` `config.matcher[0]`.
 * When this pattern matches, `withAuth` runs; public routes must not match.
 */
const MIDDLEWARE_MATCHER = /^\/((?!login|register|api\/auth|api\/health|_next|favicon\.ico).*)/;

test("register and login pages are not behind auth middleware", () => {
  assert.equal(MIDDLEWARE_MATCHER.test("/register"), false);
  assert.equal(MIDDLEWARE_MATCHER.test("/login"), false);
});

test("register API is not behind auth middleware", () => {
  assert.equal(MIDDLEWARE_MATCHER.test("/api/auth/register"), false);
});

test("protected app routes match middleware", () => {
  assert.equal(MIDDLEWARE_MATCHER.test("/tasks"), true);
  assert.equal(MIDDLEWARE_MATCHER.test("/settings"), true);
});
