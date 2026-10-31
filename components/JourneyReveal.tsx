"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatDuration, tripMinutes, weatherLabel } from "@/lib/format";
import { destinationText, journeyDiary, journeyNote } from "@/lib/game/localize";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Journey } from "@/types/journey";
import { DiaryCard } from "./DiaryCard";
import { OCCharacter } from "./OCCharacter";
import { SouvenirBadge } from "./SouvenirBadge";
import { TravelPhoto } from "./TravelPhoto";
import { cx } from "./ui";

type Props = {
  journey: Journey;
  ocImage: string;
  ocName: string;
  /** Rendered once everything has been revealed. */
  actions: ReactNode;
};

/** Stages: 0 back · 1 destination · 2 photo · 3 diary · 4 souvenir · 5 actions */
export function JourneyReveal({ journey, ocImage, ocName, actions }: Props) {
  const { m, locale } = useI18n();
  const [stage, setStage] = useState(0);
  const diary = journeyDiary(journey, locale);
  const note = journeyNote(journey, locale);
  const lines = diary.split("\n").length + (note ? 1 : 0);
  const place = journey.destination && destinationText(journey.destination, locale);
  const early = journey.status === "interrupted";

  useEffect(() => {
    const diaryAt = 5000;
    const times = [1500, 2900, diaryAt, diaryAt + lines * 900 + 700, diaryAt + lines * 900 + 1500];
    const ids = times.map((t, i) => window.setTimeout(() => setStage((s) => Math.max(s, i + 1)), t));
    return () => ids.forEach(window.clearTimeout);
  }, [lines]);

  const show = (n: number) => stage >= n;

  return (
    <div onClick={() => setStage(5)} className="space-y-6">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="animate-fade-up">
          <OCCharacter src={ocImage} name={ocName} size={show(1) ? 96 : 150} motion="bob" />
        </div>
        <h1 className="mt-3 text-2xl font-bold animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {early ? m.reveal.early(ocName) : m.reveal.back}
        </h1>
        {early && <p className="mt-1 text-sm text-ink-soft animate-fade-up" style={{ animationDelay: "0.5s" }}>{m.reveal.earlyBody}</p>}
      </div>

      {show(1) && journey.destination && place && (
        <div className="flex flex-col items-center">
          <div className="animate-stamp rounded-xl border-[3px] border-double border-clay/70 px-5 py-2 text-center text-clay">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">{place.region}</p>
            <p className="text-2xl font-bold leading-tight">{place.name}</p>
          </div>
          <p className="mt-2 text-xs text-ink-faint animate-fade-in">
            {formatDuration(tripMinutes(journey), locale)}
            {journey.conditions && ` · ${weatherLabel(journey.conditions, locale)}`}
            {journey.destination.rare && ` · ${m.reveal.rare}`}
          </p>
        </div>
      )}

      {show(2) && (
        <div className="mx-auto max-w-sm animate-fade-up">
          <TravelPhoto journey={journey} ocImage={ocImage} ocName={ocName} develop />
        </div>
      )}

      {show(3) && diary && <DiaryCard diary={diary} signature={ocName} note={note} notePrefix={m.chat.ps} reveal className="animate-fade-up" />}

      {show(4) &&
        (journey.souvenir ? (
          <div className="animate-pop">
            <SouvenirBadge souvenir={journey.souvenir} />
          </div>
        ) : (
          <p className="text-center font-hand text-xl text-ink-faint animate-fade-in">{m.reveal.noSouvenir}</p>
        ))}

      <div className={cx("transition-opacity duration-500", show(5) ? "opacity-100" : "pointer-events-none opacity-0")} onClick={(e) => e.stopPropagation()}>
        {actions}
      </div>

      {!show(5) && <p className="text-center text-xs text-ink-faint">{m.reveal.tapAll}</p>}
    </div>
  );
}
