import type { Journey } from "@/types/journey";

/**
 * All timer math derives from stored timestamps, never from a decrementing
 * counter, so refreshes and closed tabs can't drift or reset the clock.
 */

const ms = (iso: string) => new Date(iso).getTime();

export function getRemainingMs(journey: Journey, now = Date.now()): number {
  const reference = journey.pausedAt ? ms(journey.pausedAt) : now;
  return Math.max(0, ms(journey.expectedEndAt) - reference);
}

export function isDue(journey: Journey, now = Date.now()): boolean {
  return journey.status === "traveling" && !journey.pausedAt && getRemainingMs(journey, now) <= 0;
}

export function getProgress(journey: Journey, now = Date.now()): number {
  const total = journey.durationMinutes * 60_000;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - getRemainingMs(journey, now) / total));
}

/** Minutes of real travel so far, excluding pauses. */
export function getElapsedMinutes(journey: Journey, now = Date.now()): number {
  const elapsed = journey.durationMinutes * 60_000 - getRemainingMs(journey, now);
  return Math.max(0, Math.floor(elapsed / 60_000));
}

export function pauseJourney(journey: Journey, now = Date.now()): Journey {
  if (journey.pausedAt || journey.status !== "traveling") return journey;
  return { ...journey, pausedAt: new Date(now).toISOString() };
}

export function resumeJourney(journey: Journey, now = Date.now()): Journey {
  if (!journey.pausedAt) return journey;
  const pausedFor = Math.max(0, now - ms(journey.pausedAt));
  return {
    ...journey,
    pausedAt: null,
    pausedTotalMs: journey.pausedTotalMs + pausedFor,
    expectedEndAt: new Date(ms(journey.expectedEndAt) + pausedFor).toISOString(),
  };
}

export function formatClock(remainingMs: number): string {
  const total = Math.ceil(remainingMs / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
