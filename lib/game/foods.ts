import type { DestinationCategory, FoodType } from "@/types/journey";

export type FoodItem = {
  id: FoodType;
  name: string;
  emoji: string;
  /** Destination category this food nudges toward. */
  leaning: DestinationCategory;
  hint: string;
  /** Lower-case form used inside diary sentences. */
  inline: string;
};

export const FOODS: Record<FoodType, FoodItem> = {
  riceball: {
    id: "riceball",
    name: "Rice ball",
    emoji: "🍙",
    leaning: "nature",
    hint: "Tastes best outdoors",
    inline: "rice ball",
  },
  sandwich: {
    id: "sandwich",
    name: "Sandwich",
    emoji: "🥪",
    leaning: "city",
    hint: "Easy to eat on the go",
    inline: "sandwich",
  },
  cookies: {
    id: "cookies",
    name: "Cookies",
    emoji: "🍪",
    leaning: "cozy",
    hint: "For quiet little corners",
    inline: "cookies",
  },
};

export const FOOD_LIST: FoodItem[] = Object.values(FOODS);

export function isFoodType(value: unknown): value is FoodType {
  return typeof value === "string" && value in FOODS;
}
