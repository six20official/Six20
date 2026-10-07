-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "isSeller" BOOLEAN NOT NULL DEFAULT false,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "creatorLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "category" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "state" TEXT,
    "city" TEXT,
    "website" TEXT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalGifts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "soundTitle" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" SERIAL NOT NULL,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "conversationId" INTEGER,
    "text" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" SERIAL NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "streamKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "slowModeSeconds" INTEGER NOT NULL DEFAULT 0,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reactionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "giftsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "goalTitle" TEXT,
    "goalTargetKobo" BIGINT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveBattle" (
    "id" SERIAL NOT NULL,
    "sessionAId" INTEGER NOT NULL,
    "sessionBId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "giftTotalAKobo" BIGINT NOT NULL DEFAULT 0,
    "giftTotalBKobo" BIGINT NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 180,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "winnerCreatorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePlayGame" (
    "id" SERIAL NOT NULL,
    "liveSessionId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "hostUserId" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "winnerUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LivePlayGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePoll" (
    "id" SERIAL NOT NULL,
    "liveSessionId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivePoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePollVote" (
    "id" SERIAL NOT NULL,
    "pollId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivePollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveViewer" (
    "id" SERIAL NOT NULL,
    "liveSessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
    "mutedUntil" TIMESTAMP(3),
    "stageRole" TEXT NOT NULL DEFAULT 'audience',
    "stageStatus" TEXT NOT NULL DEFAULT 'none',

    CONSTRAINT "LiveViewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" SERIAL NOT NULL,
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
    "brand" TEXT,
    "team" TEXT,
    "sport" TEXT,
    "country" TEXT,
    "licenseStatus" TEXT NOT NULL DEFAULT 'ORIGINAL_FAN',
    "licenseExpiry" TIMESTAMP(3),
    "assetSource" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftTransaction" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "earnings" INTEGER NOT NULL DEFAULT 0,
    "availableKobo" BIGINT NOT NULL DEFAULT 0,
    "earningsKobo" BIGINT NOT NULL DEFAULT 0,
    "pendingKobo" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amountKobo" BIGINT NOT NULL DEFAULT 0,
    "description" TEXT,
    "reference" TEXT,
    "providerReference" TEXT,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizationUrl" TEXT,
    "providerTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransfer" (
    "id" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "location" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerRating" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commissionRate" INTEGER NOT NULL DEFAULT 20,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" SERIAL NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "productId" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" SERIAL NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "linkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "id" SERIAL NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "orderId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScore" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecuritySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveChatMessage" (
    "id" SERIAL NOT NULL,
    "liveSessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LiveChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveUserBlock" (
    "id" SERIAL NOT NULL,
    "liveSessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil" TIMESTAMP(3),
    "removedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveUserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_videoId_userId_key" ON "Like"("videoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "LiveBattle_status_endsAt_idx" ON "LiveBattle"("status", "endsAt");

-- CreateIndex
CREATE INDEX "LivePlayGame_liveSessionId_status_idx" ON "LivePlayGame"("liveSessionId", "status");

-- CreateIndex
CREATE INDEX "LivePoll_liveSessionId_status_idx" ON "LivePoll"("liveSessionId", "status");

-- CreateIndex
CREATE INDEX "LivePollVote_pollId_optionIndex_idx" ON "LivePollVote"("pollId", "optionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LivePollVote_pollId_userId_key" ON "LivePollVote"("pollId", "userId");

-- CreateIndex
CREATE INDEX "LiveViewer_liveSessionId_lastSeenAt_idx" ON "LiveViewer"("liveSessionId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "LiveViewer_liveSessionId_stageRole_stageStatus_idx" ON "LiveViewer"("liveSessionId", "stageRole", "stageStatus");

-- CreateIndex
CREATE UNIQUE INDEX "LiveViewer_liveSessionId_userId_key" ON "LiveViewer"("liveSessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Gift_slug_key" ON "Gift"("slug");

-- CreateIndex
CREATE INDEX "Gift_category_idx" ON "Gift"("category");

-- CreateIndex
CREATE INDEX "Gift_priceCoins_idx" ON "Gift"("priceCoins");

-- CreateIndex
CREATE INDEX "Gift_priceKobo_idx" ON "Gift"("priceKobo");

-- CreateIndex
CREATE INDEX "Gift_rarity_idx" ON "Gift"("rarity");

-- CreateIndex
CREATE INDEX "Gift_isActive_idx" ON "Gift"("isActive");

-- CreateIndex
CREATE INDEX "Gift_isFeatured_idx" ON "Gift"("isFeatured");

-- CreateIndex
CREATE INDEX "GiftTransaction_senderId_idx" ON "GiftTransaction"("senderId");

-- CreateIndex
CREATE INDEX "GiftTransaction_receiverId_idx" ON "GiftTransaction"("receiverId");

-- CreateIndex
CREATE INDEX "GiftTransaction_giftId_idx" ON "GiftTransaction"("giftId");

-- CreateIndex
CREATE INDEX "GiftTransaction_liveSessionId_idx" ON "GiftTransaction"("liveSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

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

-- CreateIndex
CREATE UNIQUE INDEX "Store_sellerId_key" ON "Store"("sellerId");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_userId_key" ON "ProductReview"("productId", "userId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerRating_storeId_buyerId_key" ON "SellerRating"("storeId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_code_key" ON "AffiliateLink"("code");

-- CreateIndex
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

-- CreateIndex
CREATE INDEX "AffiliateClick_linkId_idx" ON "AffiliateClick"("linkId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_orderId_idx" ON "AffiliateCommission"("orderId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_status_idx" ON "AffiliateCommission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "GameScore_gameId_idx" ON "GameScore"("gameId");

-- CreateIndex
CREATE INDEX "GameScore_userId_idx" ON "GameScore"("userId");

-- CreateIndex
CREATE INDEX "SecuritySession_userId_idx" ON "SecuritySession"("userId");

-- CreateIndex
CREATE INDEX "SecuritySession_tokenHash_idx" ON "SecuritySession"("tokenHash");

-- CreateIndex
CREATE INDEX "SecuritySession_expiresAt_idx" ON "SecuritySession"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LiveChatMessage_liveSessionId_createdAt_idx" ON "LiveChatMessage"("liveSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveChatMessage_userId_createdAt_idx" ON "LiveChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveUserBlock_liveSessionId_userId_key" ON "LiveUserBlock"("liveSessionId", "userId");

-- AddForeignKey
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveBattle" ADD CONSTRAINT "LiveBattle_sessionAId_fkey" FOREIGN KEY ("sessionAId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveBattle" ADD CONSTRAINT "LiveBattle_sessionBId_fkey" FOREIGN KEY ("sessionBId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePlayGame" ADD CONSTRAINT "LivePlayGame_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePoll" ADD CONSTRAINT "LivePoll_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePollVote" ADD CONSTRAINT "LivePollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "LivePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveViewer" ADD CONSTRAINT "LiveViewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveViewer" ADD CONSTRAINT "LiveViewer_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecuritySession" ADD CONSTRAINT "SecuritySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveChatMessage" ADD CONSTRAINT "LiveChatMessage_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveChatMessage" ADD CONSTRAINT "LiveChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveUserBlock" ADD CONSTRAINT "LiveUserBlock_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveUserBlock" ADD CONSTRAINT "LiveUserBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
