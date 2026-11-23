import { hasLocale, type Locale } from "next-intl";

import { routing } from "@/i18n/routing";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1] ?? "";
  return hasLocale(routing.locales, segment)
    ? segment
    : routing.defaultLocale;
}

export function pathnameWithoutLocale(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "";
  if (!hasLocale(routing.locales, segment)) {
    return pathname;
  }
  const rest = pathname.slice(segment.length + 1);
  return rest.length === 0 ? "/" : rest;
}

export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}
