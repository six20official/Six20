import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

type AuthRequest = Request & { user?: { id: number } };

export function registerLiveProductionRoutes(
  app: Express,
  prisma: PrismaClient,
  requireAuth: (req: Request, res: Response, next: () => void) => void
) {
  app.get("/api/live/:id/chat", async (req, res) => {
    try {
      const liveSessionId = Number(req.params.id);
      if (!Number.isInteger(liveSessionId)) {
        return res.status(400).json({ success: false, message: "Invalid live session id" });
      }

      const messages = await prisma.liveChatMessage.findMany({
        where: { liveSessionId },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      return res.json({ success: true, messages });
    } catch (error) {
      console.error("LIVE chat GET error:", error);
      return res.status(500).json({ success: false, message: "Unable to load live chat" });
    }
  });

  app.post("/api/live/:id/chat", requireAuth, async (req: AuthRequest, res) => {
    try {
      const liveSessionId = Number(req.params.id);
      const text = String(req.body?.text || "").trim();

      if (!Number.isInteger(liveSessionId)) {
        return res.status(400).json({ success: false, message: "Invalid live session id" });
      }

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

      if (session.status === "ENDED") {
        return res.status(400).json({ success: false, message: "This LIVE has ended" });
      }

      const message = await prisma.liveChatMessage.create({
        data: {
          liveSessionId,
          userId: req.user!.id,
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
}
