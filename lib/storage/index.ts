import { localStorageService } from "./localStorageService";
import type { StorageService } from "./storageService";

/** Single place to choose the persistence backend. */
export function getStorageService(): StorageService {
  // Supabase can be enabled here once lib/storage/supabaseService.ts is implemented.
  return localStorageService;
}

export { StorageError } from "./storageService";
export type { RecoveredItem, StorageErrorCode, StorageService, StoredState } from "./storageService";
