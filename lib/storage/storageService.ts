import type { Journey } from "@/types/journey";
import type { OC } from "@/types/oc";

export type StoredState = {
  ocs: OC[];
  /** The OC whose room is shown. */
  activeOcId: string | null;
  journeys: Journey[];
  activeJourneyId: string | null;
  /** Data that couldn't be read and was set aside. */
  recovered: RecoveredItem[];
};

export type RecoveredItem = { kind: "character" | "album" | "albumPages" | "currentTrip"; count?: number };

export type StorageErrorCode = "unavailable" | "quota" | "write";

export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode) {
    super(code);
  }
}

/**
 * Persistence boundary. The app only talks to this interface, so localStorage
 * can be swapped for Supabase (or anything else) without touching UI code.
 */
export interface StorageService {
  readonly id: string;
  load(): Promise<StoredState>;
  saveOC(oc: OC): Promise<void>;
  deleteOC(id: string): Promise<void>;
  setActiveOcId(id: string | null): Promise<void>;
  saveJourney(journey: Journey): Promise<void>;
  setActiveJourneyId(id: string | null): Promise<void>;
  clearAll(): Promise<void>;
}
