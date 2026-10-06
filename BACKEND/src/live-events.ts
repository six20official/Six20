import { DataPacket_Kind, RoomServiceClient } from "livekit-server-sdk";

export type LiveEventType =
  | "live.chat"
  | "live.reaction"
  | "live.gift"
  | "live.viewer.join"
  | "live.viewer.leave"
  | "live.goal.update"
  | "live.goal.complete"
  | "live.leaderboard.update"
  | "live.moderation"
  | "live.battle.update"
  | "live.battle.invite"
  | "live.battle.accept"
  | "live.battle.start"
  | "live.battle.end"
  | "live.game.lobby"
  | "live.game.join"
  | "live.game.leave"
  | "live.game.state"
  | "live.game.action"
  | "live.game.end"
  | "live.poll.create"
  | "live.poll.vote"
  | "live.poll.update"
  | "live.poll.end"
  | "live.game.update";

export type LiveEventPayloadMap = {
  "live.battle.invite": { battleId: number; fromSessionId: number; fromCreatorId: number; durationSeconds: number };
  "live.battle.accept": { battleId: number; sessionAId: number; sessionBId: number };
  "live.battle.start": { battleId: number; startsAt: string; endsAt: string; durationSeconds: number };
  "live.battle.update": { battleId: number; scoreA: number; scoreB: number; giftTotalAKobo: number; giftTotalBKobo: number; cause: "gift" | "reaction" };
  "live.battle.end": { battleId: number; scoreA: number; scoreB: number; winnerCreatorId: number | null };
  "live.game.lobby": { gameId: number; kind: "ludo"; hostUserId: number; players: number[] };
  "live.game.join": { gameId: number; userId: number; players: number[] };
  "live.game.leave": { gameId: number; userId: number; players: number[] };
  "live.game.state": { gameId: number; kind: "ludo"; state: Record<string, unknown> };
  "live.game.action": { gameId: number; userId: number; action: "ready" | "roll" | "move" };
  "live.game.end": { gameId: number; kind: "ludo"; winnerUserId: number };
  "live.poll.create": { pollId: number; question: string; options: string[]; endsAt: string };
  "live.poll.vote": { pollId: number; userId: number; optionIndex: number };
  "live.poll.update": { pollId: number; counts: number[]; totalVotes: number; endsAt: string };
  "live.poll.end": { pollId: number; counts: number[]; totalVotes: number };
};

export type LiveEvent<T extends Record<string, unknown> = Record<string, unknown>> = {
  version: 1;
  eventId: string;
  sessionId: number;
  type: LiveEventType;
  actorId: number | null;
  timestamp: string;
  payload: T;
};

export async function publishLiveEvent<T extends Record<string, unknown>>(
  sessionId: number,
  type: LiveEventType,
  payload: T,
  actorId: number | null = null,
  lossy = false,
  options: { eventId?: string; requireConfigured?: boolean } = {},
): Promise<LiveEvent<T>> {
  const event: LiveEvent<T> = {
    version: 1,
    eventId: options.eventId || crypto.randomUUID(),
    sessionId,
    type,
    actorId,
    timestamp: new Date().toISOString(),
    payload,
  };
  const url = process.env.LIVEKIT_URL?.trim();
  const key = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !key || !secret) {
    if (options.requireConfigured) throw new Error("LiveKit is not configured for durable LIVE event delivery");
    return event;
  }
  const roomService = new RoomServiceClient(url, key, secret);
  const packet = Buffer.from(JSON.stringify(event, (_key, value) => typeof value === "bigint" ? value.toString() : value));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await roomService.sendData(
        `six20-live-${sessionId}`,
        packet,
        lossy ? DataPacket_Kind.LOSSY : DataPacket_Kind.RELIABLE,
        { topic: type },
      );
      return event;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  return event;
}
