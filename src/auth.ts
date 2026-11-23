import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { getAuthTimingDummyHash } from "@/libs/config/auth";
import { prisma } from "@/libs/db";
import { credentialsSchema } from "@/libs/schemas/auth";

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
          const hash = user?.passwordHash ?? getAuthTimingDummyHash();
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
