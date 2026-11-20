"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { signIn } from "@/auth";
import {
  credentialsSchema,
  formString,
  registerSchema,
} from "@/lib/auth-schema";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@/generated/prisma/client";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export type AuthErrorKey =
  | "invalidCredentials"
  | "unavailable"
  | "tooManyAttempts"
  | "accountExists"
  | "createdButSignInFailed"
  | "invalidInput";

export type AuthFormState = {
  errorKey?: AuthErrorKey;
};

function clientKey(prefix: string, email: string, ip: string): string {
  return `${prefix}:${ip}:${email}`;
}

async function requestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

async function signInAndGoHome(
  email: string,
  password: string,
  locale: AppLocale,
): Promise<AuthFormState> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error
    ) {
      return { errorKey: "invalidCredentials" };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { errorKey: "invalidCredentials" };
      }
      return { errorKey: "unavailable" };
    }
    throw error;
  }

  redirect({ href: "/", locale });
  return {};
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = (await getLocale()) as AppLocale;

  const parsed = registerSchema.safeParse({
    email: formString(formData.get("email")),
    password: formString(formData.get("password")),
    name: formString(formData.get("name")) || undefined,
  });

  if (!parsed.success) {
    return { errorKey: "invalidInput" };
  }

  const email = parsed.data.email;
  const ip = await requestIp();

  if (!rateLimit(clientKey("register", email, ip), 5, 60_000)) {
    return { errorKey: "tooManyAttempts" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { errorKey: "accountExists" };
    }
    throw error;
  }

  const signInResult = await signInAndGoHome(
    email,
    parsed.data.password,
    locale,
  );
  if (signInResult.errorKey) {
    return { errorKey: "createdButSignInFailed" };
  }
  return signInResult;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = (await getLocale()) as AppLocale;

  const parsed = credentialsSchema.safeParse({
    email: formString(formData.get("email")),
    password: formString(formData.get("password")),
  });

  if (!parsed.success) {
    return { errorKey: "invalidInput" };
  }

  const email = parsed.data.email;
  const ip = await requestIp();

  if (!rateLimit(clientKey("login", email, ip), 10, 60_000)) {
    return { errorKey: "tooManyAttempts" };
  }

  return signInAndGoHome(email, parsed.data.password, locale);
}
