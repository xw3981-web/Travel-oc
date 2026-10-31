import type { Destination, PhotoComposition, TravelConditions } from "@/types/journey";

export type TravelImagePromptInput = {
  /** Text description of the OC; reference-image conditioning is passed separately. */
  ocDescription?: string;
  ocName?: string;
  destination: Destination;
  conditions: TravelConditions;
  composition: PhotoComposition;
};

const TIME_LIGHT: Record<TravelConditions["timeOfDay"], string> = {
  morning: "early morning, cool soft light",
  afternoon: "afternoon, warm natural daylight",
  evening: "late afternoon golden hour, long shadows",
  night: "night, gentle ambient light from windows and street lamps",
};

const WEATHER_MOOD: Record<TravelConditions["weather"], string> = {
  sunny: "clear sky",
  cloudy: "overcast, diffused light",
  drizzle: "light drizzle, wet reflective surfaces",
  windy: "breezy, hair and leaves moving",
  foggy: "soft fog, low contrast",
  snowy: "gentle snowfall",
};

const SHOT: Record<PhotoComposition["shot"], string> = {
  wide: "wide shot, character small in the frame, environment-focused",
  medium: "medium shot, character and surroundings balanced",
  close: "close shot, character prominent, background softly blurred",
};

/**
 * Builds a natural-language prompt for a travel snapshot. Real image providers
 * should pair this with the OC's reference image to keep identity consistent.
 */
export function buildTravelImagePrompt(input: TravelImagePromptInput): string {
  const { destination, conditions, composition } = input;
  const subject = input.ocDescription?.trim()
    ? `The character (${input.ocDescription.trim()})`
    : "The character from the reference image";
  const position = composition.position === "center" ? "centred" : `on the ${composition.position} third`;

  return [
    `${subject} ${composition.activity}`,
    `at ${destination.name} — ${destination.blurb.toLowerCase().replace(/\.$/, "")}`,
    `${conditions.season}, ${TIME_LIGHT[conditions.timeOfDay]}`,
    WEATHER_MOOD[conditions.weather],
    `${SHOT[composition.shot]}, ${position}`,
    "candid travel snapshot, slightly imperfect handheld framing, film photo feel, cozy and quiet mood",
  ].join(",\n");
}
