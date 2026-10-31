import type { Locale } from "@/lib/i18n/locale";
import type { Destination, FoodType, Journey, Souvenir, TravelEvent, TripTier } from "@/types/journey";
import { getDestinationDef, TIERS } from "./destinations";
import { DESTINATIONS_ZH, SOUVENIRS_ZH, TIER_HINTS_ZH } from "./destinations.zh";
import { DIARY_POOLS, type CloserId } from "./diaryPools";
import { FOODS } from "./foods";

/** Display copy for game content. Stored journeys keep ids/keys, so any language can be shown later. */

export function destinationText(dest: Destination, locale: Locale) {
  const zh = locale === "zh" ? DESTINATIONS_ZH[dest.id] : undefined;
  return zh ? { name: zh.name, region: zh.region, blurb: zh.blurb } : { name: dest.name, region: dest.region, blurb: dest.blurb };
}

export function souvenirText(s: Souvenir, locale: Locale) {
  const zh = locale === "zh" ? SOUVENIRS_ZH[s.id] : undefined;
  return zh ?? { name: s.name, note: s.note };
}

export function tierHint(tier: TripTier, locale: Locale) {
  return locale === "zh" ? TIER_HINTS_ZH[tier] : TIERS[tier].hint;
}

const FOOD_ZH: Record<FoodType, { name: string; hint: string }> = {
  riceball: { name: "饭团", hint: "在户外吃最香" },
  sandwich: { name: "三明治", hint: "边走边吃很方便" },
  cookies: { name: "曲奇", hint: "适合安静的小角落" },
};

export function foodText(food: FoodType, locale: Locale) {
  return locale === "zh" ? FOOD_ZH[food] : { name: FOODS[food].name, hint: FOODS[food].hint };
}

/** Resolve a content key like "line:cafe:2" to text; undefined if unknown. */
export function textForKey(key: string, locale: Locale): string | undefined {
  const [pool, a, b] = key.split(":");
  const p = DIARY_POOLS[locale];
  const i = Number(b);
  switch (pool) {
    case "act":
    case "line": {
      const list =
        locale === "zh"
          ? DESTINATIONS_ZH[a]?.[pool === "act" ? "activities" : "lines"]
          : pool === "act"
            ? getDestinationDef(a)?.activities.map((x) => x.line)
            : getDestinationDef(a)?.lines;
      return list?.[i];
    }
    case "weather":
      return p.weather[a as keyof typeof p.weather]?.[i];
    case "time":
      return p.time[a as keyof typeof p.time]?.[i];
    case "transit":
      return p.transit[Number(a)]?.[i];
    case "food":
      return p.food[a as FoodType]?.[i];
    case "early":
      return p.early[Number(a)];
    case "closer":
      return p.closers[a as CloserId];
    case "comfort":
      return p.comfort[Number(a)];
    case "musing":
      return p.musing[Number(a)];
    default:
      return undefined;
  }
}

/** For journeys saved before content keys existed: find the key whose English text matches. */
function keyForText(text: string, destId?: string): string | undefined {
  const p = DIARY_POOLS.en;
  const def = destId ? getDestinationDef(destId) : undefined;
  const lists: [string, string[]][] = [
    ...(def ? ([[`act:${def.id}`, def.activities.map((a) => a.line)], [`line:${def.id}`, def.lines]] as [string, string[]][]) : []),
    ...Object.entries(p.weather).map(([k, v]) => [`weather:${k}`, v] as [string, string[]]),
    ...Object.entries(p.time).map(([k, v]) => [`time:${k}`, v ?? []] as [string, string[]]),
    ...Object.entries(p.transit).map(([k, v]) => [`transit:${k}`, v] as [string, string[]]),
    ...Object.entries(p.food).map(([k, v]) => [`food:${k}`, v] as [string, string[]]),
  ];
  for (const [prefix, list] of lists) {
    const i = list.indexOf(text);
    if (i >= 0) return `${prefix}:${i}`;
  }
  const early = p.early.indexOf(text);
  if (early >= 0) return `early:${early}`;
  const closer = Object.entries(p.closers).find(([, v]) => v === text);
  return closer ? `closer:${closer[0]}` : undefined;
}

export function eventText(e: TravelEvent, locale: Locale, destId?: string): string {
  const key = e.key ?? keyForText(e.text, destId);
  return (key && textForKey(key, locale)) || e.text;
}

/** The diary as it should read in `locale`. AI-written diaries are shown as stored. */
export function journeyDiary(j: Journey, locale: Locale): string {
  if (j.diarySource !== "ai" && j.events?.length) {
    return j.events
      .filter((e) => e.kind !== "note")
      .map((e) => eventText(e, locale, j.destination?.id))
      .join("\n");
  }
  return j.diary ?? "";
}

/** The P.S. the OC left for the owner, if any. */
export function journeyNote(j: Journey, locale: Locale): string | undefined {
  const note = j.events?.find((e) => e.kind === "note");
  return note ? eventText(note, locale) : undefined;
}
