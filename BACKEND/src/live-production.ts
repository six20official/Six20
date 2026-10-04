import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";

type AuthRequest = Request & { userId?: number };
const staleAfterMs = 75_000;
const chatLimit = rateLimit({ windowMs: 10_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const presenceLimit = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });
const cleanStale = (prisma: PrismaClient, liveSessionId: number) => prisma.liveViewer.deleteMany({ where: { liveSessionId, lastSeenAt: { lt: new Date(Date.now() - staleAfterMs) } } });

export function registerLiveProductionRoutes(
  app: Express,
  prisma: PrismaClient,
  requireAuth: (req: Request, res: Response, next: any) => unknown
) {
  app.post("/api/live/:id/heartbeat", presenceLimit, requireAuth, async (req: AuthRequest, res) => {
    const liveSessionId = Number(req.params.id), userId = req.userId;
    if (!Number.isSafeInteger(liveSessionId) || liveSessionId < 1) return res.status(400).json({ success: false, message: "Invalid live session id" });
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });
    try {
      const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { status: true, creatorId: true } });
      if (!session) return res.status(404).json({ success: false, message: "LIVE session not found" });
      if (session.status !== "live") return res.status(409).json({ success: false, message: "This LIVE is not active" });
      if (session.creatorId !== userId) await prisma.liveViewer.upsert({ where: { liveSessionId_userId: { liveSessionId, userId } }, update: { lastSeenAt: new Date() }, create: { liveSessionId, userId, lastSeenAt: new Date() } });
      await cleanStale(prisma, liveSessionId);
      const viewerCount = await prisma.liveViewer.count({ where: { liveSessionId, lastSeenAt: { gte: new Date(Date.now() - staleAfterMs) } } });
      await prisma.liveSession.updateMany({ where: { id: liveSessionId, status: "live" }, data: { viewerCount } });
      return res.json({ success: true, viewerCount });
    } catch (error) { console.error("LIVE heartbeat failed", error); return res.status(500).json({ success: false, message: "Unable to refresh LIVE presence" }); }
  });

  app.get("/api/live/:id/chat", requireAuth, async (req, res) => {
    try {
      const liveSessionId = Number(req.params.id);
      if (!Number.isInteger(liveSessionId)) {
        return res.status(400).json({ success: false, message: "Invalid live session id" });
      }

      const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { id: true } });
      if (!session) return res.status(404).json({ success: false, message: "LIVE session not found" });
      const messages = await prisma.liveChatMessage.findMany({
        where: { liveSessionId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      return res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
      console.error("LIVE chat GET error:", error);
      return res.status(500).json({ success: false, message: "Unable to load live chat" });
    }
  });

  app.post("/api/live/:id/chat", chatLimit, requireAuth, async (req: AuthRequest, res) => {
    try {
      const liveSessionId = Number(req.params.id);
      const text = String(req.body?.text || "").trim();

      if (!Number.isSafeInteger(liveSessionId) || liveSessionId < 1) {
        return res.status(400).json({ success: false, message: "Invalid live session id" });
      }

      if (!req.userId) return res.status(401).json({ success: false, message: "Authentication required" });
      if (!text) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }

      if (text.length > 500) {
        return res.status(400).json({ success: false, message: "Message is too long" });
      }

      const session = await prisma.liveSession.findUnique({
        where: { id: liveSessionId }
      });

      if (!session) {
        return res.status(404).json({ success: false, message: "LIVE session not found" });
      }

      if (session.status !== "live") {
        return res.status(409).json({ success: false, message: "This LIVE is not active" });
      }

      const message = await prisma.liveChatMessage.create({
        data: {
          liveSessionId,
          userId: req.userId,
          text
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      return res.status(201).json({ success: true, message });
    } catch (error) {
      console.error("LIVE chat POST error:", error);
      return res.status(500).json({ success: false, message: "Unable to send message" });
    }
  });

  app.get("/api/live/:id/gifts", requireAuth, async (req, res) => {
    try {
      const liveSessionId = Number(req.params.id);
      const sinceValue = typeof req.query.since === "string" ? new Date(req.query.since) : new Date(Date.now() - 30_000);
      if (!Number.isSafeInteger(liveSessionId) || liveSessionId < 1 || Number.isNaN(sinceValue.getTime())) return res.status(400).json({ success: false, message: "Invalid LIVE gift feed request" });
      const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { id: true } });
      if (!session) return res.status(404).json({ success: false, message: "LIVE session not found" });
      const events = await prisma.giftTransaction.findMany({ where: { liveSessionId, createdAt: { gt: sinceValue } }, orderBy: { createdAt: "asc" }, take: 50, include: { gift: { select: { name: true, imageUrl: true } }, sender: { select: { username: true } }, receiver: { select: { username: true } } } });
      return res.json({ success: true, events: events.map(event => ({ giftName: event.gift.name, giftIcon: event.gift.imageUrl, quantity: event.quantity, senderUsername: event.sender.username, creatorUsername: event.receiver.username, totalNaira: event.totalKobo / 100, creatorEarnNaira: event.creatorEarnKobo / 100, timestamp: event.createdAt })) });
    } catch (error) { console.error("LIVE gift feed failed", error); return res.status(500).json({ success: false, message: "Unable to load LIVE gifts" }); }
  });

  app.post("/api/live/:id/like", requireAuth, async (req, res) => {
    try {
      const liveSessionId = Number(req.params.id);

      const session = await prisma.liveSession.findUnique({
        where: { id: liveSessionId }
      });

      if (!session) {
        return res.status(404).json({ success: false, message: "LIVE session not found" });
      }

      const updated = await prisma.liveSession.update({
        where: { id: liveSessionId },
        data: { likes: { increment: 1 } }
      });

      return res.json({ success: true, likes: updated.likes });
    } catch (error) {
      console.error("LIVE like error:", error);
      return res.status(500).json({ success: false, message: "Unable to like LIVE" });
    }
  });

  const cleanupTimer = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - staleAfterMs);
      await prisma.liveViewer.deleteMany({ where: { lastSeenAt: { lt: cutoff }, liveSession: { status: "live" } } });
      const active = await prisma.liveSession.findMany({ where: { status: "live" }, select: { id: true } });
      for (const session of active) {
        const viewerCount = await prisma.liveViewer.count({ where: { liveSessionId: session.id, lastSeenAt: { gte: cutoff } } });
        await prisma.liveSession.updateMany({ where: { id: session.id, status: "live" }, data: { viewerCount } });
      }
    } catch (error) { console.error("LIVE viewer cleanup failed", error); }
  }, 30_000);
  cleanupTimer.unref();
}
