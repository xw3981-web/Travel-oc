import type { CutoutResult } from "@/lib/image/imageUtils";
import type { AIService, OwnerChatInput, OwnerChatReply, TravelImage, TravelImageInput, TravelStory, TravelStoryInput } from "./types";

/**
 * Adapter for a real provider behind your own API routes (keeps keys server-side).
 * Implement these endpoints with any image model / LLM, e.g.:
 *
 *   POST {base}/cutout    { imageUrl }                       → { url, status }   (e.g. rembg / SAM)
 *   POST {base}/stylize   { imageUrl }                       → { imageUrl }
 *   POST {base}/image     TravelImageInput                   → { url, includesOC: true }
 *   POST {base}/story     TravelStoryInput                   → { diary }
 *   POST {base}/chat      OwnerChatInput                     → { category, reply }
 *
 * For identity consistency, the image route should condition on
 * `ocReferenceImageUrl` (IP-Adapter / reference-image / LoRA) rather than text alone.
 * Enable with NEXT_PUBLIC_AI_PROVIDER=http and NEXT_PUBLIC_AI_BASE_URL=/api/ai.
 */
export function createHttpAIService(baseUrl: string): AIService {
  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`AI request ${path} failed (${res.status})`);
    return (await res.json()) as T;
  }

  return {
    id: "http",
    removeBackground: (imageUrl: string) => post<CutoutResult>("/cutout", { imageUrl }),
    async stylizeOC(imageUrl) {
      const { imageUrl: styled } = await post<{ imageUrl: string }>("/stylize", { imageUrl });
      return styled;
    },
    generateTravelImage: (input: TravelImageInput) => post<TravelImage>("/image", input),
    generateTravelStory: (input: TravelStoryInput) => post<TravelStory>("/story", input),
    respondToOwner: (input: OwnerChatInput) => post<OwnerChatReply>("/chat", input),
  };
}
