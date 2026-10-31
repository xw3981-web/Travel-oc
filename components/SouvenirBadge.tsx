"use client";

import { souvenirText } from "@/lib/game/localize";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Souvenir } from "@/types/journey";
import { cx } from "./ui";

export function SouvenirBadge({ souvenir, compact = false, className }: { souvenir: Souvenir; compact?: boolean; className?: string }) {
  const { m, locale } = useI18n();
  const t = souvenirText(souvenir, locale);
  if (compact) {
    return (
      <span
        title={t.name}
        className={cx("inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-bold text-ink-soft", className)}
      >
        <span aria-hidden>{souvenir.emoji}</span>
        {t.name}
      </span>
    );
  }
  return (
    <div className={cx("flex items-center gap-4 rounded-3xl border border-line bg-card p-4 shadow-card", className)}>
      <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-dashed border-honey/70 bg-[#fbf1da] text-3xl">
        <span aria-hidden>{souvenir.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-honey">{m.souvenir.label}</p>
        <p className="font-bold text-ink">{t.name}</p>
        <p className="text-sm leading-snug text-ink-soft">{t.note}</p>
      </div>
    </div>
  );
}
