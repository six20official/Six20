-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "feeKobo" INTEGER NOT NULL DEFAULT 0,
    "netKobo" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "WalletTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "priceKobo" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Gift" ("animationUrl", "category", "createdAt", "description", "id", "imageUrl", "isActive", "isFeatured", "name", "priceCoins", "rarity", "slug", "sortOrder", "thumbnailUrl", "updatedAt") SELECT "animationUrl", "category", "createdAt", "description", "id", "imageUrl", "isActive", "isFeatured", "name", "priceCoins", "rarity", "slug", "sortOrder", "thumbnailUrl", "updatedAt" FROM "Gift";
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
    "totalKobo" INTEGER NOT NULL DEFAULT 0,
    "creatorEarnKobo" INTEGER NOT NULL DEFAULT 0,
    "platformEarnKobo" INTEGER NOT NULL DEFAULT 0,
    "liveSessionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftTransaction_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GiftTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GiftTransaction" ("createdAt", "creatorEarn", "giftId", "id", "liveSessionId", "platformEarn", "quantity", "receiverId", "senderId", "totalCoins") SELECT "createdAt", "creatorEarn", "giftId", "id", "liveSessionId", "platformEarn", "quantity", "receiverId", "senderId", "totalCoins" FROM "GiftTransaction";
DROP TABLE "GiftTransaction";
ALTER TABLE "new_GiftTransaction" RENAME TO "GiftTransaction";
CREATE INDEX "GiftTransaction_senderId_idx" ON "GiftTransaction"("senderId");
CREATE INDEX "GiftTransaction_receiverId_idx" ON "GiftTransaction"("receiverId");
CREATE INDEX "GiftTransaction_giftId_idx" ON "GiftTransaction"("giftId");
CREATE INDEX "GiftTransaction_liveSessionId_idx" ON "GiftTransaction"("liveSessionId");
CREATE TABLE "new_Wallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "earnings" INTEGER NOT NULL DEFAULT 0,
    "availableKobo" INTEGER NOT NULL DEFAULT 0,
    "earningsKobo" INTEGER NOT NULL DEFAULT 0,
    "pendingKobo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" ("balance", "coins", "createdAt", "earnings", "id", "updatedAt", "userId") SELECT "balance", "coins", "createdAt", "earnings", "id", "updatedAt", "userId" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE TABLE "new_WalletTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amountKobo" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "reference" TEXT,
    "providerReference" TEXT,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WalletTransaction" ("amount", "createdAt", "description", "id", "reference", "status", "type", "userId") SELECT "amount", "createdAt", "description", "id", "reference", "status", "type", "userId" FROM "WalletTransaction";
DROP TABLE "WalletTransaction";
ALTER TABLE "new_WalletTransaction" RENAME TO "WalletTransaction";
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_recipientCode_key" ON "BankAccount"("recipientCode");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_reference_key" ON "Withdrawal"("reference");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_createdAt_idx" ON "Withdrawal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransfer_reference_key" ON "WalletTransfer"("reference");

-- CreateIndex
CREATE INDEX "WalletTransfer_senderId_createdAt_idx" ON "WalletTransfer"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransfer_receiverId_createdAt_idx" ON "WalletTransfer"("receiverId", "createdAt");
