import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login, /register (auth pages)
     * - /api/auth (NextAuth endpoints)
     * - /api/health (health check)
     * - /_next, /favicon.ico (static assets)
     */
    "/((?!login|register|api/auth|api/health|_next|favicon.ico).*)",
  ],
};
