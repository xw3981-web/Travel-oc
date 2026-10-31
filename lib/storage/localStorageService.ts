import type { Journey } from "@/types/journey";
import type { OC } from "@/types/oc";
import { StorageError, type RecoveredItem, type StorageService, type StoredState } from "./storageService";
import { parseJourney, parseOC } from "./validate";

const PREFIX = "travel-oc:v1:";
const KEYS = {
  ocs: `${PREFIX}ocs`,
  activeOc: `${PREFIX}activeOcId`,
  /** Single-OC storage from before multiple OCs; migrated on load. */
  legacyOc: `${PREFIX}oc`,
  journeys: `${PREFIX}journeys`,
  active: `${PREFIX}activeJourneyId`,
} as const;

function store(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new StorageError("unavailable");
  }
  return window.localStorage;
}

function readJSON(key: string, recovered: RecoveredItem[], kind: RecoveredItem["kind"]): unknown {
  const raw = store().getItem(key);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    setAside(key, raw);
    recovered.push({ kind });
    return undefined;
  }
}

/** Keep unreadable data under a backup key instead of silently destroying it. */
function setAside(key: string, raw: string) {
  try {
    store().setItem(`${key}:corrupt`, raw);
  } catch {
    /* backup is best-effort */
  }
  store().removeItem(key);
}

function write(key: string, value: unknown) {
  try {
    store().setItem(key, JSON.stringify(value));
  } catch (err) {
    const quota = err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22);
    throw new StorageError(quota ? "quota" : "write");
  }
}

function readOCs(): OC[] {
  const raw = store().getItem(KEYS.ocs);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(parseOC).filter((o): o is OC => o !== null) : [];
  } catch {
    return [];
  }
}

function readJourneys(): Journey[] {
  const raw = store().getItem(KEYS.journeys);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(parseJourney).filter((j): j is Journey => j !== null) : [];
  } catch {
    return [];
  }
}

export const localStorageService: StorageService = {
  id: "local",

  async load(): Promise<StoredState> {
    const recovered: RecoveredItem[] = [];

    let ocs: OC[] = [];
    const rawOCs = readJSON(KEYS.ocs, recovered, "character");
    if (Array.isArray(rawOCs)) {
      ocs = rawOCs.map(parseOC).filter((o): o is OC => o !== null);
      if (ocs.length !== rawOCs.length) {
        recovered.push({ kind: "character" });
        write(KEYS.ocs, ocs);
      }
    } else if (rawOCs !== undefined) {
      setAside(KEYS.ocs, JSON.stringify(rawOCs));
      recovered.push({ kind: "character" });
    }

    // Migrate the old single-OC key.
    const legacy = readJSON(KEYS.legacyOc, recovered, "character");
    if (legacy !== undefined) {
      const oc = parseOC(legacy);
      if (oc && !ocs.some((o) => o.id === oc.id)) {
        ocs = [...ocs, oc];
        write(KEYS.ocs, ocs);
        if (!store().getItem(KEYS.activeOc)) write(KEYS.activeOc, oc.id);
      } else if (!oc) {
        setAside(KEYS.legacyOc, JSON.stringify(legacy));
        recovered.push({ kind: "character" });
      }
      store().removeItem(KEYS.legacyOc);
    }

    const rawActiveOc = readJSON(KEYS.activeOc, recovered, "character");
    const activeOcId =
      typeof rawActiveOc === "string" && ocs.some((o) => o.id === rawActiveOc) ? rawActiveOc : (ocs[0]?.id ?? null);

    const rawJourneys = readJSON(KEYS.journeys, recovered, "album");
    let journeys: Journey[] = [];
    if (Array.isArray(rawJourneys)) {
      journeys = rawJourneys.map(parseJourney).filter((j): j is Journey => j !== null);
      if (journeys.length !== rawJourneys.length) {
        recovered.push({ kind: "albumPages", count: rawJourneys.length - journeys.length });
        write(KEYS.journeys, journeys);
      }
    } else if (rawJourneys !== undefined) {
      setAside(KEYS.journeys, JSON.stringify(rawJourneys));
      recovered.push({ kind: "album" });
    }

    const rawActive = readJSON(KEYS.active, recovered, "currentTrip");
    const activeJourneyId =
      typeof rawActive === "string" && journeys.some((j) => j.id === rawActive) ? rawActive : null;
    if (rawActive !== undefined && !activeJourneyId) store().removeItem(KEYS.active);

    return { ocs, activeOcId, journeys, activeJourneyId, recovered };
  },

  async saveOC(oc: OC) {
    const ocs = readOCs();
    const i = ocs.findIndex((o) => o.id === oc.id);
    if (i >= 0) ocs[i] = oc;
    else ocs.push(oc);
    write(KEYS.ocs, ocs);
  },

  async deleteOC(id: string) {
    write(
      KEYS.ocs,
      readOCs().filter((o) => o.id !== id),
    );
  },

  async setActiveOcId(id: string | null) {
    if (id) write(KEYS.activeOc, id);
    else store().removeItem(KEYS.activeOc);
  },

  async saveJourney(journey: Journey) {
    const journeys = readJourneys();
    const i = journeys.findIndex((j) => j.id === journey.id);
    if (i >= 0) journeys[i] = journey;
    else journeys.push(journey);
    write(KEYS.journeys, journeys);
  },

  async setActiveJourneyId(id: string | null) {
    if (id) write(KEYS.active, id);
    else store().removeItem(KEYS.active);
  },

  async clearAll() {
    Object.values(KEYS).forEach((k) => store().removeItem(k));
  },
};
