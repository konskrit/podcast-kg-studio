import type { ReactNode } from "react";

import "./globals.css";

/** Root shell — `<html>` / `<body>` live under `[locale]` for next-intl. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
