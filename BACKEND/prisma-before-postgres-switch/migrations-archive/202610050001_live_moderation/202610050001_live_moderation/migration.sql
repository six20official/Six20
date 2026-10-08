ALTER TABLE "LiveSession" ADD COLUMN "slowModeSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LiveViewer" ADD COLUMN "mutedUntil" DATETIME;
ALTER TABLE "LiveChatMessage" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "LiveChatMessage" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "LiveUserBlock" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "liveSessionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveUserBlock_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LiveUserBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LiveUserBlock_liveSessionId_userId_key" ON "LiveUserBlock"("liveSessionId", "userId");
