import type { CutoutResult } from "@/lib/image/imageUtils";
import type { OCPersonality } from "@/types/oc";
import type {
  Destination,
  PhotoComposition,
  Souvenir,
  TravelConditions,
  TravelEvent,
} from "@/types/journey";

export type TravelImageInput = {
  prompt: string;
  seed: string;
  destination: Destination;
  conditions: TravelConditions;
  composition: PhotoComposition;
  /**
   * The OC's current image. Real providers should use it for reference-image
   * conditioning (IP-Adapter, LoRA, image-to-image) so identity stays consistent.
   */
  ocReferenceImageUrl: string;
  ocName: string;
};

export type TravelImage = {
  url: string;
  /** False when the image is only a backdrop and the UI should composite the OC on top. */
  includesOC: boolean;
};

export type TravelStoryInput = {
  ocName: string;
  personality?: OCPersonality;
  destination: Destination;
  conditions: TravelConditions;
  events: TravelEvent[];
  souvenir?: Souvenir;
  interrupted: boolean;
  /** Deterministic draft from the game generator; LLM providers may rewrite it. */
  draftDiary: string;
};

export type TravelStory = {
  diary: string;
};

export type OwnerChatInput = {
  activity: string;
  minutes: number;
  ocName: string;
  personality?: OCPersonality;
  seed: string;
  locale: string;
};

export type OwnerChatReply = { category: string; replyKey?: string; reply?: string };

export interface AIService {
  readonly id: string;
  /** Cuts the OC out of its background (keeps images that are already transparent). */
  removeBackground(imageUrl: string): Promise<CutoutResult>;
  /** Returns a URL (data: or remote) of the stylised OC. */
  stylizeOC(imageUrl: string): Promise<string>;
  generateTravelImage(input: TravelImageInput): Promise<TravelImage>;
  generateTravelStory(input: TravelStoryInput): Promise<TravelStory>;
  /** The OC's answer when the owner says what they focused on. */
  respondToOwner(input: OwnerChatInput): Promise<OwnerChatReply>;
}
