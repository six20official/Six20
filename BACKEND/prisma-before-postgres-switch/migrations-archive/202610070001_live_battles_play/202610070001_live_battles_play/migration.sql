CREATE TABLE "LiveBattle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionAId" INTEGER NOT NULL,
    "sessionBId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 180,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "winnerCreatorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "LiveBattle_status_endsAt_idx" ON "LiveBattle"("status", "endsAt");
CREATE TABLE "LivePlayGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "liveSessionId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "hostUserId" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "winnerUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "LivePlayGame_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LivePlayGame_liveSessionId_status_idx" ON "LivePlayGame"("liveSessionId", "status");
CREATE TABLE "LivePoll" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "liveSessionId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LivePoll_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LivePoll_liveSessionId_status_idx" ON "LivePoll"("liveSessionId", "status");
CREATE TABLE "LivePollVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pollId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LivePollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "LivePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LivePollVote_pollId_userId_key" ON "LivePollVote"("pollId", "userId");
CREATE INDEX "LivePollVote_pollId_optionIndex_idx" ON "LivePollVote"("pollId", "optionIndex");
