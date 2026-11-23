"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { registerAction } from "@/app/actions/auth";
import { Link } from "@/i18n/navigation";
import type { AuthFormState } from "@/libs/interfaces/auth";

const initialState: AuthFormState = {};

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const tBrand = useTranslations("Brand");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    registerAction.bind(null, locale),
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          {tBrand("name")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          {t("createAccountTitle")}
        </h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          {t("nameOptional")}
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="rounded border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          {t("email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          {t("password")}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className="rounded border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900"
          />
        </label>
        {state.errorKey ? (
          <p className="text-sm text-red-700" role="alert">
            {t(`errors.${state.errorKey}`)}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("creating") : t("createAccount")}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        {t("alreadyRegistered")}{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          {t("signIn")}
        </Link>
      </p>
    </main>
  );
}
