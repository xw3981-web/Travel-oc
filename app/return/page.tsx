"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JourneyReveal } from "@/components/JourneyReveal";
import { OwnerChat } from "@/components/OwnerChat";
import { Button, ButtonLink, EmptyState, LoadingState, PageHeader, PageShell } from "@/components/ui";
import { useCurrentJourney, useOC, useOCById } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getOCImage } from "@/types/oc";

export default function ReturnPage() {
  const router = useRouter();
  const { oc: current, loading } = useOC();
  const ocById = useOCById();
  const { m } = useI18n();
  const { journey, traveling, awaitingReveal, resolving, archiveActive } = useCurrentJourney();
  const [busy, setBusy] = useState<"save" | "again" | null>(null);
  const oc = (journey && ocById(journey.ocId)) ?? current;

  useEffect(() => {
    if (traveling && !resolving) router.replace("/journey");
  }, [traveling, resolving, router]);

  if (loading || (traveling && !busy)) return <LoadingState label={resolving ? m.common.onTheirWayBack : undefined} />;

  if (busy) return <LoadingState label={m.reveal.pasting} />;

  if (!oc || !journey || !awaitingReveal) {
    return (
      <PageShell>
        <PageHeader title={m.reveal.welcomeBack} back="/" />
        <EmptyState
          emoji="📭"
          title={m.reveal.nothing}
          body={m.reveal.nothingBody}
          action={<ButtonLink href="/album">{m.reveal.openAlbum}</ButtonLink>}
        />
      </PageShell>
    );
  }

  async function finish(next: "save" | "again") {
    setBusy(next);
    const saved = await archiveActive();
    if (!saved) {
      setBusy(null);
      return;
    }
    router.push(next === "save" ? `/album/${saved.id}` : "/prepare");
  }

  return (
    <PageShell>
      <JourneyReveal
        journey={journey}
        ocImage={getOCImage(oc)}
        ocName={oc.name}
        actions={
          <div className="flex flex-col gap-2">
            <OwnerChat journey={journey} ocName={oc.name} ocImage={getOCImage(oc)} interactive />
            <div className="h-2" />
            <Button className="w-full py-4 text-base" onClick={() => void finish("save")} disabled={!!busy}>
              {busy === "save" ? m.reveal.pasting : m.reveal.save}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => void finish("again")} disabled={!!busy}>
              {m.reveal.again}
            </Button>
          </div>
        }
      />
    </PageShell>
  );
}
