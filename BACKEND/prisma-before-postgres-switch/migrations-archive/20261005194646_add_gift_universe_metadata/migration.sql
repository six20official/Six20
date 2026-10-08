-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LiveBattle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionAId" INTEGER NOT NULL,
    "sessionBId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "giftTotalAKobo" INTEGER NOT NULL DEFAULT 0,
    "giftTotalBKobo" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 180,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "winnerCreatorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveBattle_sessionAId_fkey" FOREIGN KEY ("sessionAId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveBattle_sessionBId_fkey" FOREIGN KEY ("sessionBId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveBattle" ("createdAt", "durationSeconds", "endsAt", "giftTotalAKobo", "giftTotalBKobo", "id", "invitedByUserId", "scoreA", "scoreB", "sessionAId", "sessionBId", "startsAt", "status", "updatedAt", "winnerCreatorId") SELECT "createdAt", "durationSeconds", "endsAt", "giftTotalAKobo", "giftTotalBKobo", "id", "invitedByUserId", "scoreA", "scoreB", "sessionAId", "sessionBId", "startsAt", "status", "updatedAt", "winnerCreatorId" FROM "LiveBattle";
DROP TABLE "LiveBattle";
ALTER TABLE "new_LiveBattle" RENAME TO "LiveBattle";
CREATE INDEX "LiveBattle_status_endsAt_idx" ON "LiveBattle"("status", "endsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
