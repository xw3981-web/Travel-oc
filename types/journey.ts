export type FoodType = "riceball" | "sandwich" | "cookies";

export type DestinationCategory = "nature" | "city" | "cozy";

/** 0 = barely left the door (early return), 5 = rare long trips. */
export type TripTier = 0 | 1 | 2 | 3 | 4 | 5;

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Weather = "sunny" | "cloudy" | "drizzle" | "windy" | "foggy" | "snowy";
export type Season = "spring" | "summer" | "autumn" | "winter";

export type SceneKind =
  | "street"
  | "river"
  | "interior"
  | "park"
  | "garden"
  | "landmark"
  | "sea"
  | "mountain"
  | "station"
  | "snow"
  | "island"
  | "field";

export type InteriorVariant = "shelves" | "counter" | "table" | "frames" | "tank" | "books";

/** How the mock image service should paint a destination. */
export type SceneSpec = {
  kind: SceneKind;
  accent: string;
  interior?: InteriorVariant;
  /** Signature prop drawn into the scene. */
  landmark?: "lighthouse";
};

export type Destination = {
  id: string;
  name: string;
  tier: TripTier;
  category: DestinationCategory;
  /** Short place descriptor shown under the name, e.g. "two stops away". */
  region: string;
  blurb: string;
  scene: SceneSpec;
  rare?: boolean;
};

export type Souvenir = {
  id: string;
  name: string;
  emoji: string;
  note: string;
};

export type TravelEvent = {
  /** "note" is a P.S. addressed to the owner, shown apart from the diary itself. */
  kind: "transit" | "weather" | "activity" | "moment" | "food" | "early" | "note";
  /** English text, kept as a fallback. */
  text: string;
  /** Content key (e.g. "line:cafe:2") so the diary can be re-rendered in any language. */
  key?: string;
};

export type TravelConditions = {
  timeOfDay: TimeOfDay;
  weather: Weather;
  season: Season;
};

export type PhotoComposition = {
  shot: "wide" | "medium" | "close";
  position: "left" | "center" | "right";
  /** What the OC is doing in the photo, used in the image prompt. */
  activity: string;
  /** Slight hand-held camera tilt in degrees. */
  tilt: number;
};

export type JourneyInput = {
  durationMinutes: number;
  food: FoodType;
  ocId: string;
  startedAt: string;
};

export type JourneyResult = {
  destination: Destination;
  events: TravelEvent[];
  diary: string;
  souvenir?: Souvenir;
  imagePrompt: string;
  conditions: TravelConditions;
  composition: PhotoComposition;
};

export type JourneyStatus = "traveling" | "completed" | "interrupted";

export type Journey = {
  id: string;
  ocId: string;
  /** Name at departure, so the album still reads right if the OC is renamed. */
  ocName?: string;

  startedAt: string;
  expectedEndAt: string;
  completedAt?: string;

  durationMinutes: number;
  actualDurationMinutes?: number;

  food: FoodType;

  status: JourneyStatus;

  /** Set while paused; remaining time freezes at expectedEndAt - pausedAt. */
  pausedAt?: string | null;
  pausedTotalMs: number;

  destination?: Destination;
  diary?: string;
  /** "template" diaries are rebuilt from event keys per language; "ai" diaries are shown verbatim. */
  diarySource?: "template" | "ai";
  souvenir?: Souvenir;
  travelImageUrl?: string;
  /** False when the image is a backdrop and the OC must be composited on top (mock mode). */
  travelImageIncludesOC?: boolean;
  imagePrompt?: string;
  conditions?: TravelConditions;
  composition?: PhotoComposition;
  events?: TravelEvent[];

  /** Post-trip chat: what the owner said they were doing, and how the OC answered. */
  chat?: {
    activity: string;
    category: string;
    /** Template reply, re-rendered per language. */
    replyKey?: string;
    /** Free-form reply from an LLM provider. */
    reply?: string;
    at: string;
  };

  seed: string;
  /** Resolved journeys wait on the return screen until the user files them away. */
  savedToAlbum: boolean;
};
