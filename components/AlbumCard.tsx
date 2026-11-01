"use client";

/* eslint-disable @next/next/no-img-element -- OC avatar is a data URL */
import Link from "next/link";
import { formatDate, formatDuration, tripMinutes } from "@/lib/format";
import { destinationText, journeyDiary, souvenirText } from "@/lib/game/localize";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Journey } from "@/types/journey";
import { TravelPhoto } from "./TravelPhoto";
import { cx } from "./ui";

type Props = {
  journey: Journey;
  ocImage?: string;
  ocName?: string;
  index?: number;
};

const TILTS = [-1.6, 1.2, -0.6, 1.8, -1.1, 0.7];

export function AlbumCard({ journey, ocImage, ocName, index = 0 }: Props) {
  const { m, locale } = useI18n();
  const early = journey.status === "interrupted";
  const firstLine = journeyDiary(journey, locale).split("\n")[0];
  const place = journey.destination && destinationText(journey.destination, locale);
  const tilt = TILTS[index % TILTS.length];

  return (
    <Link
      href={`/album/entry?id=${journey.id}`}
      className="group block animate-fade-up rounded-[22px] border border-line bg-card p-3 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-clay"
      style={{ rotate: `${tilt}deg`, animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative">
        <span aria-hidden className="washi absolute -top-4 left-6 z-10 h-5 w-16 -rotate-6 rounded-sm bg-tape/80" />
        <TravelPhoto journey={journey} ocImage={ocImage} ocName={ocName} flat />
      </div>
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-ink">{place?.name}</h3>
            <p className="text-xs text-ink-faint">
              {formatDate(journey.startedAt, locale)} · {formatDuration(tripMinutes(journey), locale)}
            </p>
          </div>
          {journey.souvenir && (
            <span title={souvenirText(journey.souvenir, locale).name} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-honey/70 bg-[#fbf1da] text-lg">
              {journey.souvenir.emoji}
            </span>
          )}
        </div>
        {firstLine && <p className="mt-2 line-clamp-2 font-hand text-lg leading-snug text-ink-soft">{locale === "zh" ? `「${firstLine}」` : `“${firstLine}”`}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            {ocImage && <img src={ocImage} alt="" className="h-5 w-5 rounded-full bg-paper object-contain" />}
            {ocName ?? journey.ocName}
          </span>
          <span
            className={cx(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              early ? "bg-sky/20 text-[#4d7487]" : "bg-moss/15 text-moss",
            )}
          >
            {early ? m.album.early : m.album.full}
          </span>
        </div>
      </div>
    </Link>
  );
}
