import { isFoodType } from "@/lib/game/foods";
import type { Journey } from "@/types/journey";
import type { OC } from "@/types/oc";

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isDate = (v: unknown): v is string => isStr(v) && !Number.isNaN(new Date(v).getTime());
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function parseOC(v: unknown): OC | null {
  if (!isObj(v)) return null;
  if (!isStr(v.id) || !isStr(v.name) || !isStr(v.originalImageUrl) || !isDate(v.createdAt)) return null;
  const activeStyle = v.activeStyle === "cartoon" && isStr(v.styledImageUrl) ? "cartoon" : "original";
  const p = isObj(v.personality) ? v.personality : null;
  return {
    id: v.id,
    name: v.name.slice(0, 40),
    originalImageUrl: v.originalImageUrl,
    styledImageUrl: isStr(v.styledImageUrl) ? v.styledImageUrl : undefined,
    activeStyle,
    description: isStr(v.description) ? v.description : undefined,
    palette: Array.isArray(v.palette) ? v.palette.filter(isStr) : undefined,
    personality:
      p && isNum(p.curiosity) && isNum(p.sociability) && isNum(p.adventurousness)
        ? { curiosity: p.curiosity, sociability: p.sociability, adventurousness: p.adventurousness }
        : undefined,
    createdAt: v.createdAt,
    updatedAt: isDate(v.updatedAt) ? v.updatedAt : undefined,
  };
}

/** Accepts a journey if its core fields are sound; optional fields are trusted shallowly. */
export function parseJourney(v: unknown): Journey | null {
  if (!isObj(v)) return null;
  if (!isStr(v.id) || !isStr(v.ocId) || !isStr(v.seed)) return null;
  if (!isDate(v.startedAt) || !isDate(v.expectedEndAt)) return null;
  if (!isNum(v.durationMinutes) || v.durationMinutes <= 0) return null;
  if (!isFoodType(v.food)) return null;
  if (v.status !== "traveling" && v.status !== "completed" && v.status !== "interrupted") return null;
  const resolved = v.status !== "traveling";
  if (resolved && (!isObj(v.destination) || !isStr(v.diary))) return null;

  return {
    ...(v as unknown as Journey),
    pausedAt: isDate(v.pausedAt) ? v.pausedAt : null,
    pausedTotalMs: isNum(v.pausedTotalMs) ? v.pausedTotalMs : 0,
    savedToAlbum: v.savedToAlbum === true,
  };
}
