import type { NextAuthConfig } from "next-auth";

import {
  getLocaleFromPathname,
  pathnameWithoutLocale,
  withLocale,
} from "@/i18n/path";

const trustHost =
  process.env.AUTH_TRUST_HOST === "true" ||
  process.env.NODE_ENV !== "production";

export const authConfig = {
  trustHost,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
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
      const locale = getLocaleFromPathname(pathname);
      const path = pathnameWithoutLocale(pathname);
      const isLoggedIn = Boolean(auth?.user?.id);
      const isAuthPage = path === "/login" || path === "/register";

      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(
            new URL(withLocale(locale, "/"), request.nextUrl),
          );
        }
        return true;
      }

      if (isLoggedIn) {
        return true;
      }

      const login = new URL(withLocale(locale, "/login"), request.nextUrl);
      login.searchParams.set("callbackUrl", pathname);
      return Response.redirect(login);
    },
  },
} satisfies NextAuthConfig;
