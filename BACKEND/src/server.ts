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
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);

const JWT_SECRET =
  process.env.JWT_SECRET || "ayo9ja-development-secret";

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "./uploads"
);

// ======================================================
// STARTUP
// ======================================================

fs.mkdirSync(uploadDir, {
  recursive: true,
});

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ======================================================
// BODY PARSING
// ======================================================

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
  "/uploads",
  express.static(uploadDir)
);

// ======================================================
// TYPES
// ======================================================

type AuthRequest = Request & {
  userId?: number;
};

// ======================================================
// JWT
// ======================================================

function createToken(userId: number): string {
  return jwt.sign(
    {
      userId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

function auth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (
    !header ||
    !header.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const token = header.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as {
      userId: number;
    };

    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

// ======================================================
// MULTER VIDEO UPLOAD
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
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const randomName =
      `${Date.now()}-` +
      `${Math.random()
        .toString(36)
        .substring(2, 12)}` +
      extension;

    callback(null, randomName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize:
      100 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback
  ) => {
    if (
      !file.mimetype.startsWith("video/")
    ) {
      return callback(
        new Error(
          "Only video files are allowed"
        )
      );
    }

    callback(null, true);
  },
});

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  (
    _req: Request,
    res: Response
  ) => {
    return res.json({
      success: true,
      service: "Ayo9ja API",
      status: "online",
      time: new Date().toISOString(),
    });
  }
);

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
      service: "Ayo9ja Backend",
      message: "Ayo9ja API is running",
      health: "/api/health",
      videos: "/api/videos",
      users: "/api/users",
      messages: "/api/messages",
    });
  }
);

// ======================================================
// AUTH - REGISTER
// ======================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    console.log("REGISTER REQUEST:", {
      username,
      email,
      hasPassword: !!password,
      displayName,
    });

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanDisplayName =
      String(displayName || cleanUsername).trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        displayName: cleanDisplayName,
      },
    });

    console.log("REGISTER SUCCESS:", user.id);

    return res.status(201).json({
    token: createToken(user.id),
    user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("");
    console.error("========== REGISTER DATABASE ERROR ==========");
    console.error(error);
    console.error("==============================================");
  console.error("");

    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    return res.status(500).json({
      error: "Registration failed",
      details:
        process.env.NODE_ENV !== "production"
          ? error?.message || String(error)
          : undefined,
      code:
        process.env.NODE_ENV !== "production"
          ? error?.code || undefined
          : undefined,
    });
  }
});