import type { NextAuthConfig } from "next-auth";

const trustHost =
  process.env.AUTH_TRUST_HOST === "true" ||
  process.env.NODE_ENV !== "production";

/**
 * Proxy-safe Auth.js config (no Prisma / Node-only imports).
 * Full Credentials + DB checks live in auth.ts.
 */
export const authConfig = {
  trustHost,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Proxy reads session.user.id — must mirror JWT `sub` here (no Prisma).
    session({ session, token }) {
      if (!token.sub) {
        return { ...session, user: undefined };
      }
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user?.id);
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      if (isLoggedIn) {
        return true;
      }

      const login = new URL("/login", request.nextUrl);
      login.searchParams.set("callbackUrl", pathname);
      return Response.redirect(login);
    },
  },
} satisfies NextAuthConfig;
