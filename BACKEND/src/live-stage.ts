import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { RoomServiceClient } from "livekit-server-sdk";
import { publishLiveEvent } from "./live-events";

type AuthRequest = Request & {
  userId?: number;
};

const MAX_GUESTS = 11;

const ACTIVE_STAGE_STATUSES = [
  "approved",
  "active",
] as const;

function getUserId(req: AuthRequest): number | null {
  return req.userId ?? null;
}

function isActiveStageStatus(
  value: string | null | undefined,
): boolean {
  return (
    value === "approved" ||
    value === "active"
  );
}

async function safePublishStageEvent(
  sessionId: number,
  type:
    | "live.stage.request"
    | "live.stage.update",
  payload: Record<string, unknown>,
  actorId: number | null,
) {
  try {
    return await publishLiveEvent(
      sessionId,
      type,
      payload,
      actorId,
    );
  } catch (error) {
    console.error(
      "SIX20 LIVE stage event delivery failed:",
      error,
    );

    return null;
  }
}

async function getLiveSession(
  prisma: PrismaClient,
  liveSessionId: number,
) {
  return prisma.liveSession.findUnique({
    where: {
      id: liveSessionId,
    },
    select: {
      id: true,
      creatorId: true,
      status: true,
    },
  });
}

export function registerLiveStageRoutes(
  app: Express,
  prisma: PrismaClient,
  requireAuth: (
    req: Request,
    res: Response,
    next: any,
  ) => unknown,
) {
  // =========================================================
  // GET MY STAGE STATUS
  // =========================================================

  app.get(
    "/api/live/:id/stage/me",
    requireAuth,
    async (
      req: AuthRequest,
      res: Response,
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const userId =
          getUserId(req);

        if (!userId) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        if (
          !Number.isSafeInteger(
            liveSessionId,
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
          await getLiveSession(
            prisma,
            liveSessionId,
          );

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        // Host
        if (
          session.creatorId === userId
        ) {
          return res.json({
            success: true,
            role: "host",
            status: "active",
            canPublish: true,
            canRequest: false,
          });
        }

        const viewer =
          await prisma.liveViewer.findUnique({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId,
              },
            },
            select: {
              stageRole: true,
              stageStatus: true,
            },
          });

        const role =
          viewer?.stageRole === "guest"
            ? "guest"
            : "audience";

        const status =
          viewer?.stageStatus ||
          "none";

        return res.json({
          success: true,
          role,
          status,
          canPublish:
            role === "guest" &&
            isActiveStageStatus(status),
          canRequest:
            role === "audience" &&
            status !== "requested",
        });
      } catch (error) {
        console.error(
          "SIX20 stage status failed:",
          error,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load stage status",
        });
      }
    },
  );

  // =========================================================
  // REQUEST TO JOIN STAGE
  // =========================================================

  app.post(
    "/api/live/:id/stage/request",
    requireAuth,
    async (
      req: AuthRequest,
      res: Response,
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const userId =
          getUserId(req);

        if (!userId) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        if (
          !Number.isSafeInteger(
            liveSessionId,
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
          await getLiveSession(
            prisma,
            liveSessionId,
          );

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

        if (
          session.creatorId === userId
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The host is already on stage",
          });
        }

        const block =
          await prisma.liveUserBlock.findUnique({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId,
              },
            },
          });

        if (
          block?.isBanned ||
          (
            block?.removedUntil &&
            block.removedUntil >
              new Date()
          )
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You cannot join this stage",
          });
        }

        const existing =
          await prisma.liveViewer.findUnique({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId,
              },
            },
          });

        if (
          existing?.stageRole ===
            "guest" &&
          isActiveStageStatus(
            existing.stageStatus,
          )
        ) {
          return res.json({
            success: true,
            role: "guest",
            status:
              existing.stageStatus,
          });
        }

        if (
          existing?.stageStatus ===
          "requested"
        ) {
          return res.json({
            success: true,
            role: "audience",
            status: "requested",
          });
        }

        const guestCount =
          await prisma.liveViewer.count({
            where: {
              liveSessionId,
              stageRole: "guest",
              stageStatus: {
                in: [
                  ...ACTIVE_STAGE_STATUSES,
                ],
              },
            },
          });

        if (
          guestCount >= MAX_GUESTS
        ) {
          return res.status(409).json({
            success: false,
            message:
              "All 11 guest stage slots are currently full",
          });
        }

        const viewer =
          await prisma.liveViewer.upsert({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId,
              },
            },
            update: {
              stageRole: "audience",
              stageStatus: "requested",
              lastSeenAt: new Date(),
            },
            create: {
              liveSessionId,
              userId,
              stageRole: "audience",
              stageStatus: "requested",
              lastSeenAt: new Date(),
            },
            select: {
              stageRole: true,
              stageStatus: true,
            },
          });

        await safePublishStageEvent(
          liveSessionId,
          "live.stage.request",
          {
            userId,
            status: "requested",
          },
          userId,
        );

        return res.status(201).json({
          success: true,
          role:
            viewer.stageRole,
          status:
            viewer.stageStatus,
        });
      } catch (error) {
        console.error(
          "SIX20 stage request failed:",
          error,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to request stage access",
        });
      }
    },
  );

  // =========================================================
  // HOST: GET PENDING REQUESTS
  // =========================================================

  app.get(
    "/api/live/:id/stage/requests",
    requireAuth,
    async (
      req: AuthRequest,
      res: Response,
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const userId =
          getUserId(req);

        if (!userId) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        const session =
          await getLiveSession(
            prisma,
            liveSessionId,
          );

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        if (
          session.creatorId !== userId
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Only the host can manage stage requests",
          });
        }

        const requests =
          await prisma.liveViewer.findMany({
            where: {
              liveSessionId,
              stageStatus: "requested",
            },
            orderBy: {
              joinedAt: "asc",
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

        return res.json({
          success: true,
          requests,
        });
      } catch (error) {
        console.error(
          "SIX20 stage requests failed:",
          error,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load stage requests",
        });
      }
    },
  );

  // =========================================================
  // GET CURRENT STAGE PARTICIPANTS
  // =========================================================

  app.get(
    "/api/live/:id/stage/participants",
    requireAuth,
    async (
      req: AuthRequest,
      res: Response,
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        if (!getUserId(req)) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        const session =
          await getLiveSession(
            prisma,
            liveSessionId,
          );

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        const guests =
          await prisma.liveViewer.findMany({
            where: {
              liveSessionId,
              stageRole: "guest",
              stageStatus: {
                in: [
                  ...ACTIVE_STAGE_STATUSES,
                ],
              },
            },
            orderBy: {
              joinedAt: "asc",
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

        return res.json({
          success: true,
          host: {
            userId:
              session.creatorId,
          },
          guests,
          maxGuests: MAX_GUESTS,
        });
      } catch (error) {
        console.error(
          "SIX20 stage participants failed:",
          error,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load stage participants",
        });
      }
    },
  );

  // =========================================================
  // HOST: APPROVE / REJECT / REMOVE
  // =========================================================

  app.post(
    "/api/live/:id/stage/:action",
    requireAuth,
    async (
      req: AuthRequest,
      res: Response,
    ) => {
      try {
        const liveSessionId =
          Number(req.params.id);

        const action =
          String(req.params.action);

        const userId =
          getUserId(req);

        if (!userId) {
          return res.status(401).json({
            success: false,
            message:
              "Authentication required",
          });
        }

        if (
          ![
            "approve",
            "reject",
            "remove",
          ].includes(action)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid stage action",
          });
        }

        const session =
          await getLiveSession(
            prisma,
            liveSessionId,
          );

        if (!session) {
          return res.status(404).json({
            success: false,
            message:
              "LIVE session not found",
          });
        }

        if (
          session.creatorId !== userId
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Only the host can manage the stage",
          });
        }

        const targetUserId =
          Number(req.body?.userId);

        if (
          !Number.isSafeInteger(
            targetUserId,
          ) ||
          targetUserId < 1 ||
          targetUserId ===
            session.creatorId
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid stage participant",
          });
        }

        const target =
          await prisma.liveViewer.findUnique({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId:
                  targetUserId,
              },
            },
          });

        if (!target) {
          return res.status(404).json({
            success: false,
            message:
              "Stage participant not found",
          });
        }

        // ------------------------------
        // APPROVE
        // ------------------------------

        if (action === "approve") {
          const guestCount =
            await prisma.liveViewer.count({
              where: {
                liveSessionId,
                stageRole: "guest",
                stageStatus: {
                  in: [
                    ...ACTIVE_STAGE_STATUSES,
                  ],
                },
              },
            });

          if (
            guestCount >= MAX_GUESTS
          ) {
            return res.status(409).json({
              success: false,
              message:
                "All 11 guest stage slots are full",
            });
          }

          await prisma.liveViewer.update({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId:
                  targetUserId,
              },
            },
            data: {
              stageRole: "guest",
              stageStatus: "approved",
              lastSeenAt: new Date(),
            },
          });
        }

        // ------------------------------
        // REJECT
        // ------------------------------

        if (action === "reject") {
          await prisma.liveViewer.update({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId:
                  targetUserId,
              },
            },
            data: {
              stageRole: "audience",
              stageStatus: "none",
            },
          });
        }

        // ------------------------------
        // REMOVE
        // ------------------------------

        if (action === "remove") {
          await prisma.liveViewer.update({
            where: {
              liveSessionId_userId: {
                liveSessionId,
                userId:
                  targetUserId,
              },
            },
            data: {
              stageRole: "audience",
              stageStatus: "none",
            },
          });

          const livekitUrl =
            process.env.LIVEKIT_URL?.trim();

          const livekitApiKey =
            process.env.LIVEKIT_API_KEY?.trim();

          const livekitApiSecret =
            process.env.LIVEKIT_API_SECRET?.trim();

          if (
            livekitUrl &&
            livekitApiKey &&
            livekitApiSecret
          ) {
            try {
              const roomService =
                new RoomServiceClient(
                  livekitUrl,
                  livekitApiKey,
                  livekitApiSecret,
                );

              await roomService.removeParticipant(
                `six20-live-${liveSessionId}`,
                `user-${targetUserId}`,
              );
            } catch (error) {
              console.error(
                "SIX20 LiveKit participant removal failed:",
                error,
              );
            }
          }
        }

        await safePublishStageEvent(
          liveSessionId,
          "live.stage.update",
          {
            action,
            userId:
              targetUserId,
          },
          userId,
        );

        return res.json({
          success: true,
          action,
          userId:
            targetUserId,
        });
      } catch (error) {
        console.error(
          "SIX20 stage action failed:",
          error,
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update stage",
        });
      }
    },
  );
}