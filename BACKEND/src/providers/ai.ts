/**
 * Provider contracts for optional AI capabilities.
 * No default/mock provider is supplied: callers must inject a configured
 * implementation or report that the capability is unavailable.
 */

export type ModerationDecision = "allow" | "review" | "block";

export interface ModerationResult {
  decision: ModerationDecision;
  categories: string[];
  providerReference?: string;
}

export interface RecommendationCandidate {
  entityType: "creator" | "video" | "event" | "track" | "product";
  entityId: string;
  score: number;
  reasonCodes: string[];
}

export interface CreatorAnalyticsSummary {
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, number>;
  source: "provider";
}

export interface AIProvider {
  moderate(input: { text: string; locale?: string; context: string }): Promise<ModerationResult>;
  recommend(input: { userId: string; candidateIds: string[]; signals: ReadonlyArray<DiscoverySignal> }): Promise<RecommendationCandidate[]>;
  createCaption(input: { mediaReference: string; locale?: string }): Promise<{ caption: string; locale: string }>;
  translate(input: { text: string; targetLocale: string }): Promise<{ text: string; targetLocale: string }>;
  summarizeHighlights(input: { liveSessionId: string; transcript: string }): Promise<{ highlights: string[] }>;
  hostGame(input: { gameId: string; state: unknown; playerInput: unknown }): Promise<{ response: unknown }>;
  summarizeCreatorAnalytics(input: { creatorId: string; metrics: Record<string, number> }): Promise<CreatorAnalyticsSummary>;
}

/** Signals must originate from observed product actions, never generated defaults. */
export type DiscoverySignal = {
  signalId: string;
  userId: string;
  kind: "watch" | "like" | "share" | "follow" | "comment" | "gift" | "game" | "search" | "category" | "location";
  entityType?: RecommendationCandidate["entityType"];
  entityId?: string;
  occurredAt: string;
  value?: number;
};

export class AIProviderUnavailableError extends Error {
  constructor(capability: string) {
    super(`AI provider is not configured for ${capability}`);
    this.name = "AIProviderUnavailableError";
  }
}
