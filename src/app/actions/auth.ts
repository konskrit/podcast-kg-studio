"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { hasLocale, type Locale } from "next-intl";
import { headers } from "next/headers";

import { signIn } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getBcryptRounds } from "@/libs/config/auth";
import { AUTH_RATE_LIMIT } from "@/libs/constants/auth";
import { prisma } from "@/libs/db";
import type { AuthFormState } from "@/libs/interfaces/auth";
import { credentialsSchema, registerSchema } from "@/libs/schemas/auth";
import { formString } from "@/libs/utils/form";
import { rateLimit } from "@/libs/utils/rate-limit";

function clientKey(prefix: string, email: string, ip: string): string {
  return `${prefix}:${ip}:${email}`;
}

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
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
  locale: Locale,
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
  locale: string,
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);

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
  const { points, durationSec } = AUTH_RATE_LIMIT.register;

  if (!(await rateLimit(clientKey("register", email, ip), points, durationSec))) {
    return { errorKey: "tooManyAttempts" };
  }

  const passwordHash = await bcrypt.hash(
    parsed.data.password,
    getBcryptRounds(),
  );

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
    resolvedLocale,
  );
  if (signInResult.errorKey) {
    return { errorKey: "createdButSignInFailed" };
  }
  return signInResult;
}

export async function loginAction(
  locale: string,
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const resolvedLocale = resolveLocale(locale);

  const parsed = credentialsSchema.safeParse({
    email: formString(formData.get("email")),
    password: formString(formData.get("password")),
  });

  if (!parsed.success) {
    return { errorKey: "invalidInput" };
  }

  const email = parsed.data.email;
  const ip = await requestIp();
  const { points, durationSec } = AUTH_RATE_LIMIT.login;

  if (!(await rateLimit(clientKey("login", email, ip), points, durationSec))) {
    return { errorKey: "tooManyAttempts" };
  }

  return signInAndGoHome(email, parsed.data.password, resolvedLocale);
}
