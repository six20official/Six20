-- Widen persisted kobo columns to SQLite BIGINT/Prisma BigInt without dropping wallet history.
-- Each table is copied in full; only the monetary column declarations change.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_LiveSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "streamKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slowModeSeconds" INTEGER NOT NULL DEFAULT 0,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reactionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "giftsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "goalTitle" TEXT,
    "goalTargetKobo" BIGINT,
    CONSTRAINT "LiveSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveSession" SELECT "id","creatorId","title","description","streamKey","status","viewerCount","likes","startedAt","endedAt","createdAt","slowModeSeconds","chatEnabled","reactionsEnabled","giftsEnabled","goalTitle","goalTargetKobo" FROM "LiveSession";
DROP TABLE "LiveSession";
ALTER TABLE "new_LiveSession" RENAME TO "LiveSession";

CREATE TABLE "new_Gift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "animationUrl" TEXT,
    "priceCoins" INTEGER NOT NULL,
    "priceKobo" BIGINT NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "brand" TEXT,
    "team" TEXT,
    "sport" TEXT,
    "country" TEXT,
    "licenseStatus" TEXT NOT NULL DEFAULT 'ORIGINAL_FAN',
    "licenseExpiry" DATETIME,
    "assetSource" TEXT
);
INSERT INTO "new_Gift" SELECT "id","name","slug","description","category","imageUrl","thumbnailUrl","animationUrl","priceCoins","priceKobo","rarity","sortOrder","isFeatured","isActive","createdAt","updatedAt","brand","team","sport","country","licenseStatus","licenseExpiry","assetSource" FROM "Gift";
DROP TABLE "Gift";
ALTER TABLE "new_Gift" RENAME TO "Gift";
CREATE UNIQUE INDEX "Gift_slug_key" ON "Gift"("slug");
CREATE INDEX "Gift_category_idx" ON "Gift"("category");
CREATE INDEX "Gift_priceCoins_idx" ON "Gift"("priceCoins");
CREATE INDEX "Gift_priceKobo_idx" ON "Gift"("priceKobo");
CREATE INDEX "Gift_rarity_idx" ON "Gift"("rarity");
CREATE INDEX "Gift_isActive_idx" ON "Gift"("isActive");
CREATE INDEX "Gift_isFeatured_idx" ON "Gift"("isFeatured");

CREATE TABLE "new_GiftTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "giftId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalCoins" INTEGER NOT NULL,
    "creatorEarn" INTEGER NOT NULL,
    "platformEarn" INTEGER NOT NULL,
    "totalKobo" BIGINT NOT NULL DEFAULT 0,
    "creatorEarnKobo" BIGINT NOT NULL DEFAULT 0,
    "platformEarnKobo" BIGINT NOT NULL DEFAULT 0,
    "liveSessionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftTransaction_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GiftTransaction" SELECT "id","senderId","receiverId","giftId","quantity","totalCoins","creatorEarn","platformEarn","totalKobo","creatorEarnKobo","platformEarnKobo","liveSessionId","createdAt" FROM "GiftTransaction";
DROP TABLE "GiftTransaction";
ALTER TABLE "new_GiftTransaction" RENAME TO "GiftTransaction";
CREATE INDEX "GiftTransaction_senderId_idx" ON "GiftTransaction"("senderId");
CREATE INDEX "GiftTransaction_receiverId_idx" ON "GiftTransaction"("receiverId");
CREATE INDEX "GiftTransaction_giftId_idx" ON "GiftTransaction"("giftId");
CREATE INDEX "GiftTransaction_liveSessionId_idx" ON "GiftTransaction"("liveSessionId");

CREATE TABLE "new_LiveBattle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionAId" INTEGER NOT NULL,
    "sessionBId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "giftTotalAKobo" BIGINT NOT NULL DEFAULT 0,
    "giftTotalBKobo" BIGINT NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 180,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "winnerCreatorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveBattle_sessionAId_fkey" FOREIGN KEY ("sessionAId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveBattle_sessionBId_fkey" FOREIGN KEY ("sessionBId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveBattle" SELECT "id","sessionAId","sessionBId","invitedByUserId","status","scoreA","scoreB","giftTotalAKobo","giftTotalBKobo","durationSeconds","startsAt","endsAt","winnerCreatorId","createdAt","updatedAt" FROM "LiveBattle";
DROP TABLE "LiveBattle";
ALTER TABLE "new_LiveBattle" RENAME TO "LiveBattle";
CREATE INDEX "LiveBattle_status_endsAt_idx" ON "LiveBattle"("status","endsAt");

CREATE TABLE "new_PaymentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizationUrl" TEXT,
    "providerTransactionId" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PaymentTransaction" SELECT "id","userId","reference","amountKobo","currency","provider","status","authorizationUrl","providerTransactionId","paidAt","createdAt","updatedAt" FROM "PaymentTransaction";
DROP TABLE "PaymentTransaction";
ALTER TABLE "new_PaymentTransaction" RENAME TO "PaymentTransaction";
CREATE UNIQUE INDEX "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId","createdAt");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

CREATE TABLE "new_Wallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "earnings" INTEGER NOT NULL DEFAULT 0,
    "availableKobo" BIGINT NOT NULL DEFAULT 0,
    "earningsKobo" BIGINT NOT NULL DEFAULT 0,
    "pendingKobo" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" SELECT "id","userId","coins","balance","earnings","availableKobo","earningsKobo","pendingKobo","createdAt","updatedAt" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

CREATE TABLE "new_WalletTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amountKobo" BIGINT NOT NULL DEFAULT 0,
    "description" TEXT,
    "reference" TEXT,
    "providerReference" TEXT,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WalletTransaction" SELECT "id","userId","type","amount","amountKobo","description","reference","providerReference","idempotencyKey","status","createdAt" FROM "WalletTransaction";
DROP TABLE "WalletTransaction";
ALTER TABLE "new_WalletTransaction" RENAME TO "WalletTransaction";
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

CREATE TABLE "new_Withdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "feeKobo" BIGINT NOT NULL DEFAULT 0,
    "netKobo" BIGINT NOT NULL,
    "reference" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "providerTransferCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Withdrawal_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Withdrawal" SELECT "id","userId","bankAccountId","amountKobo","feeKobo","netKobo","reference","recipientCode","providerTransferCode","status","failureReason","createdAt","updatedAt" FROM "Withdrawal";
DROP TABLE "Withdrawal";
ALTER TABLE "new_Withdrawal" RENAME TO "Withdrawal";
CREATE UNIQUE INDEX "Withdrawal_reference_key" ON "Withdrawal"("reference");
CREATE INDEX "Withdrawal_userId_createdAt_idx" ON "Withdrawal"("userId","createdAt");
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

CREATE TABLE "new_WalletTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WalletTransfer" SELECT "id","senderId","receiverId","amountKobo","reference","status","createdAt" FROM "WalletTransfer";
DROP TABLE "WalletTransfer";
ALTER TABLE "new_WalletTransfer" RENAME TO "WalletTransfer";
CREATE UNIQUE INDEX "WalletTransfer_reference_key" ON "WalletTransfer"("reference");
CREATE INDEX "WalletTransfer_senderId_createdAt_idx" ON "WalletTransfer"("senderId","createdAt");
CREATE INDEX "WalletTransfer_receiverId_createdAt_idx" ON "WalletTransfer"("receiverId","createdAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
