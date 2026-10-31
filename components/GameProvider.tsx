"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getAIService } from "@/lib/ai";
import { mockAIService } from "@/lib/ai/mockAIService";
import { makeSeed } from "@/lib/game/random";
import { resolveJourney } from "@/lib/game/resolveJourney";
import { getStorageService, StorageError } from "@/lib/storage";
import { isDue, pauseJourney, resumeJourney } from "@/lib/timer/journeyTimer";
import type { Messages } from "@/lib/i18n/messages";
import type { FoodType, Journey } from "@/types/journey";
import type { OC, OCStyle } from "@/types/oc";

export type OCDraft = {
  name: string;
  originalImageUrl: string;
  styledImageUrl?: string;
  activeStyle: OCStyle;
  description?: string;
  palette?: string[];
};

/** Rendered lazily so the toast follows the current language. */
export type Notice = { kind: "info" | "error"; message: (m: Messages) => string };

export const MAX_OCS = 8;

type GameState = {
  status: "loading" | "ready" | "error";
  ocs: OC[];
  activeOcId: string | null;
  journeys: Journey[];
  activeJourneyId: string | null;
};

export type GameContextValue = GameState & {
  /** The OC whose room is shown and who goes on the next trip. */
  oc: OC | null;
  activeJourney: Journey | null;
  notice: Notice | null;
  /** True while a finished trip's photo and diary are being prepared. */
  resolving: boolean;
  dismissNotice(): void;
  /** Creates a new OC (and makes it current) when `id` is omitted; otherwise edits that OC. */
  saveOC(draft: OCDraft, id?: string): Promise<OC>;
  deleteOC(id: string): Promise<void>;
  setActiveOC(id: string): Promise<void>;
  setOCStyle(style: OCStyle): Promise<void>;
  startJourney(input: { food: FoodType; durationMinutes: number }): Promise<Journey>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  endEarly(): Promise<Journey | null>;
  resolveIfDue(): Promise<Journey | null>;
  archiveActive(): Promise<Journey | null>;
  /** Owner tells the OC what they focused on; the OC's reply is saved on the trip. */
  answerChat(activity: string, locale: string): Promise<Journey | null>;
};

export const GameContext = createContext<GameContextValue | null>(null);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function GameProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => getStorageService(), []);
  const [state, setState] = useState<GameState>({ status: "loading", ocs: [], activeOcId: null, journeys: [], activeJourneyId: null });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [resolving, setResolving] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const resolvingIds = useRef(new Set<string>());

  const fail = useCallback((err: unknown) => {
    setNotice({
      kind: "error",
      message: (m) => (err instanceof StorageError ? m.errors.storage[err.code] : m.errors.generic),
    });
  }, []);

  const persistJourney = useCallback(
    async (journey: Journey) => {
      await storage.saveJourney(journey);
      setState((s) => {
        const exists = s.journeys.some((j) => j.id === journey.id);
        return { ...s, journeys: exists ? s.journeys.map((j) => (j.id === journey.id ? journey : j)) : [...s.journeys, journey] };
      });
    },
    [storage],
  );

  const resolve = useCallback(
    async (journey: Journey, mode: "completed" | "interrupted") => {
      if (resolvingIds.current.has(journey.id)) return null;
      // Always the OC who actually went, not whichever room is open now.
      const oc: OC = stateRef.current.ocs.find((o) => o.id === journey.ocId) ?? {
        id: journey.ocId,
        name: journey.ocName ?? "OC",
        originalImageUrl: "",
        activeStyle: "original",
        createdAt: journey.startedAt,
      };
      resolvingIds.current.add(journey.id);
      setResolving(true);
      try {
        const done = await resolveJourney(journey, oc, mode);
        await persistJourney(done);
        return done;
      } catch (err) {
        fail(err);
        return null;
      } finally {
        resolvingIds.current.delete(journey.id);
        setResolving(false);
      }
    },
    [fail, persistJourney],
  );

  // Initial load; also resolves any trip that finished while the app was closed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await storage.load();
        if (cancelled) return;
        const next: GameState = {
          status: "ready",
          ocs: loaded.ocs,
          activeOcId: loaded.activeOcId,
          journeys: loaded.journeys,
          activeJourneyId: loaded.activeJourneyId,
        };
        stateRef.current = next;
        setState(next);
        if (loaded.recovered.length) {
          const items = loaded.recovered;
          setNotice({
            kind: "info",
            message: (m) => m.errors.recovered(items.map(m.errors.recoveredItem).join(", ")),
          });
        }
        const active = loaded.journeys.find((j) => j.id === loaded.activeJourneyId);
        if (active && isDue(active)) await resolve(active, "completed");
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({ ...s, status: "error" }));
        fail(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, resolve, fail]);

  const activeJourney = useMemo(
    () => state.journeys.find((j) => j.id === state.activeJourneyId) ?? null,
    [state.journeys, state.activeJourneyId],
  );

  // Background check so any open screen notices when the trip ends.
  useEffect(() => {
    if (!activeJourney || activeJourney.status !== "traveling") return;
    const tick = () => {
      if (isDue(activeJourney)) void resolve(activeJourney, "completed");
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeJourney, resolve]);

  const saveOC = useCallback(
    async (draft: OCDraft, id?: string) => {
      const existing = id ? stateRef.current.ocs.find((o) => o.id === id) : undefined;
      if (!existing && stateRef.current.ocs.length >= MAX_OCS) {
        setNotice({ kind: "error", message: (m) => m.ocs.limit(MAX_OCS) });
        throw new Error("OC limit reached");
      }
      const now = new Date().toISOString();
      const oc: OC = {
        id: existing?.id ?? uid(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: existing ? now : undefined,
        personality: existing?.personality ?? {
          curiosity: round2(Math.random()),
          sociability: round2(Math.random()),
          adventurousness: round2(Math.random()),
        },
        name: draft.name.trim().slice(0, 24),
        originalImageUrl: draft.originalImageUrl,
        styledImageUrl: draft.styledImageUrl,
        activeStyle: draft.activeStyle === "cartoon" && draft.styledImageUrl ? "cartoon" : "original",
        description: draft.description?.trim() || undefined,
        palette: draft.palette,
      };
      try {
        await storage.saveOC(oc);
        if (!existing) await storage.setActiveOcId(oc.id);
      } catch (err) {
        fail(err);
        throw err;
      }
      setState((s) => ({
        ...s,
        ocs: existing ? s.ocs.map((o) => (o.id === oc.id ? oc : o)) : [...s.ocs, oc],
        activeOcId: existing ? s.activeOcId : oc.id,
      }));
      return oc;
    },
    [storage, fail],
  );

  const deleteOC = useCallback(
    async (id: string) => {
      const s = stateRef.current;
      const away = s.journeys.find((j) => j.id === s.activeJourneyId && j.status === "traveling");
      if (away?.ocId === id) return; // can't delete someone who is out traveling
      const rest = s.ocs.filter((o) => o.id !== id);
      const nextActive = s.activeOcId === id ? (rest[0]?.id ?? null) : s.activeOcId;
      try {
        await storage.deleteOC(id);
        await storage.setActiveOcId(nextActive);
      } catch (err) {
        fail(err);
        return;
      }
      setState((prev) => ({ ...prev, ocs: rest, activeOcId: nextActive }));
    },
    [storage, fail],
  );

  const setActiveOC = useCallback(
    async (id: string) => {
      if (!stateRef.current.ocs.some((o) => o.id === id)) return;
      setState((s) => ({ ...s, activeOcId: id }));
      await storage.setActiveOcId(id).catch(fail);
    },
    [storage, fail],
  );

  const setOCStyle = useCallback(
    async (style: OCStyle) => {
      const s = stateRef.current;
      const oc = s.ocs.find((o) => o.id === s.activeOcId);
      if (!oc || (style === "cartoon" && !oc.styledImageUrl)) return;
      const next = { ...oc, activeStyle: style, updatedAt: new Date().toISOString() };
      try {
        await storage.saveOC(next);
        setState((prev) => ({ ...prev, ocs: prev.ocs.map((o) => (o.id === next.id ? next : o)) }));
      } catch (err) {
        fail(err);
      }
    },
    [storage, fail],
  );

  const startJourney = useCallback(
    async ({ food, durationMinutes }: { food: FoodType; durationMinutes: number }) => {
      const s = stateRef.current;
      const oc = s.ocs.find((o) => o.id === s.activeOcId);
      if (!oc) throw new Error("No OC yet");
      const minutes = Math.min(180, Math.max(1, Math.round(durationMinutes)));
      const startedAt = new Date().toISOString();
      const journey: Journey = {
        id: uid(),
        ocId: oc.id,
        ocName: oc.name,
        startedAt,
        expectedEndAt: new Date(Date.now() + minutes * 60_000).toISOString(),
        durationMinutes: minutes,
        food,
        status: "traveling",
        pausedAt: null,
        pausedTotalMs: 0,
        seed: makeSeed(oc.id, startedAt),
        savedToAlbum: false,
      };
      try {
        await storage.saveJourney(journey);
        await storage.setActiveJourneyId(journey.id);
      } catch (err) {
        fail(err);
        throw err;
      }
      setState((s) => ({ ...s, journeys: [...s.journeys, journey], activeJourneyId: journey.id }));
      return journey;
    },
    [storage, fail],
  );

  const currentTraveling = () => {
    const s = stateRef.current;
    const j = s.journeys.find((x) => x.id === s.activeJourneyId);
    return j && j.status === "traveling" ? j : null;
  };

  const pause = useCallback(async () => {
    const j = currentTraveling();
    if (j) await persistJourney(pauseJourney(j)).catch(fail);
  }, [persistJourney, fail]);

  const resume = useCallback(async () => {
    const j = currentTraveling();
    if (j) await persistJourney(resumeJourney(j)).catch(fail);
  }, [persistJourney, fail]);

  const endEarly = useCallback(async () => {
    const j = currentTraveling();
    return j ? resolve(j, "interrupted") : null;
  }, [resolve]);

  const resolveIfDue = useCallback(async () => {
    const j = currentTraveling();
    return j && isDue(j) ? resolve(j, "completed") : null;
  }, [resolve]);

  const archiveActive = useCallback(async () => {
    const s = stateRef.current;
    const j = s.journeys.find((x) => x.id === s.activeJourneyId);
    if (!j || j.status === "traveling") return null;
    const saved = { ...j, savedToAlbum: true };
    try {
      await storage.saveJourney(saved);
      await storage.setActiveJourneyId(null);
    } catch (err) {
      fail(err);
      return null;
    }
    setState((prev) => ({
      ...prev,
      activeJourneyId: null,
      journeys: prev.journeys.map((x) => (x.id === saved.id ? saved : x)),
    }));
    return saved;
  }, [storage, fail]);

  const answerChat = useCallback(
    async (activity: string, locale: string) => {
      const s = stateRef.current;
      const j = s.journeys.find((x) => x.id === s.activeJourneyId);
      if (!j || j.status === "traveling" || !activity.trim()) return null;
      const who = s.ocs.find((o) => o.id === j.ocId);
      const input = {
        activity: activity.trim().slice(0, 80),
        minutes: j.actualDurationMinutes ?? j.durationMinutes,
        ocName: who?.name ?? j.ocName ?? "OC",
        personality: who?.personality,
        seed: j.seed,
        locale,
      };
      const reply = await getAIService()
        .respondToOwner(input)
        .catch(() => mockAIService.respondToOwner(input));
      const next: Journey = { ...j, chat: { activity: input.activity, ...reply, at: new Date().toISOString() } };
      try {
        await persistJourney(next);
      } catch (err) {
        fail(err);
        return null;
      }
      return next;
    },
    [persistJourney, fail],
  );

  const oc = state.ocs.find((o) => o.id === state.activeOcId) ?? null;

  const value: GameContextValue = {
    ...state,
    oc,
    activeJourney,
    notice,
    resolving,
    dismissNotice: () => setNotice(null),
    saveOC,
    deleteOC,
    setActiveOC,
    setOCStyle,
    startJourney,
    pause,
    resume,
    endEarly,
    resolveIfDue,
    archiveActive,
    answerChat,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
