import { getAIService } from "@/lib/ai";
import { mockAIService } from "@/lib/ai/mockAIService";
import { getElapsedMinutes } from "@/lib/timer/journeyTimer";
import type { Journey } from "@/types/journey";
import { getOCImage, type OC } from "@/types/oc";
import { generateJourney } from "./journeyGenerator";

/**
 * Turns a traveling journey into a finished one. The game result is
 * deterministic; AI only decorates it (photo, diary polish), and any AI
 * failure falls back to the offline mock so the OC always comes home.
 */
export async function resolveJourney(
  journey: Journey,
  oc: OC,
  mode: "completed" | "interrupted",
  now = Date.now(),
): Promise<Journey> {
  const interrupted = mode === "interrupted";
  const actualMinutes = interrupted ? getElapsedMinutes(journey, now) : journey.durationMinutes;

  const result = generateJourney(
    { durationMinutes: journey.durationMinutes, food: journey.food, ocId: journey.ocId, startedAt: journey.startedAt },
    {
      personality: oc.personality,
      ocDescription: oc.description,
      ocName: oc.name,
      interrupted,
      actualMinutes,
    },
  );

  const ai = getAIService();
  const imageInput = {
    prompt: result.imagePrompt,
    seed: journey.seed,
    destination: result.destination,
    conditions: result.conditions,
    composition: result.composition,
    ocReferenceImageUrl: getOCImage(oc),
    ocName: oc.name,
  };
  const storyInput = {
    ocName: oc.name,
    personality: oc.personality,
    destination: result.destination,
    conditions: result.conditions,
    events: result.events,
    souvenir: result.souvenir,
    interrupted,
    draftDiary: result.diary,
  };

  const [image, story] = await Promise.all([
    ai.generateTravelImage(imageInput).catch(() => mockAIService.generateTravelImage(imageInput)),
    ai.generateTravelStory(storyInput).catch(() => ({ diary: result.diary })),
  ]);

  return {
    ...journey,
    status: mode,
    pausedAt: null,
    // A trip that finished while the app was closed still ends at its scheduled time.
    completedAt: interrupted ? new Date(now).toISOString() : journey.expectedEndAt,
    actualDurationMinutes: actualMinutes,
    destination: result.destination,
    diary: story.diary,
    diarySource: story.diary === result.diary ? "template" : "ai",
    souvenir: result.souvenir,
    events: result.events,
    conditions: result.conditions,
    composition: result.composition,
    imagePrompt: result.imagePrompt,
    travelImageUrl: image.url,
    travelImageIncludesOC: image.includesOC,
  };
}
