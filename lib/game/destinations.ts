import type { Destination, Souvenir, TripTier, Weather } from "@/types/journey";

export type Activity = {
  /** Phrase for the image prompt: "<character> <prompt>". */
  prompt: string;
  /** Diary sentence(s) in the OC's voice. */
  line: string;
};

export type DestinationDef = Destination & {
  activities: Activity[];
  lines: string[];
  souvenirs: Souvenir[];
  /** Extra weight for weathers that suit the place. */
  weatherBias?: Partial<Record<Weather, number>>;
  /** Relative pick weight inside its tier+category. Rare places are lower. */
  weight?: number;
};

export type TierInfo = {
  tier: TripTier;
  label: string;
  /** Hint shown before departure — scale only, never the destination. */
  hint: string;
  minMinutes: number;
  maxMinutes: number;
  souvenirChance: number;
};

export const TIERS: TierInfo[] = [
  { tier: 0, label: "Doorstep", hint: "Just outside the door", minMinutes: 0, maxMinutes: 4, souvenirChance: 0.35 },
  { tier: 1, label: "Nearby", hint: "A little walk around the block", minMinutes: 5, maxMinutes: 20, souvenirChance: 0.55 },
  { tier: 2, label: "Neighbourhood", hint: "Somewhere in the neighbourhood", minMinutes: 21, maxMinutes: 40, souvenirChance: 0.65 },
  { tier: 3, label: "Across town", hint: "A proper outing across town", minMinutes: 41, maxMinutes: 70, souvenirChance: 0.75 },
  { tier: 4, label: "Day trip", hint: "A train ride somewhere farther", minMinutes: 71, maxMinutes: 120, souvenirChance: 0.85 },
  { tier: 5, label: "Long journey", hint: "A long journey. Anything could happen", minMinutes: 121, maxMinutes: 180, souvenirChance: 1 },
];

export function tierForMinutes(minutes: number): TierInfo {
  const m = Math.max(0, Math.round(minutes));
  return TIERS.find((t) => m >= t.minMinutes && m <= t.maxMinutes) ?? TIERS[TIERS.length - 1];
}

const s = (id: string, emoji: string, name: string, note: string): Souvenir => ({ id, emoji, name, note });

export const DESTINATIONS: DestinationDef[] = [
  // ── Tier 0 · Doorstep (early returns) ────────────────────────────────
  {
    id: "front-step",
    name: "The Front Step",
    tier: 0,
    category: "cozy",
    region: "right outside",
    blurb: "Technically outside.",
    scene: { kind: "street", accent: "#c4704f" },
    activities: [
      { prompt: "sitting on a doorstep tying a shoelace", line: "I sat on the step and retied my shoes. Twice." },
      { prompt: "standing at an open front door looking at the sky", line: "I opened the door and checked what the sky was doing." },
    ],
    lines: [
      "A snail was making very slow progress across the step. I wished it luck.",
      "Someone's wind chime was going. I listened to it for a bit.",
    ],
    souvenirs: [s("pebble", "🪨", "Smooth pebble", "From right by the door. Still counts.")],
  },
  {
    id: "vending-machine",
    name: "The Corner Vending Machine",
    tier: 0,
    category: "city",
    region: "end of the street",
    blurb: "Glowing quietly, as always.",
    scene: { kind: "street", accent: "#d96a5a" },
    activities: [
      { prompt: "standing in front of a glowing vending machine choosing a drink", line: "I stood at the vending machine for a while. Too many choices." },
    ],
    lines: [
      "There's a new peach drink. I didn't buy it, but now I know.",
      "The machine hums a little tune when nobody's around.",
    ],
    souvenirs: [s("bottle-cap", "🧢", "Bottle cap", "Peach-flavoured, probably. Smells faintly sweet.")],
  },
  {
    id: "building-garden",
    name: "The Little Courtyard",
    tier: 0,
    category: "nature",
    region: "behind the building",
    blurb: "Three potted plants and a bench.",
    scene: { kind: "park", accent: "#7d8c5d" },
    activities: [
      { prompt: "crouching next to potted plants in a tiny courtyard", line: "I checked on the potted plants in the courtyard." },
    ],
    lines: [
      "One of the tomatoes is almost red.",
      "The bench was warm from the sun.",
    ],
    souvenirs: [s("leaf", "🍃", "Small leaf", "Fell off on its own. I didn't pick it.")],
  },

  // ── Tier 1 · Nearby ───────────────────────────────────────────────────
  {
    id: "riverside",
    name: "Riverside Path",
    tier: 1,
    category: "nature",
    region: "a short walk away",
    blurb: "Reeds, ducks, and a long bench.",
    scene: { kind: "river", accent: "#8db0c2" },
    weatherBias: { windy: 1.5, sunny: 1.2 },
    activities: [
      { prompt: "walking along a riverside path beside tall reeds", line: "I walked along the river until the path turned to gravel." },
      { prompt: "sitting on the riverbank watching ducks", line: "I sat on the bank and watched the ducks argue." },
    ],
    lines: [
      "A heron stood very still the whole time. I think it was winning something.",
      "Someone was flying a kite that refused to fly.",
      "The water was louder than I remembered.",
    ],
    souvenirs: [
      s("feather", "🪶", "Duck feather", "Grey and soft. The duck didn't seem to miss it."),
      s("flat-stone", "🪨", "Skipping stone", "Very flat. Too good to actually throw."),
    ],
  },
  {
    id: "konbini",
    name: "Convenience Store",
    tier: 1,
    category: "city",
    region: "two blocks down",
    blurb: "Open all the time. Bright inside.",
    scene: { kind: "interior", interior: "shelves", accent: "#5f9a7a" },
    activities: [
      { prompt: "browsing snack shelves in a convenience store", line: "I read the back of every snack in the aisle." },
      { prompt: "standing by the magazine rack near the window of a convenience store", line: "I stood by the magazine rack pretending to read." },
    ],
    lines: [
      "The door made the little jingle when I came in and again when I left.",
      "They had a seasonal pudding. I'm thinking about it.",
      "The cashier said 'thank you' in a very sleepy way.",
    ],
    souvenirs: [
      s("receipt", "🧾", "Receipt", "For one (1) gum. The font is nice."),
      s("sticker", "⭐", "Mascot sticker", "Came free with something. Very round."),
    ],
  },
  {
    id: "bakery",
    name: "Neighbourhood Bakery",
    tier: 1,
    category: "cozy",
    region: "around the corner",
    blurb: "Smells like butter from half a street away.",
    scene: { kind: "interior", interior: "counter", accent: "#d09a5a" },
    activities: [
      { prompt: "looking at bread through the glass counter of a small bakery", line: "I pressed my face to the glass counter. Gently." },
      { prompt: "holding a warm paper bag outside a bakery", line: "I bought one melon bun and held the bag like it was important." },
    ],
    lines: [
      "The baker had flour on one eyebrow. I didn't say anything.",
      "There was a tray of something fresh coming out just as I left. Bad timing.",
      "A kid in front of me ordered six croissants with total confidence.",
    ],
    souvenirs: [
      s("bread-bag", "🥐", "Paper bread bag", "Still smells like butter."),
      s("stamp-card", "🎫", "Stamp card", "One stamp. Nine to go."),
    ],
  },
  {
    id: "back-streets",
    name: "Back Streets",
    tier: 1,
    category: "city",
    region: "the long way round",
    blurb: "Narrow lanes, potted plants, sleeping cats.",
    scene: { kind: "street", accent: "#b88a5a" },
    activities: [
      { prompt: "walking down a narrow residential lane with potted plants", line: "I took the narrow street I never take." },
      { prompt: "crouching to look at a cat sleeping on a wall", line: "There was a cat asleep on a wall. I said hello. It did not." },
    ],
    lines: [
      "Someone had lined up their potted plants by height.",
      "The overhead wires made the sky look like sheet music.",
      "A bicycle bell rang somewhere I couldn't see.",
    ],
    souvenirs: [s("cat-hair", "🐈", "A single cat hair", "Orange. I'm keeping it anyway.")],
  },

  // ── Tier 2 · Neighbourhood ───────────────────────────────────────────
  {
    id: "park",
    name: "Hilltop Park",
    tier: 2,
    category: "nature",
    region: "up the hill",
    blurb: "Big trees and a slide nobody uses.",
    scene: { kind: "park", accent: "#7d8c5d" },
    weatherBias: { sunny: 1.4, windy: 1.2 },
    activities: [
      { prompt: "sitting on a park bench under a big tree", line: "I found the bench under the biggest tree and stayed there." },
      { prompt: "lying in the grass looking up at the leaves", line: "I lay down in the grass and watched the leaves move." },
    ],
    lines: [
      "Two old men were playing a board game very seriously.",
      "A dog brought me a stick. I threw it. We understood each other.",
      "The light came through the trees in little coins.",
    ],
    souvenirs: [
      s("acorn", "🌰", "Acorn with a hat", "The hat is still on. Rare."),
      s("clover", "🍀", "Clover", "Three leaves. I looked for a fourth for a while."),
    ],
  },
  {
    id: "cafe",
    name: "Corner Café",
    tier: 2,
    category: "cozy",
    region: "near the station",
    blurb: "Six tables, one cat, slow jazz.",
    scene: { kind: "interior", interior: "table", accent: "#9a6b4f" },
    weatherBias: { drizzle: 1.6, cloudy: 1.2 },
    activities: [
      { prompt: "sitting at a small café table by the window with a cup of tea", line: "I sat by the window and made a cup of tea last a very long time." },
      { prompt: "reading the menu in a cozy café", line: "I read the whole menu, including the part about the beans." },
    ],
    lines: [
      "The owner was humming along to a song that wasn't playing.",
      "Someone at the next table was writing a letter by hand.",
      "The café cat sat on the chair across from me like we had a meeting.",
    ],
    souvenirs: [
      s("sugar", "🍬", "Wrapped sugar cube", "From the little bowl. They said I could."),
      s("coaster", "☕", "Paper coaster", "Has a ring from my cup on it."),
    ],
  },
  {
    id: "museum",
    name: "Small Local Museum",
    tier: 2,
    category: "cozy",
    region: "by the library",
    blurb: "Mostly old clocks and one very large fish.",
    scene: { kind: "interior", interior: "frames", accent: "#7f6f9a" },
    activities: [
      { prompt: "looking up at framed paintings in a quiet museum room", line: "I looked at a painting of a pear for longer than I meant to." },
      { prompt: "standing in a quiet museum hallway", line: "I walked through the clock room. Everything was ticking at different speeds." },
    ],
    lines: [
      "The guard nodded at me like we'd met before.",
      "There was a whole room about the history of the local bridge. I read all of it.",
      "It was so quiet I could hear my own footsteps being polite.",
    ],
    souvenirs: [
      s("ticket", "🎟️", "Museum ticket stub", "Admission: one. Torn neatly."),
      s("postcard-pear", "🖼️", "Pear postcard", "From the gift shop. It's the pear."),
    ],
  },
  {
    id: "shotengai",
    name: "Covered Shopping Street",
    tier: 2,
    category: "city",
    region: "three stops by bus",
    blurb: "Lanterns, fried snacks, and a shop that only sells brooms.",
    scene: { kind: "street", accent: "#d4884f" },
    weatherBias: { drizzle: 1.3 },
    activities: [
      { prompt: "walking through a covered shopping arcade with paper lanterns", line: "I walked the whole arcade once in each direction." },
      { prompt: "eating a croquette in front of a small butcher shop", line: "I bought a croquette from the butcher. It was too hot. I ate it anyway." },
    ],
    lines: [
      "There's a shop that only sells brooms. It seems to be doing fine.",
      "Someone was playing the shamisen outside the tea shop.",
      "The lanterns were already on even though it wasn't dark.",
    ],
    souvenirs: [
      s("lucky-cat", "🐱", "Tiny lucky cat", "From the gacha machine. Wave arm slightly crooked."),
      s("broom-tag", "🧹", "Broom-shop tag", "I did not buy a broom. They gave me this anyway."),
    ],
  },

  // ── Tier 3 · Across town ─────────────────────────────────────────────
  {
    id: "clock-tower",
    name: "Old Clock Tower",
    tier: 3,
    category: "city",
    region: "city centre",
    blurb: "Everyone meets under it. Nobody looks up.",
    scene: { kind: "landmark", accent: "#b07a52" },
    activities: [
      { prompt: "standing in a plaza looking up at an old clock tower", line: "I stood under the clock tower and waited for it to chime." },
      { prompt: "sitting on the steps of a city plaza", line: "I sat on the plaza steps and watched people meet each other." },
    ],
    lines: [
      "The clock is four minutes fast. I checked.",
      "Pigeons were sitting on the hour hand.",
      "A group of tourists asked me to take their photo. I think I cut off someone's head.",
    ],
    souvenirs: [
      s("keychain-tower", "🗝️", "Clock tower keychain", "The tiny clock says 3:40 forever."),
      s("pigeon-feather", "🪶", "Pigeon feather", "City issue."),
    ],
  },
  {
    id: "aquarium",
    name: "Harbour Aquarium",
    tier: 3,
    category: "cozy",
    region: "down by the harbour",
    blurb: "Dim, blue, and very calm.",
    scene: { kind: "interior", interior: "tank", accent: "#3f7a9a" },
    weatherBias: { drizzle: 1.5 },
    activities: [
      { prompt: "standing in front of a huge blue aquarium tank, silhouetted", line: "I stood in front of the big tank until my eyes went blue." },
      { prompt: "watching jellyfish drift in a dark aquarium room", line: "The jellyfish room was so slow I forgot what time it was." },
    ],
    lines: [
      "A manta ray went past like it was late for something.",
      "There's a fish that looks exactly like a disappointed old man.",
      "A small kid next to me said 'whoa' every time anything moved.",
    ],
    souvenirs: [
      s("jelly-charm", "🪼", "Jellyfish charm", "Glows a little in the dark. A little."),
      s("penguin-pin", "🐧", "Penguin pin", "The penguin looks unsure. Relatable."),
    ],
  },
  {
    id: "botanical",
    name: "Botanical Garden",
    tier: 3,
    category: "nature",
    region: "east side of town",
    blurb: "A glass greenhouse that's always summer inside.",
    scene: { kind: "garden", accent: "#5f8f6a" },
    weatherBias: { sunny: 1.3, foggy: 1.2 },
    activities: [
      { prompt: "walking through a glass greenhouse full of tropical plants", line: "I walked into the greenhouse and my glasses fogged up. I don't wear glasses." },
      { prompt: "looking closely at a strange flower in a botanical garden", line: "I found a flower that smelled like cinnamon. The sign said it shouldn't." },
    ],
    lines: [
      "A gardener was talking to the ferns. I think they were listening.",
      "There's a cactus here that's older than the city.",
      "Everything inside the greenhouse was dripping in a nice way.",
    ],
    souvenirs: [
      s("seed-packet", "🌱", "Seed packet", "Says 'easy to grow'. We'll see."),
      s("pressed-flower", "🌸", "Pressed flower", "Found on the path. Already flat."),
    ],
  },
  {
    id: "old-town",
    name: "Old Town Lanes",
    tier: 3,
    category: "city",
    region: "the old quarter",
    blurb: "Wooden houses, stone steps, a shop that sells only spoons.",
    scene: { kind: "street", accent: "#8a5a3a" },
    activities: [
      { prompt: "climbing worn stone steps between old wooden houses", line: "I climbed a lot of stone steps. Some of them were tilted on purpose, I think." },
      { prompt: "peeking into an old craft shop", line: "I went into a shop that only sells wooden spoons. They were all different." },
    ],
    lines: [
      "There was a bell on a string over a doorway. I didn't ring it. I wanted to.",
      "Somebody was grilling rice crackers and the whole street smelled like it.",
      "An old woman told me the shortcut. It was not shorter.",
    ],
    souvenirs: [
      s("rice-cracker", "🍘", "Rice cracker", "Soy glaze. I saved it for you. Mostly."),
      s("spoon", "🥄", "Little wooden spoon", "Hand-carved. The spoon lady picked it for me."),
    ],
  },
  {
    id: "observatory",
    name: "Rooftop Observatory",
    tier: 3,
    category: "city",
    region: "top of the tallest building",
    blurb: "You can see the whole town. And the sea, on a good day.",
    scene: { kind: "landmark", accent: "#6c7fa8" },
    rare: true,
    weight: 0.5,
    weatherBias: { sunny: 1.5 },
    activities: [
      { prompt: "standing at a rooftop railing looking over the whole city", line: "I went all the way to the top and found our street. It's very small from up there." },
    ],
    lines: [
      "The elevator made my ears pop. Twice.",
      "On a clear day you can see the sea. Today you could, a little.",
    ],
    souvenirs: [s("telescope-coin", "🔭", "Telescope token", "Gives you 90 seconds of looking. I used mine.")],
  },

  // ── Tier 4 · Day trip ────────────────────────────────────────────────
  {
    id: "enoshima",
    name: "Enoshima",
    tier: 4,
    category: "nature",
    region: "by the sea, an hour by train",
    blurb: "A small island joined to the shore by a long bridge.",
    scene: { kind: "sea", accent: "#3f7a9a" },
    weatherBias: { windy: 1.6, sunny: 1.3 },
    activities: [
      { prompt: "standing on a long bridge to a small island, wind in their hair", line: "I walked the long bridge to the island. The wind was stronger than I expected." },
      { prompt: "sitting on rocks by the sea holding a soda bottle", line: "I bought a soda near the sea and drank it on the rocks." },
    ],
    lines: [
      "A hawk stole someone's fried squid. Everyone clapped, a little.",
      "I almost forgot to come home.",
      "The water at the edge was clear enough to see the crabs.",
    ],
    souvenirs: [
      s("seashell", "🐚", "Seashell", "Pink on the inside. You can hear the sea a bit."),
      s("sea-glass", "💎", "Sea glass", "Green. Smoothed by the waves for a long time."),
    ],
  },
  {
    id: "mountain-town",
    name: "Mountain Town",
    tier: 4,
    category: "nature",
    region: "up the valley line",
    blurb: "Clean air, steep roofs, one bus an hour.",
    scene: { kind: "mountain", accent: "#6f7f5a" },
    weatherBias: { foggy: 1.6, cloudy: 1.2 },
    activities: [
      { prompt: "standing on a mountain road above a small town of steep roofs", line: "I walked up the road until the whole town fit in one look." },
      { prompt: "sitting outside a small shop in a mountain town eating a skewer", line: "I ate grilled mochi on a bench outside the general store." },
    ],
    lines: [
      "The air tasted green. I don't know how else to say it.",
      "The bus driver waved at every single person.",
      "Clouds were moving through the valley below me, like they lived there.",
    ],
    souvenirs: [
      s("wooden-charm", "🪵", "Carved wooden charm", "A small owl. For safe travels, apparently."),
      s("honey", "🍯", "Tiny jar of honey", "Local bees. Very serious about it."),
    ],
  },
  {
    id: "neighbour-city",
    name: "The Neighbouring City",
    tier: 4,
    category: "city",
    region: "an hour on the express",
    blurb: "Like our town, but everything is slightly different.",
    scene: { kind: "landmark", accent: "#8a6a9a" },
    activities: [
      { prompt: "walking across a busy crosswalk in a big city", line: "I crossed the big intersection. Everyone moved at once, like a tide." },
      { prompt: "standing under neon signs in a city shopping district", line: "I got lost on purpose in the shopping district." },
    ],
    lines: [
      "Their pigeons are bigger than ours.",
      "I found a ramen place with nine seats. I took one of them.",
      "Everyone walks faster here. I didn't.",
    ],
    souvenirs: [
      s("city-magnet", "🧲", "Fridge magnet", "Says the city's name in big round letters."),
      s("train-ticket", "🎫", "Express ticket", "Punched once. Window seat."),
    ],
  },
  {
    id: "country-station",
    name: "Countryside Station",
    tier: 4,
    category: "cozy",
    region: "end of a local line",
    blurb: "One platform, one bench, a lot of sky.",
    scene: { kind: "station", accent: "#c4704f" },
    weatherBias: { sunny: 1.2, cloudy: 1.2 },
    activities: [
      { prompt: "sitting by the window of a local train, countryside outside", line: "The train was almost empty. I sat by the window and watched the houses disappear." },
      { prompt: "standing alone on a small countryside train platform", line: "I got off at a station with one bench and sat on it." },
    ],
    lines: [
      "There was a cat sleeping near the station.",
      "The next train wasn't for forty minutes. That seemed fine.",
      "Rice fields went on until they turned into mountains.",
    ],
    souvenirs: [
      s("station-stamp", "📮", "Station stamp", "Inked from the little stamp desk. Slightly smudged."),
      s("ticket-hard", "🎟️", "Hard paper ticket", "The old kind. The station master punched it by hand."),
    ],
  },
  {
    id: "onsen-town",
    name: "Hot Spring Town",
    tier: 4,
    category: "cozy",
    region: "deep in the hills",
    blurb: "Steam rising out of the gutters. Everyone in slippers.",
    scene: { kind: "mountain", accent: "#b06a52" },
    weatherBias: { foggy: 1.4, drizzle: 1.2 },
    activities: [
      { prompt: "soaking feet in an outdoor footbath with steam rising", line: "I soaked my feet in the public footbath until they were pink." },
      { prompt: "walking down a steamy street in a hot spring town", line: "I walked down the main street in borrowed slippers." },
    ],
    lines: [
      "Steam comes out of the drains here. Nobody thinks it's strange.",
      "A man in a robe recommended the egg. The egg was good.",
      "I smelled a bit like sulphur on the train home. Worth it.",
    ],
    souvenirs: [
      s("onsen-egg", "🥚", "Hot spring egg", "Cooked in the spring. Still warm, somehow."),
      s("towel", "🧺", "Little towel", "Printed with the town's name. Very small."),
    ],
  },

  // ── Tier 5 · Long journey ────────────────────────────────────────────
  {
    id: "island",
    name: "A Small Island",
    tier: 5,
    category: "nature",
    region: "two ferries away",
    blurb: "Population: some. Cats: more.",
    scene: { kind: "island", accent: "#3f8a8a" },
    rare: true,
    weatherBias: { sunny: 1.5, windy: 1.3 },
    activities: [
      { prompt: "standing on the deck of a small ferry, island ahead", line: "I took a ferry, then a smaller ferry." },
      { prompt: "walking along a quiet island harbour full of cats", line: "The island had more cats than people. They all had opinions." },
    ],
    lines: [
      "The ferry man let me ring the bell.",
      "There's one shop on the island. It sells everything, but only one of each.",
      "The sea went from green to blue to a colour I don't have a word for.",
    ],
    souvenirs: [
      s("starfish", "⭐", "Dried starfish", "Found on the beach already dry. No starfish were bothered."),
      s("ferry-ticket", "⛴️", "Ferry ticket", "Two of them, stapled together."),
    ],
  },
  {
    id: "snowy-village",
    name: "Snowy Village",
    tier: 5,
    category: "cozy",
    region: "far north, past the tunnel",
    blurb: "Through the long tunnel, and then everything was white.",
    scene: { kind: "snow", accent: "#c4704f" },
    rare: true,
    weatherBias: { snowy: 6, cloudy: 1.2 },
    activities: [
      { prompt: "standing in deep snow in front of small houses with glowing windows", line: "The train came out of a long tunnel and everything was white." },
      { prompt: "drinking something warm outside a tiny snowy shop", line: "I drank something hot from a can and held it with both hands." },
    ],
    lines: [
      "The snow made everything so quiet I could hear it landing.",
      "Somebody had built a very small snowman by the bus stop. I fixed his nose.",
      "The houses had lights on at three in the afternoon. It was cozy.",
    ],
    souvenirs: [
      s("snow-globe", "🔮", "Snow globe", "Shake it. That's what it looked like."),
      s("mitten", "🧤", "Odd mitten", "Found on a fence post. I left a note."),
    ],
  },
  {
    id: "sleeper-train",
    name: "The Night Train",
    tier: 5,
    category: "city",
    region: "somewhere between two cities",
    blurb: "A long train through the dark. Little towns flash by.",
    scene: { kind: "station", accent: "#4f5a8a" },
    rare: true,
    activities: [
      { prompt: "sitting by a dark train window at night, lights of distant towns outside", line: "I rode the night train and counted the towns going by." },
    ],
    lines: [
      "Every town looks like a box of lights from the train.",
      "The conductor walked by very quietly, like he didn't want to wake the train.",
      "I didn't sleep. I didn't want to miss anything.",
    ],
    souvenirs: [s("bento-box", "🍱", "Station bento wrapper", "Furoshiki cloth. The bento was very good.")],
  },
  {
    id: "star-field",
    name: "Stargazing Hill",
    tier: 5,
    category: "nature",
    region: "far from any city lights",
    blurb: "So dark you can see the river of stars.",
    scene: { kind: "field", accent: "#4f5a8a" },
    rare: true,
    weight: 0.7,
    activities: [
      { prompt: "lying on a grassy hill under a sky full of stars", line: "I lay on the hill and the sky got more and more crowded." },
    ],
    lines: [
      "I saw a shooting star. I didn't make a wish because I was too surprised.",
      "The grass was wet and cold and I didn't mind.",
    ],
    souvenirs: [s("star-sand", "✨", "Star sand", "In a tiny bottle. The man said it's from a star. It's from a beach.")],
  },
  {
    id: "lighthouse",
    name: "Lighthouse at the Edge",
    tier: 5,
    category: "nature",
    region: "end of the coastal road",
    blurb: "White tower, red door, nothing beyond but sea.",
    scene: { kind: "sea", accent: "#c4704f", landmark: "lighthouse" },
    rare: true,
    weight: 0.6,
    weatherBias: { windy: 1.5, foggy: 1.4 },
    activities: [
      { prompt: "standing at the base of a white lighthouse on a cliff", line: "I walked to the very end of the road. There was a lighthouse, then just sea." },
    ],
    lines: [
      "The lighthouse keeper has a dog. The dog has a raincoat.",
      "I stood at the edge for a long time. It felt like the end of a map.",
    ],
    souvenirs: [s("lighthouse-key", "🗝️", "Brass key", "Doesn't open anything anymore. The keeper said to keep it.")],
  },
  {
    id: "old-bookstore-town",
    name: "Town of Old Bookshops",
    tier: 5,
    category: "cozy",
    region: "a long ride inland",
    blurb: "Thirty bookshops on one street. Some of them are open.",
    scene: { kind: "interior", interior: "books", accent: "#8a5a3a" },
    activities: [
      { prompt: "sitting on a step stool in a cramped old bookshop, reading", line: "I sat on a little stool in a bookshop and read half of something." },
    ],
    lines: [
      "One shop only sells maps of places that don't exist anymore.",
      "I found a note inside a book from 1974. It just says 'buy eggs'.",
      "The bookseller wrapped my book in paper and string without asking.",
    ],
    souvenirs: [s("old-book", "📕", "Very old book", "I can't read the title. It smells wonderful.")],
  },
];

export function getDestinationDef(id: string): DestinationDef | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

export function toDestination(def: DestinationDef): Destination {
  const { id, name, tier, category, region, blurb, scene, rare } = def;
  return { id, name, tier, category, region, blurb, scene, rare };
}
