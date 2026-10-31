"use client";

import { AlbumCard } from "@/components/AlbumCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ButtonLink, cx, EmptyState, HandNote, LanguageToggle, LoadingState, PageShell } from "@/components/ui";
import { formatMonth } from "@/lib/format";
import { useState } from "react";
import { useJourneys, useOC, useOCById } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/locale";
import type { Journey } from "@/types/journey";
import { getOCImage } from "@/types/oc";

function groupByMonth(journeys: Journey[], locale: Locale) {
  const groups: { month: string; items: Journey[] }[] = [];
  for (const j of journeys) {
    const month = formatMonth(j.startedAt, locale);
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(j);
    else groups.push({ month, items: [j] });
  }
  return groups;
}

export default function AlbumPage() {
  const { oc, ocs, loading } = useOC();
  const { m, locale } = useI18n();
  const { journeys: all } = useJourneys();
  const ocById = useOCById();
  const [filter, setFilter] = useState<string>("all");
  const journeys = filter === "all" ? all : all.filter((j) => j.ocId === filter);
  const multi = ocs.length > 1;
  // Name the album after the OC only when every page is theirs.
  const onlyOne = !multi && !!oc && all.every((j) => j.ocId === oc.id);

  if (loading) return <LoadingState />;

  const places = new Set(journeys.map((j) => j.destination?.id)).size;
  const souvenirs = journeys.filter((j) => j.souvenir).length;

  return (
    <PageShell withNav>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <HandNote className="text-clay">{m.album.kicker}</HandNote>
          <h1 className="text-2xl font-bold">{m.album.title(onlyOne ? oc?.name : undefined)}</h1>
          {journeys.length > 0 && <p className="mt-1 text-sm text-ink-soft">{m.album.stats(journeys.length, places, souvenirs)}</p>}
        </div>
        <LanguageToggle className="mt-1 shrink-0" />
      </header>

      {multi && all.length > 0 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={m.ocs.label}>
          {[{ id: "all", name: m.ocs.all }, ...ocs].map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={filter === o.id}
              onClick={() => setFilter(o.id)}
              className={cx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold transition",
                filter === o.id ? "border-clay/50 bg-card text-ink shadow-card" : "border-transparent bg-paper-deep/60 text-ink-soft hover:bg-card",
              )}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {journeys.length === 0 ? (
        <EmptyState
          emoji="📔"
          title={m.album.empty}
          body={filter === "all" && multi ? m.home.noTripsBody : m.album.emptyBody(ocById(filter)?.name ?? oc?.name)}
          action={<ButtonLink href={oc ? "/prepare" : "/create"}>{oc ? m.album.firstTrip : m.common.createOC}</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          {groupByMonth(journeys, locale).map((g) => (
            <section key={g.month}>
              <h2 className="mb-4 px-1 font-hand text-2xl text-ink-soft">{g.month}</h2>
              <div className="grid grid-cols-1 gap-x-5 gap-y-7 px-1 sm:grid-cols-2">
                {g.items.map((j, i) => {
                  const who = ocById(j.ocId);
                  return <AlbumCard key={j.id} journey={j} ocImage={who && getOCImage(who)} ocName={who?.name ?? j.ocName} index={i} />;
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <BottomNavigation />
    </PageShell>
  );
}
