import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { credentialsSchema } from "@/lib/auth-schema";
import { prisma } from "@/lib/db";

/** Precomputed bcrypt hash so missing-user paths still pay compare cost. */
const TIMING_DUMMY_HASH =
  "$2b$12$7GX9i8yO5.U3PjtlNR6aEuNKnamtGhMu94KIkGZGGRR/FIfuJM5OW";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const email = parsed.data.email;
          const user = await prisma.user.findUnique({ where: { email } });
          const hash = user?.passwordHash ?? TIMING_DUMMY_HASH;
          const valid = await bcrypt.compare(parsed.data.password, hash);

          if (!user || !valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("authorize failed", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        return token;
      }

      if (!token.sub) {
        return token;
      }

      const exists = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true },
      });

      if (!exists) {
        return {};
      }

      return token;
    },
    session({ session, token }) {
      // Same contract as auth.config session (proxy + server).
      if (!token.sub) {
        return { ...session, user: undefined };
      }
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
