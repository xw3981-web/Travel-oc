"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DurationSelector } from "@/components/DurationSelector";
import { FoodSelector } from "@/components/FoodSelector";
import { OCCharacter } from "@/components/OCCharacter";
import { OCSwitcher } from "@/components/OCSwitcher";
import { Button, ButtonLink, EmptyState, LoadingState, PageHeader, PageShell, PaperCard, SectionTitle } from "@/components/ui";
import { FOODS } from "@/lib/game/foods";
import { useCurrentJourney, useOC } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FoodType } from "@/types/journey";
import { getOCImage } from "@/types/oc";

export default function PreparePage() {
  const router = useRouter();
  const { oc, ocs, loading } = useOC();
  const { m } = useI18n();
  const { traveling, awaitingReveal, startJourney } = useCurrentJourney();
  const [food, setFood] = useState<FoodType>("riceball");
  const [minutes, setMinutes] = useState(25);
  const [starting, setStarting] = useState(false);

  // Only one trip at a time.
  useEffect(() => {
    if (starting) return;
    if (traveling) router.replace("/journey");
    else if (awaitingReveal) router.replace("/return");
  }, [traveling, awaitingReveal, starting, router]);

  if (loading || traveling || awaitingReveal) return <LoadingState />;

  if (!oc) {
    return (
      <PageShell>
        <PageHeader title={m.prepare.title} back="/" />
        <EmptyState
          emoji="🎒"
          title={m.prepare.noOC}
          body={m.prepare.noOCBody}
          action={<ButtonLink href="/create">{m.common.createOC}</ButtonLink>}
        />
      </PageShell>
    );
  }

  async function start() {
    setStarting(true);
    try {
      await startJourney({ food, durationMinutes: minutes });
      router.push("/journey");
    } catch {
      setStarting(false);
    }
  }

  return (
    <PageShell>
      <PageHeader title={m.prepare.title} kicker={m.prepare.kicker} back="/" />

      {ocs.length > 1 && (
        <section className="mb-4">
          <SectionTitle>{m.ocs.traveler}</SectionTitle>
          <OCSwitcher showAdd={false} />
        </section>
      )}

      <div className="relative mb-5 flex flex-col items-center">
        <OCCharacter key={oc.id} src={getOCImage(oc)} name={oc.name} size={150} backpack />
        <span key={food} className="absolute right-[18%] top-4 animate-pop text-3xl" aria-hidden>
          {FOODS[food].emoji}
        </span>
        <p className="mt-2 font-hand text-xl text-ink-soft">{m.prepare.tying(oc.name)}</p>
      </div>

      <section className="mb-5">
        <SectionTitle>{m.prepare.snack}</SectionTitle>
        <PaperCard className="p-3">
          <FoodSelector value={food} onChange={setFood} />
        </PaperCard>
      </section>

      <section className="mb-7">
        <SectionTitle>{m.prepare.focus}</SectionTitle>
        <PaperCard className="p-4">
          <DurationSelector value={minutes} onChange={setMinutes} />
        </PaperCard>
      </section>

      <Button className="w-full py-4 text-base" onClick={start} disabled={starting}>
        {starting ? m.prepare.starting : m.prepare.start}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-faint">{m.prepare.upToThem}</p>
    </PageShell>
  );
}
