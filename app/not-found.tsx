"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function NotFound() {
  const { m } = useI18n();
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 text-center">
      <div>
        <p className="text-5xl" aria-hidden>
          🗺️
        </p>
        <h1 className="mt-3 text-xl font-bold">{m.notFound.title}</h1>
        <p className="mt-1 text-ink-soft">{m.notFound.body}</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-clay px-6 py-3 font-bold text-card">
          {m.notFound.home}
        </Link>
      </div>
    </main>
  );
}
