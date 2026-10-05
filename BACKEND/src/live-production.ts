import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";

type AuthRequest = Request & {
  userId?: number;
};

const staleAfterMs = 75_000;

const chatLimit = rateLimit({
  windowMs: 10_000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const presenceLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const reactionLimit = rateLimit({ windowMs: 5_000, limit: 4, standardHeaders: "draft-8", legacyHeaders: false });

async function broadcastLive(liveSessionId: number, event: Record<string, unknown>) {
  const url = process.env.LIVEKIT_URL?.trim();
  const key = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !key || !secret) return;
  try {
    const { RoomServiceClient } = await import("livekit-server-sdk");
    const service = new RoomServiceClient(url, key, secret);
    await service.sendData(`six20-live-${liveSessionId}`, Buffer.from(JSON.stringify(event)), 0);
  } catch (error) {
    console.error("LIVE data broadcast failed:", error);
  }
}

const cleanStale = (
  prisma: PrismaClient,
  liveSessionId: number
) =>
  prisma.liveViewer.deleteMany({
          where: {
            liveSessionId,
      lastSeenAt: {
        lt: new Date(Date.now() - staleAfterMs),
      },
    },
  });

export function registerLiveProductionRoutes(
  app: Express,
  prisma: PrismaClient,
  requireAuth: (
    req: Request,
    res: Response,
    next: any
  ) => unknown
) {

  // =========================================================
  // LIVEKIT TOKEN
  // Creates a secure LiveKit token for creators and viewers.
  // =========================================================

  app.post(
    "/api/live/:id/token",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const liveSessionId = Number(req.params.id);

        if (
          !Number.isSafeInteger(liveSessionId) ||
          liveSessionId < 1
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid live session id",
          });
        }

        if (!req.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        // -----------------------------------------------------
        // LiveKit environment configuration
        // -----------------------------------------------------

        const livekitUrl =
          process.env.LIVEKIT_URL?.trim();

        const livekitApiKey =
          process.env.LIVEKIT_API_KEY?.trim();

        const livekitApiSecret =
          process.env.LIVEKIT_API_SECRET?.trim();

        if (
          !livekitUrl ||
          !livekitApiKey ||
          !livekitApiSecret
        ) {
          return res.status(503).json({
            success: false,
            message: "LiveKit is not configured on the server",
          });
        }

        // -----------------------------------------------------
        // Find the LIVE session
        // -----------------------------------------------------

        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
            select: {
              id: true,
              creatorId: true,
              status: true,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message: "LIVE session not found",
          });
        }

        // Only active LIVE sessions can create LiveKit tokens.
        if (session.status !== "live") {
          return res.status(409).json({
            success: false,
            message: "This LIVE is not active",
          });
        }

        if (session.creatorId !== req.userId) {
          const blocked = await prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: req.userId! } } });
          if (blocked) return res.status(403).json({ message: "You are blocked from this LIVE" });
        }

        // -----------------------------------------------------
        // LiveKit SDK
        // -----------------------------------------------------

        const { AccessToken } =
          await import("livekit-server-sdk");

        // Creator can publish.
        // Viewer can only subscribe/watch.
        const isCreator =
          session.creatorId === req.userId;

        // Unique SIX20 room for this LIVE session.
        const roomName =
          `six20-live-${session.id}`;

        // Opaque identity.
        const identity =
          `user-${req.userId}`;

        // -----------------------------------------------------
        // Create access token
        // -----------------------------------------------------

        const accessToken = new AccessToken(
          livekitApiKey,
          livekitApiSecret,
          {
            identity,
            ttl: "2h",
          }
        );

        accessToken.addGrant({
          roomJoin: true,
          room: roomName,

          // Creator:
          // true
          //
          // Viewer:
          // false
          canPublish: isCreator,

          // Both creator and viewer can watch.
          canSubscribe: true,

          // All realtime events are published by the authenticated API.
          // Clients only subscribe, preventing forged gifts and reactions.
          canPublishData: false,
        });

        const token =
          await accessToken.toJwt();

        return res.json({
          success: true,
          serverUrl: livekitUrl,
          token,
          roomName,
          role: isCreator
            ? "creator"
            : "viewer",
        });

      } catch (error) {
        console.error(
          "LiveKit token creation failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to create LIVE connection token",
        });
      }
    }
  );

  // =========================================================
  // LIVE HEARTBEAT / VIEWER PRESENCE
  // =========================================================

  app.post(
    "/api/live/:id/heartbeat",
    presenceLimit,
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      const liveSessionId = Number(req.params.id);
      const userId = req.userId;

      if (
        !Number.isSafeInteger(liveSessionId) ||
        liveSessionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid live session id",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      try {
        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
            select: {
              status: true,
              creatorId: true,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message: "LIVE session not found",
          });
        }

        if (session.status !== "live") {
          return res.status(409).json({
            success: false,
            message: "This LIVE is not active",
          });
        }

        // Creator does not need to be counted as a viewer.
        if (session.creatorId !== userId) {
          await prisma.liveViewer.upsert({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId,
              },
            },
            update: {
              lastSeenAt: new Date(),
            },
            create: {
              liveSessionId,
              userId,
              lastSeenAt: new Date(),
            },
          });
        }

        await cleanStale(
          prisma,
          liveSessionId
        );

        const viewerCount =
          await prisma.liveViewer.count({
            where: {
              liveSessionId,
              lastSeenAt: {
                gte: new Date(
                  Date.now() - staleAfterMs
                ),
              },
            },
          });

        await prisma.liveSession.updateMany({
          where: {
            id: liveSessionId,
            status: "live",
          },
          data: {
            viewerCount,
          },
        });

        return res.json({
          success: true,
          viewerCount,
        });

      } catch (error) {
        console.error(
          "LIVE heartbeat failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to refresh LIVE presence",
        });
      }
    }
  );

  // =========================================================
  // LIVE CHAT - GET
  // =========================================================

  app.get(
    "/api/live/:id/chat",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        if (!Number.isSafeInteger(liveSessionId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid live session id",
          });
        }

        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
            select: {
              id: true,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        const messages =
          await prisma.liveChatMessage.findMany({
            where: {
              liveSessionId,
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 100,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          });

        return res.json({
          success: true,
          messages: messages.reverse(),
        });

      } catch (error) {
        console.error(
          "LIVE chat GET error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load live chat",
        });
      }
    }
  );

  // =========================================================
  // LIVE CHAT - POST
  // =========================================================

  app.post(
    "/api/live/:id/chat",
    chatLimit,
    requireAuth,
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const text =
          String(
            req.body?.text || ""
          ).trim();

        if (
          !Number.isSafeInteger(liveSessionId) ||
          liveSessionId < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid live session id",
          });
        }

        if (!req.userId) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        if (!text) {
          return res.status(400).json({
            success: false,
            message:
              "Message is required",
          });
        }

        if (text.length > 500) {
          return res.status(400).json({
            success: false,
            message:
              "Message is too long",
          });
        }

        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        if (session.status !== "live") {
          return res.status(409).json({
            success: false,
            message:
              "This LIVE is not active",
          });
        }

        const blocked = await prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: req.userId } } });
        if (blocked) return res.status(403).json({ message: "You are blocked from this LIVE" });
        const viewerState = await prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: req.userId } } });
        if (viewerState?.mutedUntil && viewerState.mutedUntil > new Date()) return res.status(403).json({ message: "You are muted in this LIVE" });
        if (session.slowModeSeconds > 0) {
          const latest = await prisma.liveChatMessage.findFirst({ where: { liveSessionId, userId: req.userId, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
          if (latest && Date.now() - latest.createdAt.getTime() < session.slowModeSeconds * 1000) return res.status(429).json({ message: `Slow mode: wait ${session.slowModeSeconds} seconds between messages` });
        }

        const message =
          await prisma.liveChatMessage.create({
            data: {
              liveSessionId,
              userId: req.userId,
              text,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          });

        await broadcastLive(liveSessionId, { type: "chat.message", message });

        return res.status(201).json({
          success: true,
          message,
        });

      } catch (error) {
        console.error(
          "LIVE chat POST error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send message",
        });
      }
    }
  );

  app.post("/api/live/:id/moderation/:action", requireAuth, async (req: AuthRequest, res: Response) => {
    const liveSessionId = Number(req.params.id), action = String(req.params.action), actorId = req.userId;
    if (!actorId) return res.sendStatus(401);
    const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { creatorId: true } });
    if (!session) return res.sendStatus(404);
    if (session.creatorId !== actorId) return res.status(403).json({ message: "Only the creator or an authorized moderator can moderate" });
    const targetUserId = Number(req.body?.userId), messageId = Number(req.body?.messageId);
    try {
      if (action === "delete-message" || action === "pin-message") {
        if (!Number.isSafeInteger(messageId) || messageId < 1) return res.status(400).json({ message: "Invalid message" });
        if (action === "delete-message") await prisma.liveChatMessage.updateMany({ where: { id: messageId, liveSessionId }, data: { deletedAt: new Date(), isPinned: false } });
        else {
          await prisma.liveChatMessage.updateMany({ where: { liveSessionId }, data: { isPinned: false } });
          await prisma.liveChatMessage.updateMany({ where: { id: messageId, liveSessionId, deletedAt: null }, data: { isPinned: true } });
        }
        await broadcastLive(liveSessionId, { type: "chat.moderation", action, messageId });
      } else if (action === "mute" || action === "remove" || action === "block") {
        if (!Number.isSafeInteger(targetUserId) || targetUserId < 1 || targetUserId === session.creatorId) return res.status(400).json({ message: "Invalid user" });
        if (action === "mute") await prisma.liveViewer.updateMany({ where: { liveSessionId, userId: targetUserId }, data: { mutedUntil: new Date(Date.now() + 10 * 60_000) } });
        if (action === "remove" || action === "block") {
          if (action === "block") await prisma.liveUserBlock.upsert({ where: { liveSessionId_userId: { liveSessionId, userId: targetUserId } }, update: {}, create: { liveSessionId, userId: targetUserId } });
          await prisma.liveViewer.deleteMany({ where: { liveSessionId, userId: targetUserId } });
          try {
            const { RoomServiceClient } = await import("livekit-server-sdk");
            const url = process.env.LIVEKIT_URL?.trim(), key = process.env.LIVEKIT_API_KEY?.trim(), secret = process.env.LIVEKIT_API_SECRET?.trim();
            if (url && key && secret) await new RoomServiceClient(url, key, secret).removeParticipant(`six20-live-${liveSessionId}`, `user-${targetUserId}`);
          } catch (e) { console.warn("Could not remove LIVE participant:", e); }
        }
        await broadcastLive(liveSessionId, { type: "chat.moderation", action, userId: targetUserId });
      } else if (action === "slow-mode") {
        const seconds = Number(req.body?.seconds);
        if (!Number.isInteger(seconds) || seconds < 0 || seconds > 60) return res.status(400).json({ message: "Slow mode must be 0 to 60 seconds" });
        await prisma.liveSession.update({ where: { id: liveSessionId }, data: { slowModeSeconds: seconds } });
      } else return res.status(404).json({ message: "Unknown moderation action" });
      return res.json({ success: true });
    } catch (error) { console.error("LIVE moderation failed:", error); return res.status(500).json({ message: "Moderation action failed" }); }
  });

  app.post("/api/live/:id/reactions", reactionLimit, requireAuth, async (req: AuthRequest, res: Response) => {
    const liveSessionId = Number(req.params.id);
    const userId = req.userId;
    const allowed = ["❤️", "👏", "🔥", "✨", "😂"];
    const emoji = String(req.body?.emoji || "");
    if (!userId) return res.sendStatus(401);
    if (!Number.isSafeInteger(liveSessionId) || liveSessionId < 1 || !allowed.includes(emoji)) return res.status(400).json({ message: "Invalid reaction" });
    const session = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { status: true, creatorId: true } });
    if (!session || session.status !== "live") return res.status(409).json({ message: "LIVE is not active" });
    if (session.creatorId !== userId) {
      const present = await prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId } } });
      if (!present || present.lastSeenAt < new Date(Date.now() - staleAfterMs)) return res.status(403).json({ message: "Join this LIVE to react" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await broadcastLive(liveSessionId, { type: "live.reaction", emoji, username: user?.username || "viewer", id: crypto.randomUUID() });
    return res.json({ success: true });
  });

  // =========================================================
  // LIVE GIFTS FEED
  // =========================================================

  app.get(
    "/api/live/:id/gifts",
    requireAuth,
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const sinceValue =
          typeof req.query.since === "string"
            ? new Date(req.query.since)
            : new Date(
                Date.now() - 30_000
              );

        if (
          !Number.isSafeInteger(
            liveSessionId
          ) ||
          liveSessionId < 1 ||
          Number.isNaN(
            sinceValue.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid LIVE gift feed request",
          });
        }

        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
            select: {
              id: true,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        const events =
          await prisma.giftTransaction.findMany({
            where: {
              liveSessionId,
              createdAt: {
                gt: sinceValue,
              },
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 50,
            include: {
              gift: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
              sender: {
                select: {
                  username: true,
                },
              },
              receiver: {
                select: {
                  username: true,
                },
              },
            },
          });

        return res.json({
          success: true,
          events: events.map(
            (event) => ({
              giftName:
                event.gift.name,

              giftIcon:
                event.gift.imageUrl,

              quantity:
                event.quantity,

              senderUsername:
                event.sender.username,

              creatorUsername:
                event.receiver.username,

              totalNaira:
                event.totalKobo / 100,

              creatorEarnNaira:
                event.creatorEarnKobo / 100,

              timestamp:
                event.createdAt,
            })
          ),
        });

      } catch (error) {
        console.error(
          "LIVE gift feed failed:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load LIVE gifts",
        });
      }
    }
  );

  // =========================================================
  // LIVE LIKE
  // =========================================================

  app.post(
    "/api/live/:id/like",
    requireAuth,
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        if (
          !Number.isSafeInteger(
            liveSessionId
          ) ||
          liveSessionId < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid live session id",
          });
        }

        const session =
          await prisma.liveSession.findUnique({
            where: {
              id: liveSessionId,
            },
            select: {
              id: true,
              status: true,
            },
          });

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        if (session.status !== "live") {
          return res.status(409).json({
            success: false,
            message:
              "This LIVE is not active",
          });
        }

        const updated =
          await prisma.liveSession.update({
            where: {
              id: liveSessionId,
            },
            data: {
              likes: {
                increment: 1,
              },
            },
          });

        return res.json({
          success: true,
          likes: updated.likes,
        });

      } catch (error) {
        console.error(
          "LIVE like error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to like LIVE",
        });
      }
    }
  );

  // =========================================================
  // STALE VIEWER CLEANUP
  // Runs every 30 seconds.
  // =========================================================

  const cleanupTimer =
    setInterval(async () => {
      try {
        const cutoff =
          new Date(
            Date.now() -
              staleAfterMs
          );

        // Remove viewers who stopped
        // sending heartbeats.
        await prisma.liveViewer.deleteMany({
          where: {
            lastSeenAt: {
              lt: cutoff,
            },
            liveSession: {
              status: "live",
            },
          },
        });

        // Refresh viewer counts for
        // all currently active LIVE sessions.
        const active =
          await prisma.liveSession.findMany({
            where: {
              status: "live",
            },
            select: {
              id: true,
            },
          });

        for (const session of active) {
          const viewerCount =
            await prisma.liveViewer.count({
              where: {
                liveSessionId:
                  session.id,
                lastSeenAt: {
                  gte: cutoff,
                },
              },
            });

          await prisma.liveSession.updateMany({
            where: {
              id: session.id,
              status: "live",
            },
            data: {
              viewerCount,
            },
          });
        }

      } catch (error) {
        console.error(
          "LIVE viewer cleanup failed:",
          error
        );
      }
    }, 30_000);

  cleanupTimer.unref();
}
