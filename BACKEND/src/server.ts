import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { registerLiveProductionRoutes } from "./live-production";
import { registerWalletRoutes } from "./wallet-routes";

// ======================================================
// SIX20 BACKEND
// ======================================================

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured and at least 32 characters long.");
  return secret;
})();

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "./uploads"
);

// ======================================================
// UPLOAD DIRECTORY
// ======================================================

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buffer) => { (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer); },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(
  "/uploads",
  express.static(uploadDir)
);

// ======================================================
// RATE LIMITING
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again later.",
  },
});

const giftLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many gift requests. Please slow down.",
  },
});

const financialLimiter = rateLimit({ windowMs: 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });

// ======================================================
// MULTER
// ======================================================

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    callback
  ) => {
    callback(null, uploadDir);
  },

  filename: (
    _req,
    file,
    callback
  ) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `${Date.now()}-${Math.round(
        Math.random() * 1000000
      )}${extension}`;

    callback(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize:
      100 * 1024 * 1024,
  },
});

// ======================================================
// AUTH TYPES
// ======================================================

interface AuthenticatedRequest
  extends Request {
  userId?: number;
}

// ======================================================
// JWT
// ======================================================

function createToken(
  userId: number
): string {
  return jwt.sign(
    {
      userId,
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        error:
          "Authorization token required",
      });
    }

    const parts =
      authorization.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        error:
          "Invalid authorization format",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
      return res.status(401).json({ success: false, error: "Invalid token payload" });
    }

    req.userId =
      Number(decoded.userId);

    if (
      !Number.isInteger(
        req.userId
      )
    ) {
      return res.status(401).json({
        success: false,
        error:
          "Invalid user ID",
      });
    }

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error:
        "Invalid or expired token",
    });
  }
}

registerWalletRoutes(app, prisma, requireAuth);

async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        isAdmin: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User account not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Account is blocked",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Administrator access required",
      });
    }

    return next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to verify administrator access",
    });
  }
}

// ======================================================
// ROOT
// ======================================================

app.get(
  "/",
  (
    _req: Request,
    res: Response
  ) => {
    return res.json({
      success: true,
      service: "SIX20 Backend",
      message:
        "SIX20 API is running",
      version: "1.0.0",

      endpoints: {
        health:
          "/api/health",
        register:
          "/api/auth/register",
        login:
          "/api/auth/login",
        me:
          "/api/auth/me",
        upload:
          "/api/upload",
        users:
          "/api/users/:id",
        videos:
          "/api/videos",
        live:
          "/api/live",
        gifts:
          "/api/gifts",
        wallet:
          "/api/wallet",
      },
    });
  }
);

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;

      return res.json({
        success: true,
        service: "SIX20 API",
        status: "online",
        database: "connected",
        time:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "HEALTH DATABASE ERROR:",
        error
      );

      return res.status(503).json({
        success: false,
        service: "SIX20 API",
        status: "online",
        database:
          "disconnected",
        time:
          new Date().toISOString(),
      });
    }
  }
);

// ======================================================
// REGISTER
// ======================================================

app.post(
  "/api/auth/register",
  authLimiter,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        username,
        email,
        password,
        displayName,
      } = req.body;

      if (
        !username ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          error:
            "username, email and password are required",
        });
      }

      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Password must be at least 6 characters",
        });
      }

      const cleanUsername =
        String(username).trim();

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      const cleanDisplayName =
        String(
          displayName ||
          cleanUsername
        ).trim();

      const existingUser =
        await prisma.user.findFirst({
          where: {
            OR: [
              {
                username:
                  cleanUsername,
              },
              {
                email:
                  cleanEmail,
              },
            ],
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error:
            "Username or email already exists",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          String(password),
          12
        );

      const user =
        await prisma.user.create({
          data: {
            username:
              cleanUsername,
            email:
              cleanEmail,
            passwordHash,
            displayName:
              cleanDisplayName,
          },
        });

      return res.status(201).json({
        success: true,

        token:
          createToken(user.id),

        user: {
          id: user.id,
          username:
            user.username,
          email:
            user.email,
          displayName:
            user.displayName,
          avatarUrl:
            user.avatarUrl,
        },
      });
    } catch (error: any) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      if (
        error?.code === "P2002"
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Username or email already exists",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          "Registration failed",
      });
    }
  }
);

// ======================================================
// LOGIN
// ======================================================

app.post(
  "/api/auth/login",
  authLimiter,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
        username,
        password,
      } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error:
            "Password is required",
        });
      }

      const identifier =
        String(
          email ||
          username ||
          ""
        )
          .trim()
          .toLowerCase();

      if (!identifier) {
        return res.status(400).json({
          success: false,
          error:
            "Email or username is required",
        });
      }

      const user =
        await prisma.user.findFirst({
          where: {
            OR: [
              {
                email:
                  identifier,
              },
              {
                username:
                  identifier,
              },
            ],
          },
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid email, username or password",
        });
      }

      const passwordCorrect =
        await bcrypt.compare(
          String(password),
          user.passwordHash
        );

      if (!passwordCorrect) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid email, username or password",
        });
      }

      return res.json({
        success: true,

        token:
          createToken(user.id),

        user: {
          id: user.id,
          username:
            user.username,
          email:
            user.email,
          displayName:
            user.displayName,
          avatarUrl:
            user.avatarUrl,
        },
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Login failed",
      });
    }
  }
);

// ======================================================
// CURRENT USER
// ======================================================

app.get(
  "/api/auth/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.userId!,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            "User not found",
        });
      }

      return res.json({
        success: true,

        user: {
          id: user.id,
          username:
            user.username,
          email:
            user.email,
          displayName:
            user.displayName,
          avatarUrl:
            user.avatarUrl,
        },
      });
    } catch (error) {
      console.error(
        "AUTH ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load user",
      });
    }
  }
);

// ======================================================
// UPLOAD
// ======================================================

app.post(
  "/api/upload",
  requireAuth,
  upload.single("file"),
  (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error:
            "No file uploaded",
        });
      }

      const fileUrl =
        `/uploads/${req.file.filename}`;

      return res.status(201).json({
        success: true,

        file: {
          filename:
            req.file.filename,
          originalName:
            req.file.originalname,
          mimetype:
            req.file.mimetype,
          size:
            req.file.size,
          url:
            fileUrl,
        },
      });
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Upload failed",
      });
    }
  }
);

// ======================================================
// GET USER
// ======================================================

app.get(
  "/api/users/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        Number(req.params.id);

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid user ID",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,

            _count: {
              select: {
                videos: true,
                followers: true,
                following: true,
              },
            },
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            "User not found",
        });
      }

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "GET USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load user",
      });
    }
  }
);

// ======================================================
// UPDATE PROFILE
// ======================================================

app.put(
  "/api/users/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const {
        displayName,
        avatarUrl,
      } = req.body;

      const user =
        await prisma.user.update({
          where: {
            id:
              req.userId!,
          },

          data: {
            ...(displayName !==
            undefined
              ? {
                  displayName:
                    String(
                      displayName
                    ).trim(),
                }
              : {}),

            ...(avatarUrl !==
            undefined
              ? {
                  avatarUrl:
                    String(
                      avatarUrl
                    ).trim(),
                }
              : {}),
          },

          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        });

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Profile update failed",
      });
    }
  }
);

// ======================================================
// CREATE VIDEO
// ======================================================

app.post(
  "/api/videos",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const {
        videoUrl,
        caption,
        soundTitle,
        isPublic,
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error:
            "videoUrl is required",
        });
      }

      const video =
        await prisma.video.create({
          data: {
            userId:
              req.userId!,

            videoUrl:
              String(videoUrl),

            caption:
              caption !== undefined
                ? String(caption)
                : undefined,

            soundTitle:
              soundTitle !== undefined
                ? String(soundTitle)
                : undefined,

            isPublic:
              isPublic === undefined
                ? true
                : Boolean(isPublic),
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

      return res.status(201).json({
        success: true,
        video,
      });
    } catch (error) {
      console.error(
        "CREATE VIDEO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not create video",
      });
    }
  }
);

// ======================================================
// GET VIDEOS
// ======================================================

app.get(
  "/api/videos",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 20,
            1
          ),
          100
        );

      const videos =
        await prisma.video.findMany({
          where: {
            isPublic: true,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          take: limit,

          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },

            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        });

      return res.json({
        success: true,
        count:
          videos.length,
        videos,
      });
    } catch (error) {
      console.error(
        "GET VIDEOS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load videos",
      });
    }
  }
);

// ======================================================
// GET SINGLE VIDEO
// ======================================================

app.get(
  "/api/videos/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const videoId =
        Number(req.params.id);

      if (!Number.isInteger(videoId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid video ID",
        });
      }

      const video =
        await prisma.video.findUnique({
          where: {
            id: videoId,
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

            likes: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },

              take: 50,
            },

            comments: {
              orderBy: {
                createdAt:
                  "desc",
              },

              take: 50,

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
            },
          },
        });

      if (!video) {
        return res.status(404).json({
          success: false,
          error:
            "Video not found",
        });
      }

      await prisma.video.update({
        where: {
          id: videoId,
        },

        data: {
          views: {
            increment: 1,
          },
        },
      });

      return res.json({
        success: true,
        video,
      });
    } catch (error) {
      console.error(
        "GET VIDEO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load video",
      });
    }
  }
);

// ======================================================
// LIKE VIDEO
// ======================================================

app.post(
  "/api/videos/:id/like",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const videoId =
        Number(req.params.id);

      if (!Number.isInteger(videoId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid video ID",
        });
      }

      const video =
        await prisma.video.findUnique({
          where: {
            id: videoId,
          },
        });

      if (!video) {
        return res.status(404).json({
          success: false,
          error:
            "Video not found",
        });
      }

      const existingLike =
        await prisma.like.findUnique({
          where: {
            videoId_userId: {
              videoId,
              userId:
                req.userId!,
            },
          },
        });

      if (existingLike) {
        await prisma.like.delete({
          where: {
            id:
              existingLike.id,
          },
        });

        return res.json({
          success: true,
          liked: false,
          message:
            "Video unliked",
        });
      }

      await prisma.like.create({
        data: {
          videoId,
          userId:
            req.userId!,
        },
      });

      if (
        video.userId !==
        req.userId!
      ) {
        await prisma.notification.create({
          data: {
            userId:
              video.userId,
            type:
              "like",
            title:
              "New Like",
            message:
              "Someone liked your video",
          },
        });
      }

      return res.json({
        success: true,
        liked: true,
        message:
          "Video liked",
      });
    } catch (error) {
      console.error(
        "LIKE VIDEO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not like video",
      });
    }
  }
);

// ======================================================
// ADD COMMENT
// ======================================================

app.post(
  "/api/videos/:id/comments",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const videoId =
        Number(req.params.id);

      const text =
        String(
          req.body.text || ""
        ).trim();

      if (!Number.isInteger(videoId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid video ID",
        });
      }

      if (!text) {
        return res.status(400).json({
          success: false,
          error:
            "Comment cannot be empty",
        });
      }

      const video =
        await prisma.video.findUnique({
          where: {
            id: videoId,
          },
        });

      if (!video) {
        return res.status(404).json({
          success: false,
          error:
            "Video not found",
        });
      }

      const comment =
        await prisma.comment.create({
          data: {
            videoId,
            userId:
              req.userId!,
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

      if (
        video.userId !==
        req.userId!
      ) {
        await prisma.notification.create({
          data: {
            userId:
              video.userId,
            type:
              "comment",
            title:
              "New Comment",
            message:
              "Someone commented on your video",
          },
        });
      }

      return res.status(201).json({
        success: true,
        comment,
      });
    } catch (error) {
      console.error(
        "COMMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not add comment",
      });
    }
  }
);

// ======================================================
// GET VIDEO COMMENTS
// ======================================================

app.get(
  "/api/videos/:id/comments",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const videoId =
        Number(req.params.id);

      if (!Number.isInteger(videoId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid video ID",
        });
      }

      const comments =
        await prisma.comment.findMany({
          where: {
            videoId,
          },

          orderBy: {
            createdAt:
              "desc",
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
        comments,
      });
    } catch (error) {
      console.error(
        "GET COMMENTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load comments",
      });
    }
  }
);

// ======================================================
// FOLLOW / UNFOLLOW
// ======================================================

app.post(
  "/api/users/:id/follow",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const followingId =
        Number(req.params.id);

      const followerId =
        req.userId!;

      if (
        !Number.isInteger(
          followingId
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid user ID",
        });
      }

      if (
        followingId ===
        followerId
      ) {
        return res.status(400).json({
          success: false,
          error:
            "You cannot follow yourself",
        });
      }

      const target =
        await prisma.user.findUnique({
          where: {
            id:
              followingId,
          },
        });

      if (!target) {
        return res.status(404).json({
          success: false,
          error:
            "User not found",
        });
      }

      const existing =
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        });

      if (existing) {
        await prisma.follow.delete({
          where: {
            id:
              existing.id,
          },
        });

        return res.json({
          success: true,
          following: false,
        });
      }

      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      await prisma.notification.create({
        data: {
          userId:
            followingId,
          type:
            "follow",
          title:
            "New Follower",
          message:
            "Someone started following you",
        },
      });

      return res.json({
        success: true,
        following: true,
      });
    } catch (error) {
      console.error(
        "FOLLOW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Follow operation failed",
      });
    }
  }
);

// ======================================================
// FOLLOWERS
// ======================================================

app.get(
  "/api/users/:id/followers",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        Number(req.params.id);

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid user ID",
        });
      }

      const followers =
        await prisma.follow.findMany({
          where: {
            followingId:
              userId,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          include: {
            follower: {
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
        followers,
      });
    } catch (error) {
      console.error(
        "GET FOLLOWERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load followers",
      });
    }
  }
);

// ======================================================
// FOLLOWING
// ======================================================

app.get(
  "/api/users/:id/following",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        Number(req.params.id);

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid user ID",
        });
      }

      const following =
        await prisma.follow.findMany({
          where: {
            followerId:
              userId,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          include: {
            following: {
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
        following,
      });
    } catch (error) {
      console.error(
        "GET FOLLOWING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load following",
      });
    }
  }
);

// ======================================================
// NOTIFICATIONS
// ======================================================

app.get(
  "/api/notifications",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const notifications =
        await prisma.notification.findMany({
          where: {
            userId:
              req.userId!,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          take: 100,
        });

      return res.json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error(
        "NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not load notifications",
      });
    }
  }
);

// ======================================================
// MARK NOTIFICATIONS READ
// ======================================================

app.patch(
  "/api/notifications/read",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId:
            req.userId!,
          isRead: false,
        },

        data: {
          isRead: true,
        },
      });

      return res.json({
        success: true,
        message:
          "Notifications marked as read",
      });
    } catch (error) {
      console.error(
        "MARK NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Could not update notifications",
      });
    }
  }
);

// ======================================================
// LIVE STREAMING
// ======================================================

// ------------------------------------------------------
// CREATE LIVE
// ------------------------------------------------------

app.post(
  "/api/live",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const {
        title,
        description,
      } = req.body;

      if (
        !title ||
        typeof title !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Live title is required",
        });
      }

      const live =
        await prisma.liveSession.create({
          data: {
            creatorId:
              userId,

            title:
              title.trim(),

            description:
              typeof description ===
              "string"
                ? description.trim()
                : null,

            status:
              "scheduled",
          },

          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });

      return res.status(201).json({
        success: true,
        live,
      });
    } catch (error) {
      console.error(
        "CREATE LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create livestream",
      });
    }
  }
);

// ------------------------------------------------------
// GET ACTIVE LIVES
// ------------------------------------------------------

app.get(
  "/api/live",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const lives =
        await prisma.liveSession.findMany({
          where: {
            status:
              "live",
          },

          orderBy: {
            startedAt:
              "desc",
          },

          include: {
            creator: {
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
        lives,
      });
    } catch (error) {
      console.error(
        "GET LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch livestreams",
      });
    }
  }
);

// ------------------------------------------------------
// GET SINGLE LIVE
// ------------------------------------------------------

app.get(
  "/api/live/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const liveId =
        Number(req.params.id);

      if (!Number.isInteger(liveId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid live session ID",
        });
      }

      const live =
        await prisma.liveSession.findUnique({
          where: {
            id:
              liveId,
          },

          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },

            viewers: {
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

              orderBy: {
                joinedAt:
                  "desc",
              },

              take: 50,
            },
          },
        });

      if (!live) {
        return res.status(404).json({
          success: false,
          message:
            "Livestream not found",
        });
      }

      return res.json({
        success: true,
        live,
      });
    } catch (error) {
      console.error(
        "GET SINGLE LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch livestream",
      });
    }
  }
);

// ------------------------------------------------------
// START LIVE
// ------------------------------------------------------

app.post(
  "/api/live/:id/start",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      const liveId =
        Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (!Number.isInteger(liveId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid live session ID",
        });
      }

      const existing =
        await prisma.liveSession.findUnique({
          where: {
            id:
              liveId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Livestream not found",
        });
      }

      if (
        existing.creatorId !==
        userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the creator can start this livestream",
        });
      }

      if (
        existing.status ===
        "live"
      ) {
        return res.json({
          success: true,
          message:
            "Livestream is already live",
          live:
            existing,
        });
      }

      const live =
        await prisma.liveSession.update({
          where: {
            id:
              liveId,
          },

          data: {
            status:
              "live",
            startedAt:
              new Date(),
            endedAt:
              null,
          },
        });

      return res.json({
        success: true,
        live,
      });
    } catch (error) {
      console.error(
        "START LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to start livestream",
      });
    }
  }
);

// ------------------------------------------------------
// END LIVE
// ------------------------------------------------------

app.post(
  "/api/live/:id/end",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      const liveId =
        Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (!Number.isInteger(liveId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid live session ID",
        });
      }

      const existing =
        await prisma.liveSession.findUnique({
          where: {
            id:
              liveId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Livestream not found",
        });
      }

      if (
        existing.creatorId !==
        userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the creator can end this livestream",
        });
      }

      const live =
        await prisma.liveSession.update({
          where: {
            id:
              liveId,
          },

          data: {
            status:
              "ended",

            endedAt:
              new Date(),

            viewerCount:
              0,
          },
        });

      return res.json({
        success: true,
        live,
      });
    } catch (error) {
      console.error(
        "END LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to end livestream",
      });
    }
  }
);

// ------------------------------------------------------
// JOIN LIVE
// ------------------------------------------------------

app.post(
  "/api/live/:id/join",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      const liveId =
        Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (!Number.isInteger(liveId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid live session ID",
        });
      }

      const live =
        await prisma.liveSession.findUnique({
          where: {
            id:
              liveId,
          },
        });

      if (!live) {
        return res.status(404).json({
          success: false,
          message:
            "Livestream not found",
        });
      }

      if (
        live.status !==
        "live"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This livestream is not currently live",
        });
      }

      await prisma.liveViewer.upsert({
        where: {
          liveSessionId_userId: {
            liveSessionId:
              liveId,
            userId,
          },
        },

        update: {
          joinedAt:
            new Date(),
        },

        create: {
          liveSessionId:
            liveId,
          userId,
        },
      });

      const viewerCount =
        await prisma.liveViewer.count({
          where: {
            liveSessionId:
              liveId,
          },
        });

      const updatedLive =
        await prisma.liveSession.update({
          where: {
            id:
              liveId,
          },

          data: {
            viewerCount,
          },
        });

      return res.json({
        success: true,
        live:
          updatedLive,
        viewerCount,
      });
    } catch (error) {
      console.error(
        "JOIN LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to join livestream",
      });
    }
  }
);

// ------------------------------------------------------
// LEAVE LIVE
// ------------------------------------------------------

app.post(
  "/api/live/:id/leave",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      const liveId =
        Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (!Number.isInteger(liveId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid live session ID",
        });
      }

      await prisma.liveViewer.deleteMany({
        where: {
          liveSessionId:
            liveId,
          userId,
        },
      });

      const viewerCount =
        await prisma.liveViewer.count({
          where: {
            liveSessionId:
              liveId,
          },
        });

      const live =
        await prisma.liveSession.update({
          where: {
            id:
              liveId,
          },

          data: {
            viewerCount,
          },
        });

      return res.json({
        success: true,
        viewerCount,
        live,
      });
    } catch (error) {
      console.error(
        "LEAVE LIVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to leave livestream",
      });
    }
  }
);

// ======================================================
// GIFTS
// ======================================================

// ------------------------------------------------------
// GET GIFTS
// ------------------------------------------------------

app.get(
  "/api/gifts",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const category =
        typeof req.query.category ===
        "string"
          ? req.query.category.trim()
          : null;

      const where: any = {
        isActive: true,
      };

      if (category) {
        where.category =
          category;
      }

      const gifts =
        await prisma.gift.findMany({
          where,

          orderBy: [
            {
              sortOrder:
                "asc",
            },
            {
              priceKobo:
                "asc",
            },
          ],
        });

      return res.json({
        success: true,
        count:
          gifts.length,
        gifts: gifts.map(({ priceCoins: _legacyPrice, priceKobo, ...gift }) => ({ ...gift, priceNaira: priceKobo / 100 })),
      });
    } catch (error) {
      console.error(
        "GET GIFTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch gifts",
      });
    }
  }
);

// ------------------------------------------------------
// GET GIFT CATEGORIES
// ------------------------------------------------------

app.get(
  "/api/gifts/categories",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const gifts =
        await prisma.gift.findMany({
          where: {
            isActive:
              true,
          },

          select: {
            category:
              true,
          },

          distinct: [
            "category",
          ],
        });

      const categories =
        gifts
          .map(
            (gift) =>
              gift.category
          )
          .filter(Boolean)
          .sort();

      return res.json({
        success: true,
        categories,
      });
    } catch (error) {
      console.error(
        "GET GIFT CATEGORIES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch gift categories",
      });
    }
  }
);

// ------------------------------------------------------
// GET SINGLE GIFT
// ------------------------------------------------------

app.get(
  "/api/gifts/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const giftId =
        Number(req.params.id);

      if (!Number.isInteger(giftId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gift ID",
        });
      }

      const gift =
        await prisma.gift.findUnique({
          where: {
            id:
              giftId,
          },
        });

      if (
        !gift ||
        !gift.isActive
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Gift not found",
        });
      }

      return res.json({
        success: true,
        gift: (({ priceCoins: _legacyPrice, priceKobo, ...safeGift }) => ({ ...safeGift, priceNaira: priceKobo / 100 }))(gift),
      });
    } catch (error) {
      console.error(
        "GET SINGLE GIFT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch gift",
      });
    }
  }
);

// ------------------------------------------------------
// CREATE GIFT
// Development/admin seeding route
// ------------------------------------------------------

app.post(
  "/api/gifts",
  giftLimiter,
  requireAuth,
  requireAdmin,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        description,
        imageUrl,
        thumbnailUrl,
        animationUrl,
        priceNaira,
        priceKobo,
        category =
          "six20-originals",
        rarity =
          "common",
        sortOrder = 0,
        isFeatured =
          false,
      } = req.body;

      if (!name || (priceNaira === undefined && priceKobo === undefined)) {
        return res.status(400).json({
          success: false,
          message:
            "Gift name and price are required",
        });
      }

      const giftName =
        String(name).trim();

      if (!giftName) {
        return res.status(400).json({
          success: false,
          message:
            "Gift name cannot be empty",
        });
      }

      const parsedKobo = priceKobo !== undefined ? Number(priceKobo) : Math.round(Number(priceNaira) * 100);
      if (!Number.isSafeInteger(parsedKobo) || parsedKobo <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Gift price must be greater than 0",
        });
      }

      const slug =
        giftName
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      const existing =
        await prisma.gift.findUnique({
          where: {
            slug,
          },
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A gift with this name already exists",
          gift: (({ priceCoins: _legacyPrice, priceKobo: existingPriceKobo, ...safeGift }) => ({ ...safeGift, priceNaira: existingPriceKobo / 100 }))(existing),
        });
      }

      const gift =
        await prisma.gift.create({
          data: {
            name:
              giftName,

            slug,

            description:
              typeof description ===
              "string"
                ? description.trim()
                : null,

            category:
              typeof category ===
                "string" &&
              category.trim()
                ? category.trim()
                : "six20-originals",

            imageUrl:
              typeof imageUrl ===
                "string" &&
              imageUrl.trim()
                ? imageUrl.trim()
                : null,

            thumbnailUrl:
              typeof thumbnailUrl ===
                "string" &&
              thumbnailUrl.trim()
                ? thumbnailUrl.trim()
                : null,

            animationUrl:
              typeof animationUrl ===
                "string" &&
              animationUrl.trim()
                ? animationUrl.trim()
                : null,

            priceCoins: 0,
            priceKobo: parsedKobo,

            rarity:
              typeof rarity ===
                "string" &&
              rarity.trim()
                ? rarity.trim()
                : "common",

            sortOrder:
              Number.isFinite(
                Number(
                  sortOrder
                )
              )
                ? Number(
                    sortOrder
                  )
                : 0,

            isFeatured:
              Boolean(
                isFeatured
              ),

            isActive:
              true,
          },
        });

      return res.status(201).json({
        success: true,
        message:
          "Gift created successfully",
        gift: (({ priceCoins: _legacyPrice, priceKobo: giftPriceKobo, ...safeGift }) => ({ ...safeGift, priceNaira: giftPriceKobo / 100 }))(gift),
      });
    } catch (error: any) {
      console.error(
        "CREATE GIFT ERROR:",
        error
      );

      if (
        error?.code ===
        "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A gift with this slug already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create gift",
      });
    }
  }
);

// ======================================================
// WALLET
// ======================================================

// ------------------------------------------------------
// GET MY WALLET
// ------------------------------------------------------

app.get(
  "/api/wallet",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const wallet =
        await prisma.wallet.upsert({
          where: {
            userId,
          },

          update: {},

          create: {
            userId,
          },
        });

      return res.json({
        success: true,
        wallet,
      });
    } catch (error) {
      console.error(
        "GET WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch wallet",
      });
    }
  }
);

// ------------------------------------------------------
// Gift sending is registered in wallet-routes.ts.

// Wallet read endpoints are registered in wallet-routes.ts.

// 404
// ======================================================

app.use(
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      success: false,
      error:
        "Route not found",
    });
  }
);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Internal server error",
    });
  }
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  try {
    await prisma.$connect();

    console.log(
      "========================================"
    );

    console.log(
      "             SIX20 BACKEND"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Frontend: ${FRONTEND_URL}`
    );

    console.log(
      "Database: connected"
    );

    console.log(
      "========================================"
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `SIX20 API listening on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "DATABASE CONNECTION FAILED:"
    );

    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  }
}

// ======================================================
// SHUTDOWN
// ======================================================

process.on(
  "SIGINT",
  async () => {
    console.log(
      "Shutting down SIX20..."
    );

    await prisma.$disconnect();

    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "Shutting down SIX20..."
    );

    await prisma.$disconnect();

    process.exit(0);
  }
);

// ======================================================
// START
// ======================================================

startServer();
registerLiveProductionRoutes(app, prisma, requireAuth);

