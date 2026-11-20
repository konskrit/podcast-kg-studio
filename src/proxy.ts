import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

/** Next.js 16+ proxy: locale routing + auth gate (never middleware.ts). */
export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  return intlMiddleware(req as NextRequest);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
