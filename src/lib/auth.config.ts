import type { NextAuthConfig } from "next-auth";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/**
 * The half of the Auth.js config that is safe to run on the Edge runtime.
 *
 * Middleware runs on the Edge, where Prisma and bcrypt cannot load. Importing
 * `@/lib/auth` there would pull both in through the Credentials provider and
 * fail the build. So the shared pieces — session strategy and the callbacks
 * that copy `id`/`role` onto the token — live here with no providers, and
 * `@/lib/auth` spreads this and adds the Credentials provider for the Node
 * runtime. Both instances then read and write the same JWT.
 *
 * Keep provider-free. Anything added here must be Edge-compatible.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    // Stay signed in for 30 days of inactivity; each visit within that
    // window resets the clock (updateAge), so an active member effectively
    // never gets logged out until they choose to.
    maxAge: THIRTY_DAYS,
    updateAge: 24 * 60 * 60,
  },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
