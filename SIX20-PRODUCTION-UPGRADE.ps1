$ErrorActionPreference = "Stop"

$ROOT = "C:\Users\USER\Desktop\six20"
$FRONTEND = Join-Path $ROOT "FRONTEND"
$BACKEND = Join-Path $ROOT "BACKEND"
$STAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP = Join-Path $ROOT "BACKUP-PRODUCTION-$STAMP"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " SIX20 - SAFE PRODUCTION BACKEND UPGRADE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $ROOT)) { throw "SIX20 folder not found: $ROOT" }
if (!(Test-Path $FRONTEND)) { throw "FRONTEND folder not found." }
if (!(Test-Path $BACKEND)) { throw "BACKEND folder not found." }

Write-Host "[1/7] Creating backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BACKUP | Out-Null
Copy-Item (Join-Path $BACKEND "prisma") (Join-Path $BACKUP "prisma") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $BACKEND "src") (Join-Path $BACKUP "backend-src") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $FRONTEND "app") (Join-Path $BACKUP "frontend-app") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $FRONTEND "lib") (Join-Path $BACKUP "frontend-lib") -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Backup: $BACKUP" -ForegroundColor Green

Write-Host "[2/7] Updating Prisma schema with real LIVE chat..." -ForegroundColor Yellow
$schemaPath = Join-Path $BACKEND "prisma\schema.prisma"
$schema = Get-Content $schemaPath -Raw

if ($schema -notmatch "model LiveChatMessage") {
$schema += @'

model LiveChatMessage {
  id            Int         @id @default(autoincrement())
  liveSessionId Int
  userId        Int
  text          String
  createdAt     DateTime    @default(now())

  liveSession   LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([liveSessionId, createdAt])
  @@index([userId, createdAt])
}
'@
}

if ($schema -notmatch "chatMessages\s+LiveChatMessage\[\]") {
    $schema = $schema -replace '(\s+viewers\s+LiveViewer\[\])', ('$1' + [Environment]::NewLine + '  chatMessages LiveChatMessage[]')
}

if ($schema -notmatch "liveChatMessages\s+LiveChatMessage\[\]") {
    $schema = $schema -replace '(\s+liveSessions\s+LiveSession\[\])', ('$1' + [Environment]::NewLine + '  liveChatMessages LiveChatMessage[]')
}

Set-Content $schemaPath $schema -Encoding UTF8
Write-Host "Prisma schema updated." -ForegroundColor Green

Write-Host "[3/7] Creating LIVE production routes..." -ForegroundColor Yellow
$productionPath = Join-Path $BACKEND "src\live-production.ts"

@'
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
'@ | Set-Content $productionPath -Encoding UTF8

Write-Host "LIVE production routes created." -ForegroundColor Green

Write-Host "[4/7] Mounting LIVE production routes into server..." -ForegroundColor Yellow
$serverPath = Join-Path $BACKEND "src\server.ts"
$server = Get-Content $serverPath -Raw

if ($server -notmatch "live-production") {
    $server = $server -replace 'import \{ PrismaClient \} from "@prisma/client";', ('import { PrismaClient } from "@prisma/client";' + [Environment]::NewLine + 'import { registerLiveProductionRoutes } from "./live-production";')
}

if ($server -notmatch "registerLiveProductionRoutes\(") {
    $server += @'

registerLiveProductionRoutes(app, prisma, requireAuth);
'@
}

Set-Content $serverPath $server -Encoding UTF8
Write-Host "LIVE routes mounted." -ForegroundColor Green

Write-Host "[5/7] Updating frontend API helper..." -ForegroundColor Yellow
$apiPath = Join-Path $FRONTEND "lib\api.ts"

@'
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function getHealth() {
  return apiFetch("/api/health");
}

export { API_URL };
'@ | Set-Content $apiPath -Encoding UTF8

Write-Host "API helper updated." -ForegroundColor Green

Write-Host "[6/7] Generating Prisma client and applying local database schema..." -ForegroundColor Yellow
Push-Location $BACKEND
npm exec prisma generate
npm exec prisma db push
Pop-Location
Write-Host "Database schema synchronized." -ForegroundColor Green

Write-Host "[7/7] Running TypeScript/build verification..." -ForegroundColor Yellow
Push-Location $BACKEND
npm run build
Pop-Location

Push-Location $FRONTEND
npx tsc --noEmit
npm run build
Pop-Location

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " SIX20 UPGRADE COMPLETED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup created at:" -ForegroundColor Cyan
Write-Host $BACKUP
Write-Host ""
Write-Host "Next verification:"
Write-Host "1. Start BACKEND on port 4000."
Write-Host "2. Start FRONTEND on port 3000."
Write-Host "3. Open /live."
Write-Host "4. Create/start a LIVE session."
Write-Host "5. Verify real chat messages and LIVE likes."
Write-Host ""
Write-Host "This upgrades the local backend architecture. Vercel/Railway deployment is NOT changed yet." -ForegroundColor Yellow
