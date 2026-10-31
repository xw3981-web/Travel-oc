import { classifyActivity, pickReplyKey } from "@/lib/game/ownerChat";
import { autoCutout, cartoonize } from "@/lib/image/imageUtils";
import { renderTravelScene, svgToDataUrl } from "./sceneArt";
import type { AIService, OwnerChatInput, OwnerChatReply, TravelImage, TravelImageInput, TravelStory, TravelStoryInput } from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Works entirely offline: a canvas filter for stylisation, procedural SVG
 * scenes for travel photos, and the generator's own draft for the diary.
 */
export const mockAIService: AIService = {
  id: "mock",

  removeBackground(imageUrl: string) {
    return autoCutout(imageUrl);
  },

  async stylizeOC(imageUrl: string): Promise<string> {
    await wait(500); // let the "inking" state read as intentional
    return cartoonize(imageUrl);
  },

  async generateTravelImage(input: TravelImageInput): Promise<TravelImage> {
    const svg = renderTravelScene(input.destination.scene, input.conditions, input.seed);
    return { url: svgToDataUrl(svg), includesOC: false };
  },

  async generateTravelStory(input: TravelStoryInput): Promise<TravelStory> {
    return { diary: input.draftDiary };
  },

  async respondToOwner(input: OwnerChatInput): Promise<OwnerChatReply> {
    await wait(900); // a beat to "think"
    const category = classifyActivity(input.activity);
    return { category, replyKey: pickReplyKey(category, input.seed) };
  },
};
