-- CreateTable
CREATE TABLE "LiveSessionInvite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "liveSessionId" INTEGER NOT NULL,
    "invitedUserId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveSessionInvite_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveSessionInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveSessionInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LiveSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "streamKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "slowModeSeconds" INTEGER NOT NULL DEFAULT 0,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reactionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "giftsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "goalTitle" TEXT,
    "goalTargetKobo" BIGINT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveSession" ("chatEnabled", "createdAt", "creatorId", "description", "endedAt", "giftsEnabled", "goalTargetKobo", "goalTitle", "id", "likes", "reactionsEnabled", "slowModeSeconds", "startedAt", "status", "streamKey", "title", "viewerCount") SELECT "chatEnabled", "createdAt", "creatorId", "description", "endedAt", "giftsEnabled", "goalTargetKobo", "goalTitle", "id", "likes", "reactionsEnabled", "slowModeSeconds", "startedAt", "status", "streamKey", "title", "viewerCount" FROM "LiveSession";
DROP TABLE "LiveSession";
ALTER TABLE "new_LiveSession" RENAME TO "LiveSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LiveSessionInvite_invitedUserId_idx" ON "LiveSessionInvite"("invitedUserId");

-- CreateIndex
CREATE INDEX "LiveSessionInvite_invitedByUserId_idx" ON "LiveSessionInvite"("invitedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveSessionInvite_liveSessionId_invitedUserId_key" ON "LiveSessionInvite"("liveSessionId", "invitedUserId");
