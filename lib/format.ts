import { LOCALE_TAG, type Locale } from "@/lib/i18n/locale";
import { MESSAGES } from "@/lib/i18n/messages";
import type { Journey, TravelConditions } from "@/types/journey";

export function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], { month: "short", day: "numeric", year: "numeric" });
}

export function formatMonth(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[locale], { month: "long", year: "numeric" });
}

export function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(LOCALE_TAG[locale], { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(minutes: number, locale: Locale): string {
  const t = MESSAGES[locale].time;
  if (minutes < 1) return t.underMinute;
  if (minutes < 60) return t.minutes(minutes);
  return t.hours(Math.floor(minutes / 60), minutes % 60);
}

/** Film-camera style date stamp, e.g. '26 11 01. */
export function filmStamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `'${String(d.getFullYear()).slice(2)} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}`;
}

const WEATHER_ICON: Record<TravelConditions["weather"], string> = {
  sunny: "☀️",
  cloudy: "☁️",
  drizzle: "🌦️",
  windy: "🍃",
  foggy: "🌫️",
  snowy: "❄️",
};

export function weatherLabel(c: TravelConditions, locale: Locale): string {
  const t = MESSAGES[locale].time;
  if (c.timeOfDay === "night" && c.weather === "sunny") return `✨ ${t.clearNight}`;
  return `${WEATHER_ICON[c.weather]} ${t.weather[c.weather]}`;
}

export function timeOfDayLabel(c: TravelConditions, locale: Locale): string {
  return MESSAGES[locale].time.timeOfDay[c.timeOfDay];
}

export function tripMinutes(j: Journey): number {
  return j.actualDurationMinutes ?? j.durationMinutes;
}
