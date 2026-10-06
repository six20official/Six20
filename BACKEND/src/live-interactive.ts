import type { Express, Request, Response, NextFunction } from "express";
import type { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { randomInt } from "crypto";
import { publishLiveEvent } from "./live-events";

type AuthRequest = Request & { userId?: number };
type Auth = (req: Request, res: Response, next: NextFunction) => unknown;
type LudoPlayer = { userId: number; ready: boolean; pieces: number[] };
type LudoState = { players: LudoPlayer[]; turnIndex: number; dice: number | null };
const interactionLimit = rateLimit({ windowMs: 5_000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false });
const publicUser = { id: true, username: true, displayName: true, avatarUrl: true } as const;

async function emitRoom(sessionId: number, type: Parameters<typeof publishLiveEvent>[1], payload: Record<string, unknown>, actorId: number | null = null) {
  try { await publishLiveEvent(sessionId, type, payload, actorId); }
  catch (error) { console.error("LIVE interactive event delivery failed:", error); }
}

async function emitBattle(prisma: PrismaClient, battle: { id: number; sessionAId: number; sessionBId: number; scoreA: number; scoreB: number; giftTotalAKobo: bigint; giftTotalBKobo: bigint }, type: Parameters<typeof publishLiveEvent>[1], payload: Record<string, unknown>, actorId: number | null = null) {
  await Promise.all([battle.sessionAId, battle.sessionBId].map((sessionId) => emitRoom(sessionId, type, { battleId: battle.id, ...payload }, actorId)));
}

async function finishBattle(prisma: PrismaClient, battleId: number) {
  const battle = await prisma.liveBattle.findUnique({ where: { id: battleId } });
  if (!battle || battle.status !== "live" || !battle.endsAt || battle.endsAt > new Date()) return battle;
  const [a, b] = await Promise.all([
    prisma.liveSession.findUnique({ where: { id: battle.sessionAId }, select: { creatorId: true } }),
    prisma.liveSession.findUnique({ where: { id: battle.sessionBId }, select: { creatorId: true } }),
  ]);
  const winnerCreatorId = battle.scoreA === battle.scoreB ? null : battle.scoreA > battle.scoreB ? a?.creatorId ?? null : b?.creatorId ?? null;
  const ended = await prisma.liveBattle.updateMany({ where: { id: battleId, status: "live" }, data: { status: "ended", winnerCreatorId } });
  if (ended.count) await emitBattle(prisma, battle, "live.battle.end", { scoreA: battle.scoreA, scoreB: battle.scoreB, giftTotalAKobo: battle.giftTotalAKobo, giftTotalBKobo: battle.giftTotalBKobo, winnerCreatorId });
  return prisma.liveBattle.findUnique({ where: { id: battleId } });
}

export async function contributeBattleScore(prisma: PrismaClient, sessionId: number, cause: "gift" | "reaction", amount: number, actorId: number, giftTotalKobo = 0n) {
  try {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const battle = await prisma.liveBattle.findFirst({ where: { status: "live", OR: [{ sessionAId: sessionId }, { sessionBId: sessionId }] } });
    if (!battle) return;
    if (battle.endsAt && battle.endsAt <= new Date()) { await finishBattle(prisma, battle.id); return; }
    if (battle.startsAt && battle.startsAt > new Date()) return;
    const side = sessionId === battle.sessionAId ? "scoreA" : "scoreB";
    const giftSide = sessionId === battle.sessionAId ? "giftTotalAKobo" : "giftTotalBKobo";
    const updated = await prisma.liveBattle.update({ where: { id: battle.id }, data: { [side]: { increment: amount }, ...(cause === "gift" ? { [giftSide]: { increment: giftTotalKobo } } : {}) } });
    await emitBattle(prisma, updated, "live.battle.update", { scoreA: updated.scoreA, scoreB: updated.scoreB, giftTotalAKobo: updated.giftTotalAKobo, giftTotalBKobo: updated.giftTotalBKobo, cause }, actorId);
  } catch (error) { console.error("Battle score update failed after LIVE interaction:", error); }
}

function parseState(value: unknown): LudoState {
  return value as LudoState;
}
function countsForPoll(votes: Array<{ optionIndex: number }>, optionCount: number) {
  const counts = Array.from({ length: optionCount }, () => 0);
  for (const vote of votes) if (Number.isInteger(vote.optionIndex) && vote.optionIndex >= 0 && vote.optionIndex < optionCount) counts[vote.optionIndex] += 1;
  return counts;
}

export function registerLiveInteractiveRoutes(app: Express, prisma: PrismaClient, requireAuth: Auth) {
  app.get("/api/live/:id/battle", requireAuth, async (req: AuthRequest, res: Response) => {
    const sessionId = Number(req.params.id);
    const battle = await prisma.liveBattle.findFirst({ where: { OR: [{ sessionAId: sessionId }, { sessionBId: sessionId }], status: { in: ["invited", "accepted", "live"] } }, orderBy: { createdAt: "desc" } });
    if (!battle) return res.json({ success: true, battle: null });
    const current = battle.status === "live" ? await finishBattle(prisma, battle.id) : battle;
    const [a, b] = await Promise.all([prisma.liveSession.findUnique({ where: { id: battle.sessionAId }, select: { id: true, creator: { select: publicUser } } }), prisma.liveSession.findUnique({ where: { id: battle.sessionBId }, select: { id: true, creator: { select: publicUser } } })]);
    return res.json({ success: true, battle: { ...current, sessionA: a, sessionB: b } });
  });

  app.get("/api/live/:id/battle/history", requireAuth, async (req: AuthRequest, res: Response) => {
    const sessionId = Number(req.params.id);
    const history = await prisma.liveBattle.findMany({ where: { OR: [{ sessionAId: sessionId }, { sessionBId: sessionId }], status: { in: ["ended", "declined"] } }, orderBy: { updatedAt: "desc" }, take: 25 });
    return res.json({ success: true, history });
  });

  app.post("/api/live/:id/battle/invite", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const sessionId = Number(req.params.id), opponentSessionId = Number(req.body?.opponentSessionId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    if (!Number.isSafeInteger(sessionId) || !Number.isSafeInteger(opponentSessionId) || sessionId === opponentSessionId) return res.status(400).json({ message: "Choose another active LIVE" });
    const [a, b] = await Promise.all([prisma.liveSession.findUnique({ where: { id: sessionId }, select: { id: true, creatorId: true, status: true } }), prisma.liveSession.findUnique({ where: { id: opponentSessionId }, select: { id: true, creatorId: true, status: true } })]);
    if (!a || !b || a.status !== "live" || b.status !== "live") return res.status(409).json({ message: "Both creators must be live" });
    if (a.creatorId !== userId) return res.status(403).json({ message: "Only the creator can invite a battle" });
    if (a.creatorId === b.creatorId) return res.status(400).json({ message: "You cannot battle your own LIVE" });
    const durationSeconds = Math.min(600, Math.max(60, Number(req.body?.durationSeconds) || 180));
    const existing = await prisma.liveBattle.findFirst({ where: { status: { in: ["invited", "accepted", "live"] }, OR: [{ sessionAId: sessionId }, { sessionBId: sessionId }, { sessionAId: opponentSessionId }, { sessionBId: opponentSessionId }] } });
    if (existing) return res.status(409).json({ message: "One of these creators is already in a battle" });
    const battle = await prisma.liveBattle.create({ data: { sessionAId: sessionId, sessionBId: opponentSessionId, invitedByUserId: userId, durationSeconds } });
    await emitRoom(opponentSessionId, "live.battle.invite", { battleId: battle.id, fromSessionId: sessionId, fromCreatorId: userId, durationSeconds }, userId);
    return res.status(201).json({ success: true, battle });
  });

  app.post("/api/live/battles/:battleId/respond", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const battleId = Number(req.params.battleId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const battle = await prisma.liveBattle.findUnique({ where: { id: battleId } });
    if (!battle || battle.status !== "invited") return res.status(409).json({ message: "Battle invitation is no longer available" });
    const target = await prisma.liveSession.findUnique({ where: { id: battle.sessionBId }, select: { creatorId: true, status: true } });
    if (!target || target.creatorId !== userId) return res.status(403).json({ message: "Only the invited creator can respond" });
    if (req.body?.accept !== true) {
      await prisma.liveBattle.update({ where: { id: battleId }, data: { status: "declined" } });
      return res.json({ success: true, status: "declined" });
    }
    if (target.status !== "live") return res.status(409).json({ message: "Your LIVE has ended" });
    const updated = await prisma.liveBattle.update({ where: { id: battleId }, data: { status: "accepted" } });
    await emitBattle(prisma, updated, "live.battle.accept", { sessionAId: updated.sessionAId, sessionBId: updated.sessionBId }, userId);
    return res.json({ success: true, battle: updated });
  });

  app.post("/api/live/battles/:battleId/start", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const battleId = Number(req.params.battleId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const battle = await prisma.liveBattle.findUnique({ where: { id: battleId } });
    if (!battle || battle.status !== "accepted") return res.status(409).json({ message: "Battle is not accepted" });
    const [a, b] = await Promise.all([prisma.liveSession.findUnique({ where: { id: battle.sessionAId }, select: { creatorId: true, status: true } }), prisma.liveSession.findUnique({ where: { id: battle.sessionBId }, select: { creatorId: true, status: true } })]);
    if (!a || !b || a.status !== "live" || b.status !== "live") return res.status(409).json({ message: "Both creators must remain live" });
    if (userId !== a.creatorId && userId !== b.creatorId) return res.status(403).json({ message: "Only a participating creator can start the battle" });
    const startsAt = new Date(Date.now() + 3_000), endsAt = new Date(startsAt.getTime() + battle.durationSeconds * 1_000);
    const updated = await prisma.liveBattle.update({ where: { id: battleId }, data: { status: "live", startsAt, endsAt } });
    await emitBattle(prisma, updated, "live.battle.start", { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), durationSeconds: battle.durationSeconds }, userId);
    return res.json({ success: true, battle: updated });
  });

  app.get("/api/live/:id/play", requireAuth, async (req: AuthRequest, res: Response) => {
    const liveSessionId = Number(req.params.id);
    const [session, presence, restriction] = await Promise.all([prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { creatorId: true } }), req.userId ? prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: req.userId } }, select: { lastSeenAt: true } }) : null, req.userId ? prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: req.userId } }, select: { isBanned: true, removedUntil: true } }) : null]);
    if (!session) return res.sendStatus(404);
    if (session.creatorId !== req.userId && (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000))) return res.status(403).json({ message: "Join this LIVE before opening PLAY" });
    if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ message: "You cannot join games in this LIVE" });
    const games = await prisma.livePlayGame.findMany({ where: { liveSessionId, status: { in: ["lobby", "playing"] } }, orderBy: { createdAt: "desc" }, take: 5 });
    const openPolls = await prisma.livePoll.findMany({ where: { liveSessionId, status: "open" }, orderBy: { createdAt: "desc" }, take: 1 });
    const polls = openPolls.length ? openPolls : await prisma.livePoll.findMany({ where: { liveSessionId }, orderBy: { createdAt: "desc" }, take: 1 });
    const pollsWithCounts = await Promise.all(polls.map(async (poll) => { const current = poll.status === "open" && poll.endsAt <= new Date() ? await prisma.livePoll.update({ where: { id: poll.id }, data: { status: "ended" } }) : poll; const votes = await prisma.livePollVote.findMany({ where: { pollId: poll.id }, select: { optionIndex: true } }); const counts = countsForPoll(votes, (poll.options as string[]).length); if (current.status === "ended" && poll.status === "open") await emitRoom(liveSessionId, "live.poll.end", { pollId: poll.id, counts, totalVotes: votes.length }); return { ...current, counts, totalVotes: votes.length }; }));
    return res.json({ success: true, games, polls: pollsWithCounts });
  });

  app.post("/api/live/:id/play/ludo", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const liveSessionId = Number(req.params.id), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { creatorId: true, status: true } });
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE is not active" });
    if (session.creatorId !== userId) return res.status(403).json({ message: "Only the creator can open a Ludo lobby" });
    const state: LudoState = { players: [{ userId, ready: true, pieces: [-1, -1, -1, -1] }], turnIndex: 0, dice: null };
    const game = await prisma.livePlayGame.create({ data: { liveSessionId, kind: "ludo", hostUserId: userId, state } });
    await emitRoom(liveSessionId, "live.game.lobby", { gameId: game.id, kind: "ludo", hostUserId: userId, players: [userId] }, userId);
    return res.status(201).json({ success: true, game });
  });

  app.post("/api/live/play/:gameId/join", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const gameId = Number(req.params.gameId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const game = await prisma.livePlayGame.findUnique({ where: { id: gameId } });
    if (!game || game.kind !== "ludo" || game.status !== "lobby") return res.status(409).json({ message: "Ludo lobby is closed" });
    const state = parseState(game.state);
    if (state.players.some((player) => player.userId === userId)) return res.json({ success: true, game });
    if (state.players.length >= 4) return res.status(409).json({ message: "Ludo supports up to four players" });
    const [session, presence, restriction] = await Promise.all([prisma.liveSession.findUnique({ where: { id: game.liveSessionId }, select: { status: true, creatorId: true } }), prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { lastSeenAt: true } }), prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { isBanned: true, removedUntil: true } })]);
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE has ended" });
    if (session.creatorId !== userId && (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000))) return res.status(403).json({ message: "Join this LIVE before playing" });
    if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ message: "You cannot join this LIVE game" });
    state.players.push({ userId, ready: false, pieces: [-1, -1, -1, -1] });
    const updated = await prisma.livePlayGame.update({ where: { id: gameId }, data: { state } });
    await emitRoom(game.liveSessionId, "live.game.join", { gameId, userId, players: state.players.map((player) => player.userId) }, userId);
    await emitRoom(game.liveSessionId, "live.game.state", { gameId, kind: "ludo", state: state as unknown as Record<string, unknown> }, userId);
    return res.json({ success: true, game: updated });
  });

  app.post("/api/live/play/:gameId/leave", requireAuth, async (req: AuthRequest, res: Response) => {
    const gameId = Number(req.params.gameId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const game = await prisma.livePlayGame.findUnique({ where: { id: gameId } });
    if (!game || game.status !== "lobby") return res.status(409).json({ message: "You can only leave a lobby" });
    const state = parseState(game.state), players = state.players.filter((player) => player.userId !== userId);
    if (players.length === state.players.length) return res.status(404).json({ message: "You are not in this lobby" });
    if (!players.length) await prisma.livePlayGame.update({ where: { id: gameId }, data: { status: "cancelled" } });
    else { state.players = players; state.turnIndex = Math.min(state.turnIndex, players.length - 1); await prisma.livePlayGame.update({ where: { id: gameId }, data: { state } }); }
    await emitRoom(game.liveSessionId, "live.game.leave", { gameId, userId, players: players.map((player) => player.userId) }, userId);
    return res.json({ success: true });
  });

  app.post("/api/live/play/:gameId/ready", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const gameId = Number(req.params.gameId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const game = await prisma.livePlayGame.findUnique({ where: { id: gameId } });
    if (!game || game.kind !== "ludo" || game.status !== "lobby") return res.status(409).json({ message: "Lobby is not open" });
    const [session, presence, restriction] = await Promise.all([prisma.liveSession.findUnique({ where: { id: game.liveSessionId }, select: { status: true, creatorId: true } }), prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { lastSeenAt: true } }), prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { isBanned: true, removedUntil: true } })]);
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE has ended" });
    if (session.creatorId !== userId && (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000))) return res.status(403).json({ message: "Rejoin this LIVE before playing" });
    if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ message: "You cannot play in this LIVE" });
    const state = parseState(game.state), player = state.players.find((entry) => entry.userId === userId);
    if (!player) return res.status(403).json({ message: "Join the lobby first" });
    player.ready = req.body?.ready !== false;
    const start = userId === game.hostUserId && state.players.length >= 2 && state.players.every((entry) => entry.ready);
    const updated = await prisma.livePlayGame.update({ where: { id: gameId }, data: { state, ...(start ? { status: "playing" } : {}) } });
    await emitRoom(game.liveSessionId, "live.game.state", { gameId, kind: "ludo", state: state as unknown as Record<string, unknown>, status: updated.status }, userId);
    return res.json({ success: true, game: updated, started: start, creatorId: session.creatorId });
  });

  app.post("/api/live/play/:gameId/action", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const gameId = Number(req.params.gameId), userId = req.userId, action = String(req.body?.action || "");
    if (!userId) return res.sendStatus(401);
    const game = await prisma.livePlayGame.findUnique({ where: { id: gameId } });
    if (!game || game.kind !== "ludo" || game.status !== "playing") return res.status(409).json({ message: "Ludo game is not in progress" });
    const [session, presence, restriction] = await Promise.all([prisma.liveSession.findUnique({ where: { id: game.liveSessionId }, select: { status: true, creatorId: true } }), prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { lastSeenAt: true } }), prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId: game.liveSessionId, userId } }, select: { isBanned: true, removedUntil: true } })]);
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE has ended" });
    if (session.creatorId !== userId && (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000))) return res.status(403).json({ message: "Rejoin this LIVE before playing" });
    if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ message: "You cannot play in this LIVE" });
    const state = parseState(game.state), player = state.players[state.turnIndex];
    if (!player || player.userId !== userId) return res.status(403).json({ message: "It is not your turn" });
    if (action === "roll") {
      if (state.dice !== null) return res.status(409).json({ message: "Move a piece first" });
      state.dice = randomInt(1, 7);
      const legal = player.pieces.some((position) => position === -1 ? state.dice === 6 : position + state.dice! <= 57);
      if (!legal) { state.dice = null; state.turnIndex = (state.turnIndex + 1) % state.players.length; }
    } else if (action === "move") {
      const pieceIndex = Number(req.body?.pieceIndex), dice = state.dice;
      if (dice === null || !Number.isInteger(pieceIndex) || pieceIndex < 0 || pieceIndex > 3) return res.status(400).json({ message: "Roll and choose a valid piece" });
      const position = player.pieces[pieceIndex];
      if (position === -1 && dice !== 6) return res.status(400).json({ message: "A six is required to leave home" });
      if (position !== -1 && position + dice > 57) return res.status(400).json({ message: "That move overshoots home" });
      const nextPosition = position === -1 ? 0 : position + dice;
      player.pieces[pieceIndex] = nextPosition;
      let captured = false;
      if (nextPosition < 52) {
        const track = (state.turnIndex * 13 + nextPosition) % 52;
        if (![0, 8, 13, 21, 26, 34, 39, 47].includes(track)) for (let idx = 0; idx < state.players.length; idx++) if (idx !== state.turnIndex) for (let otherPiece = 0; otherPiece < 4; otherPiece++) {
          const otherPosition = state.players[idx].pieces[otherPiece];
          if (otherPosition >= 0 && otherPosition < 52 && (idx * 13 + otherPosition) % 52 === track) { state.players[idx].pieces[otherPiece] = -1; captured = true; }
        }
      }
      state.dice = null;
      const winner = player.pieces.every((piece) => piece === 57);
      if (!winner && dice !== 6 && !captured) state.turnIndex = (state.turnIndex + 1) % state.players.length;
      if (winner) {
        const done = await prisma.livePlayGame.update({ where: { id: gameId }, data: { status: "ended", state, winnerUserId: userId, completedAt: new Date() } });
        await emitRoom(game.liveSessionId, "live.game.end", { gameId, kind: "ludo", winnerUserId: userId }, userId);
        await emitRoom(game.liveSessionId, "live.game.state", { gameId, kind: "ludo", state: state as unknown as Record<string, unknown> }, userId);
        return res.json({ success: true, game: done, winnerUserId: userId });
      }
    } else return res.status(400).json({ message: "Action must be roll or move" });
    const updated = await prisma.livePlayGame.update({ where: { id: gameId }, data: { state } });
    await emitRoom(game.liveSessionId, "live.game.action", { gameId, userId, action: action as "roll" | "move" }, userId);
    await emitRoom(game.liveSessionId, "live.game.state", { gameId, kind: "ludo", state: state as unknown as Record<string, unknown> }, userId);
    return res.json({ success: true, game: updated });
  });

  app.post("/api/live/:id/polls", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const liveSessionId = Number(req.params.id), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const question = String(req.body?.question || "").trim(), options = req.body?.options;
    const durationSeconds = Number(req.body?.durationSeconds);
    if (!Array.isArray(options) || options.length < 2 || options.length > 6 || options.some((option: unknown) => typeof option !== "string" || !option.trim() || option.length > 60) || !question || question.length > 180 || !Number.isInteger(durationSeconds) || durationSeconds < 10 || durationSeconds > 300) return res.status(400).json({ message: "Enter a question, 2–6 options, and duration from 10 to 300 seconds" });
    const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { creatorId: true, status: true } });
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE is not active" });
    if (session.creatorId !== userId) return res.status(403).json({ message: "Only the creator can create a poll" });
    const oldPolls = await prisma.livePoll.findMany({ where: { liveSessionId, status: "open" }, select: { id: true } });
    await prisma.livePoll.updateMany({ where: { liveSessionId, status: "open" }, data: { status: "ended" } });
    for (const oldPoll of oldPolls) { const priorVotes = await prisma.livePollVote.findMany({ where: { pollId: oldPoll.id }, select: { optionIndex: true } }); const prior = await prisma.livePoll.findUnique({ where: { id: oldPoll.id }, select: { options: true } }); if (prior) await emitRoom(liveSessionId, "live.poll.end", { pollId: oldPoll.id, counts: countsForPoll(priorVotes, (prior.options as string[]).length), totalVotes: priorVotes.length }, userId); }
    const endsAt = new Date(Date.now() + durationSeconds * 1000);
    const poll = await prisma.livePoll.create({ data: { liveSessionId, creatorId: userId, question, options: options.map((option: string) => option.trim()), endsAt } });
    await emitRoom(liveSessionId, "live.poll.create", { pollId: poll.id, question, options: poll.options as string[], endsAt: endsAt.toISOString() }, userId);
    return res.status(201).json({ success: true, poll, counts: options.map(() => 0), totalVotes: 0 });
  });

  app.post("/api/live/polls/:pollId/vote", interactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const pollId = Number(req.params.pollId), userId = req.userId, optionIndex = Number(req.body?.optionIndex);
    if (!userId) return res.sendStatus(401);
    const poll = await prisma.livePoll.findUnique({ where: { id: pollId } });
    if (!poll || poll.status !== "open" || poll.endsAt <= new Date()) return res.status(409).json({ message: "Poll has ended" });
    const options = poll.options as string[];
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) return res.status(400).json({ message: "Choose a valid option" });
    const [session, presence, restriction] = await Promise.all([prisma.liveSession.findUnique({ where: { id: poll.liveSessionId }, select: { creatorId: true, status: true } }), prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId: poll.liveSessionId, userId } }, select: { lastSeenAt: true } }), prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId: poll.liveSessionId, userId } }, select: { isBanned: true, removedUntil: true } })]);
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE has ended" });
    if (session.creatorId === userId) return res.status(403).json({ message: "The creator cannot vote in their own poll" });
    if (session.creatorId !== userId && (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000))) return res.status(403).json({ message: "Join this LIVE before voting" });
    if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ message: "You cannot vote in this LIVE" });
    try { await prisma.livePollVote.create({ data: { pollId, userId, optionIndex } }); }
    catch (error) { if ((error as { code?: string }).code === "P2002") return res.status(409).json({ message: "You have already voted" }); throw error; }
    const votes = await prisma.livePollVote.findMany({ where: { pollId }, select: { optionIndex: true } }), counts = countsForPoll(votes, options.length);
    await emitRoom(poll.liveSessionId, "live.poll.vote", { pollId, userId, optionIndex }, userId);
    await emitRoom(poll.liveSessionId, "live.poll.update", { pollId, counts, totalVotes: votes.length, endsAt: poll.endsAt.toISOString() });
    return res.json({ success: true, counts, totalVotes: votes.length });
  });

  app.post("/api/live/polls/:pollId/end", requireAuth, async (req: AuthRequest, res: Response) => {
    const pollId = Number(req.params.pollId), userId = req.userId;
    if (!userId) return res.sendStatus(401);
    const poll = await prisma.livePoll.findUnique({ where: { id: pollId } });
    if (!poll) return res.sendStatus(404);
    if (poll.creatorId !== userId) return res.status(403).json({ message: "Only the poll creator can end it" });
    const updated = await prisma.livePoll.update({ where: { id: pollId }, data: { status: "ended" } });
    const votes = await prisma.livePollVote.findMany({ where: { pollId }, select: { optionIndex: true } }), counts = countsForPoll(votes, (poll.options as string[]).length);
    await emitRoom(poll.liveSessionId, "live.poll.end", { pollId, counts, totalVotes: votes.length }, userId);
    return res.json({ success: true, poll: updated, counts, totalVotes: votes.length });
  });
}
