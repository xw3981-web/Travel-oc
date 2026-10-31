import { buildTravelImagePrompt } from "@/lib/ai/imagePrompt";
import type { OCPersonality } from "@/types/oc";
import type {
  DestinationCategory,
  JourneyInput,
  JourneyResult,
  PhotoComposition,
  Season,
  TimeOfDay,
  TravelConditions,
  TravelEvent,
  Weather,
} from "@/types/journey";
import { DESTINATIONS, tierForMinutes, toDestination, type DestinationDef } from "./destinations";
import { CLOSERS, DIARY_POOLS } from "./diaryPools";
import { FOODS } from "./foods";
import { createRng, makeSeed, type Rng } from "./random";

export type GenerateOptions = {
  personality?: OCPersonality;
  ocDescription?: string;
  ocName?: string;
  /** When the user ended early, the trip is sized by the minutes actually spent. */
  interrupted?: boolean;
  actualMinutes?: number;
};

/** How much the packed food boosts its category (≈ +20 percentage points over an even 1-in-3). */
const FOOD_CATEGORY_BONUS = 1.3;

const NEUTRAL: OCPersonality = { curiosity: 0.5, sociability: 0.5, adventurousness: 0.5 };

// ── Conditions ───────────────────────────────────────────────────────────

function timeOfDayFor(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 20) return "evening";
  return "night";
}

function seasonFor(date: Date): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function pickWeather(rng: Rng, season: Season, def: DestinationDef): Weather {
  if (def.scene.kind === "snow") return rng.chance(0.75) ? "snowy" : "cloudy";
  const base: Record<Weather, number> = {
    sunny: 3,
    cloudy: 2,
    drizzle: season === "summer" ? 1.4 : 1,
    windy: season === "autumn" || season === "spring" ? 1.3 : 0.8,
    foggy: 0.6,
    snowy: season === "winter" ? 0.8 : 0,
  };
  const weathers = Object.keys(base) as Weather[];
  return rng.weighted(weathers, (w) => base[w] * (def.weatherBias?.[w] ?? 1));
}

// ── Destination ──────────────────────────────────────────────────────────

function pickDestination(rng: Rng, minutes: number, leaning: DestinationCategory, p: OCPersonality) {
  const tier = tierForMinutes(minutes);
  const pool = DESTINATIONS.filter((d) => d.tier === tier.tier);
  const categories = [...new Set(pool.map((d) => d.category))];
  const category = rng.weighted(categories, (c) => 1 + (c === leaning ? FOOD_CATEGORY_BONUS : 0));
  const candidates = pool.filter((d) => d.category === category);
  const def = rng.weighted(candidates, (d) => (d.weight ?? 1) * (d.rare ? 0.4 + p.adventurousness : 1));
  return { def, tier };
}

// ── Diary ────────────────────────────────────────────────────────────────

const POOLS = DIARY_POOLS.en;

/** Pick from a list and remember which entry, so the line can be re-rendered in any language. */
function keyed(r: Rng, list: string[], prefix: string): { text: string; key: string } {
  const i = Math.floor(r.next() * list.length);
  return { text: list[i], key: `${prefix}:${i}` };
}

// ── Generator ────────────────────────────────────────────────────────────

/**
 * Pure and deterministic: the same input (and options) always produces the same
 * journey, so a refresh mid-reveal never changes where the OC went.
 */
export function generateJourney(input: JourneyInput, opts: GenerateOptions = {}): JourneyResult {
  const seed = makeSeed(input.ocId, input.startedAt);
  const p = opts.personality ?? NEUTRAL;
  const food = FOODS[input.food];
  const minutes = opts.interrupted ? (opts.actualMinutes ?? 0) : input.durationMinutes;

  const { def, tier } = pickDestination(createRng(seed, `dest:${opts.interrupted ? "early" : "full"}`), minutes, food.leaning, p);
  const destination = toDestination(def);

  // Conditions are anchored to the middle of the trip.
  const mid = new Date(new Date(input.startedAt).getTime() + (minutes * 60_000) / 2);
  const condRng = createRng(seed, "conditions");
  const conditions: TravelConditions = {
    timeOfDay: def.id === "star-field" || def.id === "sleeper-train" ? "night" : timeOfDayFor(mid),
    season: seasonFor(mid),
    weather: "sunny",
  };
  conditions.weather = pickWeather(condRng, conditions.season, def);
  if (conditions.timeOfDay === "night" && conditions.weather === "foggy") conditions.weather = "cloudy";

  // Diary: 2–4 short sentences.
  const r = createRng(seed, `diary:${def.id}`);
  const actIndex = Math.floor(r.next() * def.activities.length);
  const events: TravelEvent[] = [];

  if (opts.interrupted) {
    events.push({ kind: "early", ...keyed(r, POOLS.early, "early") });
  } else if (POOLS.transit[tier.tier] && r.chance(0.35)) {
    events.push({ kind: "transit", ...keyed(r, POOLS.transit[tier.tier], `transit:${tier.tier}`) });
  } else if (r.chance(0.5)) {
    const timeLines = POOLS.time[conditions.timeOfDay];
    // "The sun was out" makes no sense at night, so clear nights use the night line.
    const clearNight = conditions.timeOfDay === "night" && conditions.weather === "sunny";
    const useTime = timeLines && (clearNight || r.chance(0.4));
    events.push({
      kind: "weather",
      ...(useTime
        ? keyed(r, timeLines, `time:${conditions.timeOfDay}`)
        : keyed(r, POOLS.weather[conditions.weather], `weather:${conditions.weather}`)),
    });
  }

  events.push({ kind: "activity", text: def.activities[actIndex].line, key: `act:${def.id}:${actIndex}` });
  const momentOrder = r.shuffle(def.lines.map((_, i) => i));
  const moment = (i: number): TravelEvent => ({ kind: "moment", text: def.lines[i], key: `line:${def.id}:${i}` });
  events.push(moment(momentOrder[0]));

  if (events.length < 4) {
    const extra = r.next();
    if (extra < 0.3) events.push({ kind: "food", ...keyed(r, POOLS.food[input.food], `food:${input.food}`) });
    else if (extra < 0.3 + 0.2 + p.curiosity * 0.2 && momentOrder.length > 1) events.push(moment(momentOrder[1]));
    else if (extra < 0.85) {
      const used = new Set(events.map((e) => e.text));
      const closers = CLOSERS.filter((c) => (!c.when || c.when(p)) && !used.has(POOLS.closers[c.id]));
      const c = r.pick(closers);
      events.push({ kind: "moment", text: POOLS.closers[c.id], key: `closer:${c.id}` });
    }
  }

  // P.S. to the owner: always comfort after an early return; reflective notes grow likelier with longer trips.
  const noteRng = createRng(seed, "note");
  const noteChance = minutes >= 60 ? 1 : minutes >= 25 ? 0.6 : 0.35;
  if (opts.interrupted) events.push({ kind: "note", ...keyed(noteRng, POOLS.comfort, "comfort") });
  else if (noteRng.chance(noteChance)) events.push({ kind: "note", ...keyed(noteRng, POOLS.musing, "musing") });

  const souvenirRng = createRng(seed, "souvenir");
  const souvenir = souvenirRng.chance(tier.souvenirChance) ? souvenirRng.pick(def.souvenirs) : undefined;

  const compRng = createRng(seed, "composition");
  const wideKinds = ["sea", "mountain", "field", "island", "landmark", "snow"];
  const composition: PhotoComposition = {
    shot: wideKinds.includes(def.scene.kind)
      ? compRng.weighted(["wide", "medium"] as const, (s) => (s === "wide" ? 2 : 1))
      : compRng.weighted(["medium", "close", "wide"] as const, (s) => (s === "medium" ? 2 : 1)),
    position: compRng.pick(["left", "center", "right"] as const),
    activity: def.activities[actIndex].prompt,
    tilt: Math.round(compRng.range(-3, 3) * 10) / 10,
  };

  const imagePrompt = buildTravelImagePrompt({
    ocDescription: opts.ocDescription,
    ocName: opts.ocName,
    destination,
    conditions,
    composition,
  });

  return {
    destination,
    events,
    diary: events.filter((e) => e.kind !== "note").map((e) => e.text).join("\n"),
    souvenir,
    imagePrompt,
    conditions,
    composition,
  };
}
