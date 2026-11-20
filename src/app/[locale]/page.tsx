import { getTranslations, setRequestLocale } from "next-intl/server";

import { notFound } from "next/navigation";

import { auth, signOut } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { isAppLocale } from "@/i18n/path";

/** Session gate uses cookies — allow blocking render under Cache Components. */
export const instant = false;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("Library");
  const tBrand = await getTranslations("Brand");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          {tBrand("name")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-zinc-600">
          {t("signedInAs", { email: user.email ?? "" })}
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: `/${locale}/login` });
        }}
      >
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          {t("signOut")}
        </button>
      </form>
    </main>
  );
}
