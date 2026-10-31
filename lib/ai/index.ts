import { createHttpAIService } from "./httpAIService";
import { mockAIService } from "./mockAIService";
import type { AIService } from "./types";

let instance: AIService | null = null;

/** Picks the AI provider from env; defaults to the offline mock. */
export function getAIService(): AIService {
  if (instance) return instance;
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER;
  instance =
    provider === "http"
      ? createHttpAIService(process.env.NEXT_PUBLIC_AI_BASE_URL ?? "/api/ai")
      : mockAIService;
  return instance;
}

export type { AIService } from "./types";
