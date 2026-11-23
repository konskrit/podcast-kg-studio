import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { locale as localeParam } from "next/root-params";

import "../globals.css";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Podcast KG Studio",
  description: "Local-first grounded podcast studio",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const instant = false;

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await localeParam();
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <div className="flex justify-end px-6 pt-4">
            <LocaleSwitcher />
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
