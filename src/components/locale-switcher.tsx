"use client";

import { hasLocale, useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      <span className="sr-only">{t("label")}</span>
      <select
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900"
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (!hasLocale(routing.locales, next)) {
            return;
          }
          router.replace(pathname, { locale: next });
        }}
        aria-label={t("label")}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
