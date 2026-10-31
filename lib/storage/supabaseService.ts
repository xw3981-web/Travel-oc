import type { StorageService } from "./storageService";
import { StorageError } from "./storageService";

/**
 * Supabase adapter — not wired up in the MVP (single-user, local-first).
 *
 * To enable:
 *   1. `npm i @supabase/supabase-js` and run `supabase/schema.sql` in your project.
 *   2. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
 *      NEXT_PUBLIC_STORAGE_PROVIDER=supabase.
 *   3. Implement the methods below:
 *      - load():             select from `ocs` (owner = auth.uid()) and `journeys`;
 *                            activeJourneyId = the newest journey where saved_to_album = false.
 *      - saveOC():           upload image data URLs to the `oc-images` bucket, store public
 *                            URLs, then upsert the row into `ocs`.
 *      - saveJourney():      upload the travel photo to `travel-photos` if it is a data URL,
 *                            then upsert into `journeys` (camelCase ↔ snake_case).
 *      - setActiveJourneyId: no-op (derived from saved_to_album).
 *
 * Supabase Auth (anonymous sign-in is enough) supplies the owner id for RLS.
 */
function notConfigured(): never {
  throw new StorageError("unavailable");
}

export const supabaseService: StorageService = {
  id: "supabase",
  load: async () => notConfigured(),
  saveOC: async () => notConfigured(),
  deleteOC: async () => notConfigured(),
  setActiveOcId: async () => notConfigured(),
  saveJourney: async () => notConfigured(),
  setActiveJourneyId: async () => notConfigured(),
  clearAll: async () => notConfigured(),
};
