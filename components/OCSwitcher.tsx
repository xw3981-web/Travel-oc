"use client";

/* eslint-disable @next/next/no-img-element -- OC avatars are data URLs */
import Link from "next/link";
import { MAX_OCS } from "./GameProvider";
import { useCurrentJourney, useOC } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getOCImage } from "@/types/oc";
import { cx } from "./ui";

/** Row of OC avatars; tap one to make them current. */
export function OCSwitcher({ showAdd = true, className }: { showAdd?: boolean; className?: string }) {
  const { m } = useI18n();
  const { oc: current, ocs, setActiveOC } = useOC();
  const { journey, traveling } = useCurrentJourney();
  const awayId = traveling ? journey?.ocId : undefined;

  if (ocs.length < 2 && !showAdd) return null;

  return (
    <div role="radiogroup" aria-label={m.ocs.label} className={cx("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-1", className)}>
      {ocs.map((o) => {
        const active = o.id === current?.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            aria-label={m.ocs.switchTo(o.name)}
            onClick={() => void setActiveOC(o.id)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-bold transition",
              active ? "border-clay/50 bg-card text-ink shadow-card" : "border-transparent bg-paper-deep/60 text-ink-soft hover:bg-card",
            )}
          >
            <span className="relative">
              <img src={getOCImage(o)} alt="" className="h-8 w-8 rounded-full bg-paper object-contain" />
              {o.id === awayId && (
                <span className="absolute -bottom-1 -right-1 text-xs" title={m.ocs.away} aria-hidden>
                  🧭
                </span>
              )}
            </span>
            <span className="max-w-[7rem] truncate">{o.name}</span>
          </button>
        );
      })}
      {showAdd && ocs.length < MAX_OCS && (
        <Link
          href="/create?new=1"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1 text-sm font-bold text-ink-soft transition hover:border-clay/50 hover:text-ink"
        >
          <span className="text-lg leading-none">＋</span>
          {m.ocs.add}
        </Link>
      )}
    </div>
  );
}
