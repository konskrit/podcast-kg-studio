import { createNavigation } from "next-intl/navigation";

import { routing } from "@/i18n/routing";

/** Locale-aware navigation — use these instead of next/link + next/navigation. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
