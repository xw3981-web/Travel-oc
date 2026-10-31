export type OCStyle = "original" | "cartoon";

/** Each trait is 0..1. Generated randomly for now; nudges destination choice and diary tone. */
export type OCPersonality = {
  curiosity: number;
  sociability: number;
  adventurousness: number;
};

export type OC = {
  id: string;
  name: string;
  originalImageUrl: string;
  styledImageUrl?: string;
  activeStyle: OCStyle;
  /** Free-text look description, fed into travel image prompts. */
  description?: string;
  /** Dominant colours sampled from the image, as hex. Used for prompts and accents. */
  palette?: string[];
  personality?: OCPersonality;
  createdAt: string;
  updatedAt?: string;
};

export function getOCImage(oc: OC): string {
  if (oc.activeStyle === "cartoon" && oc.styledImageUrl) return oc.styledImageUrl;
  return oc.originalImageUrl;
}
