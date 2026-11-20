"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import {
  credentialsSchema,
  firstZodMessage,
  formString,
  registerSchema,
} from "@/lib/auth-schema";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@/generated/prisma/client";

export type AuthFormState = {
  error?: string;
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

async function signInAndGoHome(email: string, password: string): Promise<AuthFormState> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result) {
      if (typeof result === "string") {
        // unexpected URL-only return
      } else if (
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        return { error: "Invalid email or password." };
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Sign-in temporarily unavailable. Try again." };
    }
    throw error;
  }

  redirect("/");
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formString(formData.get("email")),
    password: formString(formData.get("password")),
    name: formString(formData.get("name")) || undefined,
  });

  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error) };
  }

  const email = parsed.data.email;
  const ip = await requestIp();

  if (!rateLimit(clientKey("register", email, ip), 5, 60_000)) {
    return { error: "Too many attempts. Try again in a minute." };
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
      return { error: "An account with that email already exists." };
    }
    throw error;
  }

  const signInResult = await signInAndGoHome(email, parsed.data.password);
  if (signInResult.error) {
    return {
      error: "Account created, but sign-in failed. Try logging in.",
    };
  }
  return signInResult;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formString(formData.get("email")),
    password: formString(formData.get("password")),
  });

  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error) };
  }

  const email = parsed.data.email;
  const ip = await requestIp();

  if (!rateLimit(clientKey("login", email, ip), 10, 60_000)) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  return signInAndGoHome(email, parsed.data.password);
}
