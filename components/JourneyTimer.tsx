"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import { useNow } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatClock, getElapsedMinutes, getProgress, getRemainingMs } from "@/lib/timer/journeyTimer";
import type { Journey } from "@/types/journey";
import { Button } from "./ui";

type Props = {
  journey: Journey;
  ocName: string;
  onPause(): void;
  onResume(): void;
  onEndEarly(): void;
  ending: boolean;
};

export function JourneyTimer({ journey, ocName, onPause, onResume, onEndEarly, ending }: Props) {
  const { m, locale } = useI18n();
  const now = useNow(500);
  const [confirming, setConfirming] = useState(false);
  const remaining = getRemainingMs(journey, now);
  const progress = getProgress(journey, now);
  const paused = !!journey.pausedAt;
  const message = m.journey.messages[Math.floor((now - new Date(journey.startedAt).getTime()) / 300_000) % m.journey.messages.length];

  useEffect(() => {
    const prev = document.title;
    document.title = `${paused ? "⏸ " : ""}${formatClock(remaining)} · Travel OC`;
    return () => {
      document.title = prev;
    };
  }, [remaining, paused]);

  return (
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">{paused ? m.journey.paused : m.journey.traveling(ocName)}</p>
      <p className="mt-1 text-6xl font-bold tabular-nums tracking-tight text-ink sm:text-7xl" aria-live="off">
        {formatClock(remaining)}
      </p>
      <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-clay/70 transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mx-auto mt-5 max-w-xs font-hand text-[22px] leading-snug text-ink-soft">{paused ? m.journey.takeYourTime : message}</p>

      <div className="mt-8">
        {confirming ? (
          <div className="mx-auto max-w-xs animate-fade-up rounded-3xl border border-line bg-card p-4 shadow-card">
            <p className="font-bold">{m.journey.callHome(ocName)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {m.journey.beenOut(formatDuration(Math.max(1, getElapsedMinutes(journey, now)), locale))}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1 whitespace-nowrap px-3 py-2.5 text-sm" onClick={() => setConfirming(false)} disabled={ending}>
                {m.journey.keepGoing}
              </Button>
              <Button className="flex-1 whitespace-nowrap px-3 py-2.5 text-sm" onClick={onEndEarly} disabled={ending}>
                {ending ? m.journey.headingHome : m.journey.comeHome}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            {paused ? (
              <Button variant="secondary" onClick={onResume} className="min-w-28">
                {m.journey.resume}
              </Button>
            ) : (
              <Button variant="secondary" onClick={onPause} className="min-w-28">
                {m.journey.pause}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              {m.journey.endEarly}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
