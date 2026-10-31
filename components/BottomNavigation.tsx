"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentJourney } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cx } from "./ui";

export function BottomNavigation() {
  const pathname = usePathname();
  const { traveling, awaitingReveal } = useCurrentJourney();
  const { m } = useI18n();

  const items = [
    { href: "/", label: m.nav.room, icon: "🏠", active: pathname === "/" },
    traveling
      ? { href: "/journey", label: m.nav.away, icon: "🧭", active: pathname === "/journey" }
      : awaitingReveal
        ? { href: "/return", label: m.nav.back, icon: "✉️", active: pathname === "/return", dot: true }
        : { href: "/prepare", label: m.nav.travel, icon: "🎒", active: pathname === "/prepare" },
    { href: "/album", label: m.nav.album, icon: "📔", active: pathname.startsWith("/album") },
  ];

  return (
    <nav
      aria-label={m.nav.main}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-sm items-center justify-around rounded-full border border-line bg-card/95 px-2 py-1.5 shadow-lift backdrop-blur">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={it.active ? "page" : undefined}
            className={cx(
              "relative flex min-w-[76px] flex-col items-center rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wide transition",
              it.active ? "bg-paper-deep text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            <span className="text-xl leading-6" aria-hidden>
              {it.icon}
            </span>
            {it.label}
            {"dot" in it && it.dot && <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-clay" />}
          </Link>
        ))}
      </div>
    </nav>
  );
}
