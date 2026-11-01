"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DiaryCard } from "@/components/DiaryCard";
import { OwnerChat } from "@/components/OwnerChat";
import { SouvenirBadge } from "@/components/SouvenirBadge";
import { TravelPhoto } from "@/components/TravelPhoto";
import { ButtonLink, EmptyState, LoadingState, PageHeader, PageShell, PaperCard } from "@/components/ui";
import { FOODS } from "@/lib/game/foods";
import { destinationText, foodText, journeyDiary, journeyNote } from "@/lib/game/localize";
import { formatDate, formatDuration, formatTime, timeOfDayLabel, tripMinutes, weatherLabel } from "@/lib/format";
import { useGame } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getOCImage } from "@/types/oc";

/** `/album/entry?id=…` — a query string rather than a dynamic segment so the app can be a fully static export. */
export default function JourneyDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <JourneyDetail />
    </Suspense>
  );
}

function JourneyDetail() {
  const id = useSearchParams().get("id");
  const { ocs, journeys, status } = useGame();
  const { m, locale } = useI18n();

  if (status === "loading") return <LoadingState />;

  const journey = journeys.find((j) => j.id === id && j.status !== "traveling");
  if (!journey) {
    return (
      <PageShell>
        <PageHeader title={m.nav.album} back="/album" />
        <EmptyState
          emoji="🍂"
          title={m.album.fellOut}
          body={m.album.fellOutBody}
          action={<ButtonLink href="/album">{m.album.backToAlbum}</ButtonLink>}
        />
      </PageShell>
    );
  }

  // The OC who went; the departure snapshot only matters if that OC was deleted.
  const oc = ocs.find((o) => o.id === journey.ocId);
  const image = oc ? getOCImage(oc) : undefined;
  const ocName = oc?.name ?? journey.ocName ?? "OC";
  const early = journey.status === "interrupted";
  const place = journey.destination ? destinationText(journey.destination, locale) : undefined;
  const diary = journeyDiary(journey, locale);
  const f = m.album.facts;

  const facts: [string, string][] = [
    [f.date, formatDate(journey.startedAt, locale)],
    [f.leftAt, formatTime(journey.startedAt, locale)],
    [
      f.length,
      early
        ? m.album.partOf(formatDuration(tripMinutes(journey), locale), formatDuration(journey.durationMinutes, locale))
        : formatDuration(journey.durationMinutes, locale),
    ],
    [f.packed, `${FOODS[journey.food].emoji} ${foodText(journey.food, locale).name}`],
  ];
  if (journey.conditions) {
    facts.push([f.weather, `${weatherLabel(journey.conditions, locale)} · ${timeOfDayLabel(journey.conditions, locale)}`]);
  }

  return (
    <PageShell>
      <PageHeader title={place?.name ?? m.album.aTrip} kicker={place?.region} back="/album" />

      <div className="mx-auto mb-6 max-w-sm animate-fade-up">
        <TravelPhoto journey={journey} ocImage={image} ocName={ocName} caption={place?.name} />
      </div>

      {place?.blurb && <p className="mb-6 text-center text-ink-soft">{place.blurb}</p>}

      {diary && <DiaryCard diary={diary} signature={ocName} note={journeyNote(journey, locale)} notePrefix={m.chat.ps} className="mb-6" />}

      {journey.chat && (
        <div className="mb-6">
          <OwnerChat journey={journey} ocName={ocName} ocImage={image} />
        </div>
      )}

      {journey.souvenir && <SouvenirBadge souvenir={journey.souvenir} className="mb-6" />}

      <PaperCard className="mb-6 divide-y divide-line/70 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3">
            <span className="text-ink-faint">{k}</span>
            <span className="text-right font-bold">{v}</span>
          </div>
        ))}
        <div className="flex justify-between px-5 py-3">
          <span className="text-ink-faint">{f.status}</span>
          <span className={early ? "font-bold text-[#4d7487]" : "font-bold text-moss"}>{early ? m.album.early : m.album.full}</span>
        </div>
      </PaperCard>

      <div className="flex gap-2">
        <ButtonLink href="/album" variant="secondary" className="flex-1">
          {m.nav.album}
        </ButtonLink>
        <ButtonLink href="/prepare" className="flex-1">
          {m.album.travelAgain}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
