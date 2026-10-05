import { AccessToken } from "livekit-server-sdk";
import type { Express, Request, Response, NextFunction } from "express";
import type { PrismaClient } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  userId?: number;
}

export function registerLiveKitRoutes(
  app: Express,
  prisma: PrismaClient,
  requireAuth: (
    req: AuthenticatedRequest,
    res: Response,
    next: () => void
  ) => void,
) {
  app.post(
    "/api/live/:id/livekit-token",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const liveSessionId = Number(req.params.id);
        const userId = req.userId;

        if (!Number.isInteger(liveSessionId) || liveSessionId <= 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid live session ID",
          });
        }

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required",
          });
        }

        const liveSession = await prisma.liveSession.findUnique({
          where: {
            id: liveSessionId,
          },
          include: {
            creator: true,
          },
        });

        if (!liveSession) {
          return res.status(404).json({
            success: false,
            error: "Live session not found",
          });
        }

        if (liveSession.status !== "LIVE") {
          return res.status(409).json({
            success: false,
            error: "This live session is not currently live",
          });
        }

        const livekitUrl = process.env.LIVEKIT_URL?.trim();
        const apiKey = process.env.LIVEKIT_API_KEY?.trim();
        const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

        if (!livekitUrl || !apiKey || !apiSecret) {
          return res.status(500).json({
            success: false,
            error: "LiveKit is not configured",
          });
        }

        const isHost = liveSession.creatorId === userId;

        const roomName = `six20-live-${liveSession.id}`;

        const identity = `user-${userId}`;

        const token = new AccessToken(
          apiKey,
          apiSecret,
          {
            identity,
            name: liveSession.creator.displayName,
            ttl: "2h",
          }
        );

        token.addGrant({
          roomJoin: true,
          room: roomName,
          canSubscribe: true,
          canPublish: isHost,
          canPublishData: true,
        });

        const jwt = await token.toJwt();

        return res.json({
          success: true,
          token: jwt,
          url: livekitUrl,
          roomName,
          role: isHost ? "host" : "viewer",
        });
      } catch (error) {
        console.error("LiveKit token error:", error);

        return res.status(500).json({
          success: false,
          error: "Unable to create LiveKit token",
        });
      }
    },
  );
}