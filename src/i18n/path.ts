import { routing, type AppLocale } from "@/i18n/routing";

export function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split("/")[1] ?? "";
  return isAppLocale(segment) ? segment : routing.defaultLocale;
}

/** `/en/login` → `/login`, `/de` → `/` */
export function pathnameWithoutLocale(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "";
  if (!isAppLocale(segment)) {
    return pathname;
  }
  const rest = pathname.slice(segment.length + 1);
  return rest.length === 0 ? "/" : rest;
}

export function withLocale(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}
