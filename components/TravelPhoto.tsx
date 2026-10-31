"use client";

/* eslint-disable @next/next/no-img-element -- generated data-URL images */
import { filmStamp } from "@/lib/format";
import { destinationText } from "@/lib/game/localize";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Journey } from "@/types/journey";
import { cx } from "./ui";

type Props = {
  journey: Journey;
  ocImage?: string;
  ocName?: string;
  caption?: string;
  develop?: boolean;
  /** No frame or tilt — for embedding inside another card. */
  flat?: boolean;
  className?: string;
};

const PLACEMENT = {
  wide: { height: "36%", bottom: "6%" },
  medium: { height: "52%", bottom: "2%" },
  close: { height: "70%", bottom: "-6%" },
} as const;

const X = { left: "26%", center: "50%", right: "74%" } as const;

/** A polaroid-style travel snapshot. In mock mode the OC is pasted in like a sticker. */
export function TravelPhoto({ journey, ocImage, ocName, caption, develop = false, flat = false, className }: Props) {
  const { m, locale } = useI18n();
  const comp = journey.composition;
  const placeName = journey.destination ? destinationText(journey.destination, locale).name : m.album.aTrip;
  const showSticker = !journey.travelImageIncludesOC && ocImage && comp;
  const place = comp ? PLACEMENT[comp.shot] : PLACEMENT.medium;
  const tilt = comp?.tilt ?? 0;

  return (
    <figure
      className={cx(!flat && "rounded-[6px] bg-[#fffdf8] p-2.5 pb-3 shadow-lift", className)}
      style={flat ? undefined : { rotate: `${tilt * 0.6}deg` }}
    >
      <div className={cx("relative aspect-[4/3] overflow-hidden rounded-[2px] bg-paper-deep", develop && "animate-develop")}>
        {journey.travelImageUrl ? (
          <img src={journey.travelImageUrl} alt={m.album.snapshotAt(placeName)} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-4xl text-ink-faint">📷</div>
        )}
        {showSticker && (
          <img
            src={ocImage}
            alt={ocName ?? ""}
            className="sticker absolute rounded-xl object-contain"
            style={{ left: X[comp.position], bottom: place.bottom, height: place.height, transform: `translateX(-50%) rotate(${-tilt}deg)` }}
          />
        )}
        {journey.completedAt && (
          <span className="absolute bottom-1.5 right-2 font-mono text-[11px] font-bold tracking-wider text-[#ff9a4a] [text-shadow:0_0_4px_rgba(255,120,40,0.6)]">
            {filmStamp(journey.completedAt)}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(40,25,10,0.18)]" />
      </div>
      {caption && <figcaption className="mt-2 text-center font-hand text-[22px] leading-none text-ink">{caption}</figcaption>}
    </figure>
  );
}
