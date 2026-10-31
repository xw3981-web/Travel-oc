"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JourneyTimer } from "@/components/JourneyTimer";
import { TravelingScene } from "@/components/TravelingScene";
import { ButtonLink, EmptyState, LoadingState, PageHeader, PageShell } from "@/components/ui";
import { useCurrentJourney, useOC, useOCById } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getOCImage } from "@/types/oc";

export default function JourneyPage() {
  const router = useRouter();
  const { oc: current, loading } = useOC();
  const ocById = useOCById();
  const { m } = useI18n();
  const { journey, traveling, awaitingReveal, resolving, pause, resume, endEarly } = useCurrentJourney();
  const [ending, setEnding] = useState(false);
  const oc = (journey && ocById(journey.ocId)) ?? current;

  useEffect(() => {
    if (awaitingReveal) router.replace("/return");
  }, [awaitingReveal, router]);

  if (loading || awaitingReveal) return <LoadingState />;
  if (resolving && !ending) return <LoadingState label={m.common.onTheirWayBack} />;

  if (!oc || !journey || !traveling) {
    return (
      <PageShell>
        <PageHeader title={m.journey.title} back="/" />
        <EmptyState
          emoji="🏡"
          title={oc ? m.journey.isHome(oc.name) : m.journey.nobody}
          body={oc ? m.journey.homeBody : m.journey.nobodyBody}
          action={<ButtonLink href={oc ? "/prepare" : "/create"}>{oc ? m.journey.plan : m.common.createOC}</ButtonLink>}
        />
      </PageShell>
    );
  }

  async function handleEnd() {
    setEnding(true);
    const done = await endEarly();
    if (!done) setEnding(false);
  }

  return (
    <PageShell className="flex min-h-dvh flex-col justify-center">
      <div className="animate-fade-in">
        <TravelingScene src={getOCImage(oc)} name={oc.name} paused={!!journey.pausedAt} />
      </div>
      <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <JourneyTimer
          journey={journey}
          ocName={oc.name}
          onPause={() => void pause()}
          onResume={() => void resume()}
          onEndEarly={() => void handleEnd()}
          ending={ending}
        />
      </div>
    </PageShell>
  );
}
