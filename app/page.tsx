"use client";

import Link from "next/link";
import { AlbumCard } from "@/components/AlbumCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { OCCharacter } from "@/components/OCCharacter";
import { OCRoom } from "@/components/OCRoom";
import { OCSwitcher } from "@/components/OCSwitcher";
import { Onboarding } from "@/components/Onboarding";
import { ButtonLink, cx, HandNote, LanguageToggle, LoadingState, PageShell, PaperCard, SectionTitle } from "@/components/ui";
import { FOOD_LIST } from "@/lib/game/foods";
import { foodText } from "@/lib/game/localize";
import { hashString } from "@/lib/game/random";
import { useCurrentJourney, useJourneys, useNow, useOC, useOCById } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatClock, getRemainingMs } from "@/lib/timer/journeyTimer";
import { getOCImage } from "@/types/oc";

export default function HomePage() {
  const { m, locale } = useI18n();
  const { oc, loading, setOCStyle } = useOC();
  const { journey, traveling, awaitingReveal, resolving } = useCurrentJourney();
  const { journeys } = useJourneys();
  const ocById = useOCById();
  const now = useNow(1000);

  if (loading) return <LoadingState />;
  if (!oc) return <Onboarding />;

  const image = getOCImage(oc);
  const latest = journeys.find((j) => j.ocId === oc.id);
  // Only one trip at a time; it may belong to a different OC than the room on screen.
  const traveler = journey ? (ocById(journey.ocId) ?? oc) : oc;
  const thisOneAway = (traveling || awaitingReveal) && journey?.ocId === oc.id;
  const idle = m.home.idle[hashString(new Date(now).toDateString()) % m.home.idle.length];

  return (
    <PageShell withNav>
      <header className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <HandNote className="text-clay">{m.home.greeting(new Date(now).getHours())}</HandNote>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <Link
              href="/create"
              className="rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-card transition hover:text-ink"
            >
              {m.home.editOC}
            </Link>
          </div>
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{m.home.room(oc.name)}</h1>
      </header>

      <OCSwitcher className="mb-3" />

      <div className="mb-4 animate-fade-in">
        <OCRoom away={thisOneAway}>
          {!thisOneAway && <OCCharacter key={oc.id} src={image} name={oc.name} size={150} />}
        </OCRoom>
      </div>

      {traveling && journey ? (
        <PaperCard className="mb-6 flex items-center gap-4 p-5 animate-fade-up">
          <span className="text-3xl" aria-hidden>
            🧭
          </span>
          <div className="flex-1">
            <p className="font-bold">{m.home.outTraveling(traveler.name)}</p>
            <p className="text-sm text-ink-soft">
              {journey.pausedAt ? m.home.resting : m.home.backIn}{" "}
              <span className="font-bold tabular-nums text-ink">{formatClock(getRemainingMs(journey, now))}</span>
            </p>
          </div>
          <ButtonLink href="/journey" variant="secondary" className="px-4 py-2 text-sm">
            {m.home.peek}
          </ButtonLink>
        </PaperCard>
      ) : awaitingReveal ? (
        <PaperCard className="mb-6 flex items-center gap-4 border-clay/30 p-5 animate-fade-up">
          <span className="animate-bob text-3xl" aria-hidden>
            ✉️
          </span>
          <div className="flex-1">
            <p className="font-bold">{m.home.isBack(traveler.name)}</p>
            <p className="text-sm text-ink-soft">{m.home.leftSomething}</p>
          </div>
          <ButtonLink href="/return" className="px-4 py-2 text-sm">
            {m.home.open}
          </ButtonLink>
        </PaperCard>
      ) : resolving ? (
        <PaperCard className="mb-6 p-5 text-center text-ink-soft">{m.home.doorOpened}</PaperCard>
      ) : (
        <div className="mb-6 animate-fade-up">
          <HandNote className="mb-3 text-center">{m.home.idleLine(oc.name, idle)}</HandNote>
          <ButtonLink href="/prepare" className="w-full py-4 text-base">
            {m.home.send}
          </ButtonLink>
          {oc.styledImageUrl && (
            <div className="mt-3 flex justify-center gap-1 text-xs">
              {(["original", "cartoon"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => void setOCStyle(s)}
                  className={cx(
                    "rounded-full px-3 py-1 font-bold transition",
                    oc.activeStyle === s ? "bg-paper-deep text-ink" : "text-ink-faint hover:text-ink",
                  )}
                >
                  {m.common[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <section className="mb-6">
        <SectionTitle aside={<span className="font-hand text-lg text-ink-faint">{m.home.alwaysStocked}</span>}>{m.home.pantry}</SectionTitle>
        <PaperCard className="grid grid-cols-3 divide-x divide-line/70 py-3">
          {FOOD_LIST.map((f) => {
            const t = foodText(f.id, locale);
            return (
              <div key={f.id} className="flex flex-col items-center px-2 text-center">
                <span className="text-3xl" aria-hidden>
                  {f.emoji}
                </span>
                <span className="mt-1 text-sm font-bold">{t.name}</span>
                <span className="text-[11px] leading-tight text-ink-faint">{t.hint}</span>
              </div>
            );
          })}
        </PaperCard>
      </section>

      <section>
        <SectionTitle
          aside={
            journeys.length > 0 && (
              <Link href="/album" className="text-xs font-bold text-clay hover:underline">
                {m.home.seeAlbum(journeys.length)}
              </Link>
            )
          }
        >
          {m.home.latestTrip}
        </SectionTitle>
        {latest ? (
          <div className="px-2 pt-2">
            <AlbumCard journey={latest} ocImage={image} ocName={oc.name} />
          </div>
        ) : (
          <PaperCard className="px-6 py-8 text-center">
            <p className="text-3xl" aria-hidden>
              🗺️
            </p>
            <p className="mt-2 font-bold">{journeys.length ? m.ocs.noTripsFor(oc.name) : m.home.noTrips}</p>
            <p className="text-sm text-ink-soft">{m.home.noTripsBody}</p>
          </PaperCard>
        )}
      </section>

      <BottomNavigation />
    </PageShell>
  );
}
