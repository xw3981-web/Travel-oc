"use client";

import { useState } from "react";
import { tierForMinutes } from "@/lib/game/destinations";
import { tierHint } from "@/lib/game/localize";
import { formatDuration } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cx } from "./ui";

export const PRESETS = [15, 25, 45, 60, 90];
export const MIN_MINUTES = 5;
export const MAX_MINUTES = 180;

export function DurationSelector({ value, onChange }: { value: number; onChange(minutes: number): void }) {
  const { m, locale } = useI18n();
  const [custom, setCustom] = useState(!PRESETS.includes(value));
  const tier = tierForMinutes(value);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRESETS.map((min) => (
          <button
            key={min}
            type="button"
            aria-pressed={!custom && value === min}
            onClick={() => {
              setCustom(false);
              onChange(min);
            }}
            className={cx(
              "rounded-2xl border-2 py-2.5 text-sm font-bold transition",
              !custom && value === min ? "border-clay bg-card shadow-card" : "border-transparent bg-paper/70 text-ink-soft hover:bg-card",
            )}
          >
            {m.duration.preset(min)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setCustom(true)}
          className={cx(
            "rounded-2xl border-2 py-2.5 text-sm font-bold transition",
            custom ? "border-clay bg-card shadow-card" : "border-transparent bg-paper/70 text-ink-soft hover:bg-card",
          )}
        >
          {m.duration.custom}
        </button>
      </div>

      {custom && (
        <div className="mt-4 animate-fade-up rounded-2xl bg-paper/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <label htmlFor="custom-minutes" className="text-sm font-bold">
              {m.duration.customLength}
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={value}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) onChange(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n))));
                }}
                className="w-16 rounded-lg border border-line bg-card px-2 py-1 text-right font-bold tabular-nums outline-none focus:border-clay/60"
                aria-label={m.duration.minutes}
              />
              <span className="text-sm text-ink-soft">{m.duration.min}</span>
            </div>
          </div>
          <input
            id="custom-minutes"
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-clay)]"
          />
          <div className="flex justify-between text-[11px] text-ink-faint">
            <span>{m.duration.minLabel}</span>
            <span>{m.duration.maxLabel}</span>
          </div>
        </div>
      )}

      <p className="mt-4 text-center font-hand text-xl text-ink-soft">
        {m.duration.hint(formatDuration(value, locale), tierHint(tier.tier, locale))}
      </p>
    </div>
  );
}
