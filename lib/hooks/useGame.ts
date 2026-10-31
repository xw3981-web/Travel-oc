"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "@/components/GameProvider";

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

export function useOC() {
  const { oc, ocs, status, saveOC, deleteOC, setActiveOC, setOCStyle } = useGame();
  return { oc, ocs, loading: status === "loading", saveOC, deleteOC, setActiveOC, setOCStyle };
}

/** Look up any OC (current or not) by id, e.g. the one who went on a given trip. */
export function useOCById() {
  const { ocs } = useGame();
  return useCallback((id: string | undefined) => ocs.find((o) => o.id === id), [ocs]);
}

export function useCurrentJourney() {
  const { activeJourney, status, resolving, startJourney, pause, resume, endEarly, resolveIfDue, archiveActive, answerChat } = useGame();
  return {
    journey: activeJourney,
    traveling: activeJourney?.status === "traveling",
    /** Home but not yet filed into the album. */
    awaitingReveal: !!activeJourney && activeJourney.status !== "traveling",
    loading: status === "loading",
    resolving,
    startJourney,
    pause,
    resume,
    endEarly,
    resolveIfDue,
    archiveActive,
    answerChat,
  };
}

/** Finished journeys, newest first. */
export function useJourneys() {
  const { journeys, activeJourneyId, status } = useGame();
  const album = useMemo(
    () =>
      journeys
        .filter((j) => j.status !== "traveling" && (j.savedToAlbum || j.id !== activeJourneyId))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [journeys, activeJourneyId],
  );
  return { journeys: album, loading: status === "loading" };
}

/** Re-renders on an interval; timer values are always derived from timestamps. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
