"use client";

import { FOOD_LIST } from "@/lib/game/foods";
import { foodText } from "@/lib/game/localize";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FoodType } from "@/types/journey";
import { cx } from "./ui";

export function FoodSelector({ value, onChange }: { value: FoodType; onChange(food: FoodType): void }) {
  const { m, locale } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={m.prepare.foodLabel}>
      {FOOD_LIST.map((f) => {
        const active = value === f.id;
        const t = foodText(f.id, locale);
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(f.id)}
            className={cx(
              "flex flex-col items-center rounded-2xl border-2 px-2 py-3 transition duration-150",
              active ? "-translate-y-0.5 border-clay bg-card shadow-card" : "border-transparent bg-paper/70 hover:bg-card",
            )}
          >
            <span className={cx("text-4xl transition", active && "animate-pop")} aria-hidden>
              {f.emoji}
            </span>
            <span className="mt-1 text-sm font-bold">{t.name}</span>
            <span className="text-[11px] leading-tight text-ink-faint">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
