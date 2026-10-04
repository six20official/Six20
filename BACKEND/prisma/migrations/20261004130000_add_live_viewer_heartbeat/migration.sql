ALTER TABLE "LiveViewer" ADD COLUMN "lastSeenAt" DATETIME NOT NULL DEFAULT '1970-01-01T00:00:00.000Z';

UPDATE "LiveViewer" SET "lastSeenAt" = "joinedAt";

CREATE INDEX "LiveViewer_liveSessionId_lastSeenAt_idx" ON "LiveViewer"("liveSessionId", "lastSeenAt");
