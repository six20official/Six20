# SIX20 STAGE 1E READ-ONLY BASELINE REPORT

## DATABASE IDENTITY

- Exact path: `C:\Users\USER\Desktop\six20\BACKEND\prisma\dev.db`
- SQLite version: 3.50.4.
- File size: 380,928 bytes.
- Last modified: 2026-10-03 21:26:44 UTC.
- Opened successfully in SQLite read-only mode (`mode=ro`).
- Application table counts exclude SQLite internals and `_prisma_migrations`.

## PRISMA MIGRATION LEDGER

| Migration | started_at (UTC) | finished_at (UTC) | rolled_back_at | applied_steps_count | State |
|---|---|---|---|---:|---|
| 20260915022555_init | 2026-09-17 18:05:43.568 | 2026-09-17 18:05:43.641 | NULL | 1 | Finished |

One completed migration is recorded. No failed, rolled-back, or incomplete entries. The two later migrations are absent.

## PHYSICAL SCHEMA

Compared the physical database against `BACKEND/prisma/schema.prisma`. Prisma reports an empty diff. There are 31 application tables and 240 columns.

Application tables: `AffiliateClick`, `AffiliateCommission`, `AffiliateLink`, `AffiliateProfile`, `Comment`, `Conversation`, `ConversationMember`, `CreatorProfile`, `Follow`, `Game`, `GameScore`, `Gift`, `GiftTransaction`, `Like`, `LiveChatMessage`, `LiveSession`, `LiveViewer`, `Message`, `Notification`, `Order`, `OrderItem`, `Product`, `ProductReview`, `SecurityEvent`, `SecuritySession`, `SellerRating`, `Store`, `User`, `Video`, `Wallet`, `WalletTransaction`.

No missing or unexpected tables or columns. No column type, nullability, default-value, primary-key, or unique-constraint differences were reported by Prisma's physical schema diff. Column count by table is included in DATA INVENTORY.

## INDEX VERIFICATION

There are 51 application indexes, including 15 unique indexes. Index names, columns, and uniqueness:

- AffiliateClick: `AffiliateClick_linkId_idx(linkId)`
- AffiliateCommission: `AffiliateCommission_status_idx(status)`; `AffiliateCommission_orderId_idx(orderId)`
- AffiliateLink: `AffiliateLink_productId_idx(productId)`; **unique** `AffiliateLink_code_key(code)`
- AffiliateProfile: **unique** `AffiliateProfile_userId_key(userId)`
- ConversationMember: **unique** `ConversationMember_conversationId_userId_key(conversationId, userId)`
- CreatorProfile: **unique** `CreatorProfile_userId_key(userId)`
- Follow: **unique** `Follow_followerId_followingId_key(followerId, followingId)`
- Game: **unique** `Game_slug_key(slug)`
- GameScore: `GameScore_userId_idx(userId)`; `GameScore_gameId_idx(gameId)`
- Gift: `Gift_isFeatured_idx(isFeatured)`; `Gift_isActive_idx(isActive)`; `Gift_rarity_idx(rarity)`; `Gift_priceCoins_idx(priceCoins)`; `Gift_category_idx(category)`; **unique** `Gift_slug_key(slug)`
- GiftTransaction: `GiftTransaction_liveSessionId_idx(liveSessionId)`; `GiftTransaction_giftId_idx(giftId)`; `GiftTransaction_receiverId_idx(receiverId)`; `GiftTransaction_senderId_idx(senderId)`
- Like: **unique** `Like_videoId_userId_key(videoId, userId)`
- LiveChatMessage: `LiveChatMessage_userId_createdAt_idx(userId, createdAt)`; `LiveChatMessage_liveSessionId_createdAt_idx(liveSessionId, createdAt)`
- LiveViewer: **unique** `LiveViewer_liveSessionId_userId_key(liveSessionId, userId)`
- Message: `Message_createdAt_idx(createdAt)`; `Message_conversationId_idx(conversationId)`; `Message_receiverId_idx(receiverId)`; `Message_senderId_idx(senderId)`
- Order: `Order_status_idx(status)`; `Order_storeId_idx(storeId)`; `Order_buyerId_idx(buyerId)`
- OrderItem: `OrderItem_productId_idx(productId)`; `OrderItem_orderId_idx(orderId)`
- Product: `Product_category_idx(category)`; `Product_storeId_idx(storeId)`
- ProductReview: **unique** `ProductReview_productId_userId_key(productId, userId)`
- SecurityEvent: `SecurityEvent_createdAt_idx(createdAt)`; `SecurityEvent_type_idx(type)`; `SecurityEvent_userId_idx(userId)`
- SecuritySession: `SecuritySession_expiresAt_idx(expiresAt)`; `SecuritySession_tokenHash_idx(tokenHash)`; `SecuritySession_userId_idx(userId)`
- SellerRating: **unique** `SellerRating_storeId_buyerId_key(storeId, buyerId)`
- Store: **unique** `Store_sellerId_key(sellerId)`
- User: **unique** `User_email_key(email)`; **unique** `User_username_key(username)`
- Wallet: **unique** `Wallet_userId_key(userId)`
- WalletTransaction: `WalletTransaction_createdAt_idx(createdAt)`; `WalletTransaction_userId_idx(userId)`

Comment, Conversation, LiveSession, Notification, and Video have no secondary indexes. No missing or unexpected application indexes; names, columns, and uniqueness match the Prisma schema.

## FOREIGN KEY VERIFICATION

There are 42 physical application foreign keys. All have ON UPDATE CASCADE. Delete action is shown per FK.

- AffiliateClick: affiliateId -> AffiliateProfile.id (ON DELETE CASCADE)
- AffiliateCommission: affiliateId -> AffiliateProfile.id (ON DELETE CASCADE)
- AffiliateLink: affiliateId -> AffiliateProfile.id (ON DELETE CASCADE)
- AffiliateProfile: userId -> User.id (ON DELETE CASCADE)
- Comment: userId -> User.id (ON DELETE CASCADE); videoId -> Video.id (ON DELETE CASCADE)
- ConversationMember: userId -> User.id (ON DELETE CASCADE); conversationId -> Conversation.id (ON DELETE CASCADE)
- CreatorProfile: userId -> User.id (ON DELETE CASCADE)
- Follow: followingId -> User.id (ON DELETE CASCADE); followerId -> User.id (ON DELETE CASCADE)
- GameScore: userId -> User.id (ON DELETE CASCADE); gameId -> Game.id (ON DELETE CASCADE)
- GiftTransaction: giftId -> Gift.id (ON DELETE CASCADE); receiverId -> User.id (ON DELETE CASCADE); senderId -> User.id (ON DELETE CASCADE)
- Like: videoId -> Video.id (ON DELETE CASCADE); userId -> User.id (ON DELETE CASCADE)
- LiveChatMessage: userId -> User.id (ON DELETE CASCADE); liveSessionId -> LiveSession.id (ON DELETE CASCADE)
- LiveSession: creatorId -> User.id (ON DELETE CASCADE)
- LiveViewer: userId -> User.id (ON DELETE CASCADE); liveSessionId -> LiveSession.id (ON DELETE CASCADE)
- Message: conversationId -> Conversation.id (ON DELETE CASCADE); receiverId -> User.id (ON DELETE CASCADE); senderId -> User.id (ON DELETE CASCADE)
- Notification: userId -> User.id (ON DELETE CASCADE)
- Order: storeId -> Store.id (ON DELETE CASCADE); buyerId -> User.id (ON DELETE CASCADE)
- OrderItem: productId -> Product.id (ON DELETE CASCADE); orderId -> Order.id (ON DELETE CASCADE)
- Product: storeId -> Store.id (ON DELETE CASCADE)
- ProductReview: userId -> User.id (ON DELETE CASCADE); productId -> Product.id (ON DELETE CASCADE)
- SecurityEvent: userId -> User.id (ON DELETE SET NULL)
- SecuritySession: userId -> User.id (ON DELETE CASCADE)
- SellerRating: buyerId -> User.id (ON DELETE CASCADE); storeId -> Store.id (ON DELETE CASCADE)
- Store: sellerId -> User.id (ON DELETE CASCADE)
- Video: userId -> User.id (ON DELETE CASCADE)
- Wallet: userId -> User.id (ON DELETE CASCADE)
- WalletTransaction: userId -> User.id (ON DELETE CASCADE)

No missing or unexpected foreign keys or action differences were reported by the physical Prisma diff.

## DATA INVENTORY

| Table | Columns | Rows |
|---|---:|---:|
| AffiliateClick | 4 | 0 |
| AffiliateCommission | 6 | 0 |
| AffiliateLink | 7 | 0 |
| AffiliateProfile | 9 | 0 |
| Comment | 6 | 0 |
| Conversation | 5 | 0 |
| ConversationMember | 5 | 0 |
| CreatorProfile | 12 | 0 |
| Follow | 4 | 0 |
| Game | 7 | 0 |
| GameScore | 5 | 0 |
| Gift | 15 | 0 |
| GiftTransaction | 10 | 0 |
| Like | 4 | 1 |
| LiveChatMessage | 5 | 0 |
| LiveSession | 11 | 0 |
| LiveViewer | 4 | 0 |
| Message | 9 | 0 |
| Notification | 7 | 0 |
| Order | 9 | 0 |
| OrderItem | 5 | 0 |
| Product | 11 | 0 |
| ProductReview | 6 | 0 |
| SecurityEvent | 7 | 0 |
| SecuritySession | 10 | 0 |
| SellerRating | 6 | 0 |
| Store | 9 | 0 |
| User | 17 | 4 |
| Video | 10 | 1 |
| Wallet | 7 | 0 |
| WalletTransaction | 8 | 0 |

Only table names, column counts, and row counts are included; no record contents are included.

## FOREIGN KEY INTEGRITY

Read-only `PRAGMA foreign_key_check`: 0 violations.

## PRISMA DIFF

Command run from `BACKEND`:

```text
.\node_modules\.bin\prisma.cmd migrate diff --from-url "file:./prisma/dev.db" --to-schema-datamodel "./prisma/schema.prisma" --script
```

Output: `-- This is an empty migration.`

Result: EMPTY DIFF.

## MIGRATION LEDGER ANALYSIS

The physical database contains the schema changes represented by both requested migrations, although the ledger has no entry for either one.

- `20261004090000_expand_legacy_schema`: the physical schema contains the tables and structures from the migration, including Conversation, ConversationMember, CreatorProfile, LiveSession, LiveViewer, Gift, GiftTransaction, Wallet, WalletTransaction, Store, Product, ProductReview, Order, OrderItem, SellerRating, AffiliateProfile, AffiliateLink, AffiliateClick, AffiliateCommission, Game, GameScore, SecuritySession, and SecurityEvent. Their columns, indexes/unique constraints, and FK definitions/actions are present. The rebuilt legacy tables also match the current Prisma schema.
- `20261004100000_add_live_chat_message`: `LiveChatMessage` has columns `id`, `liveSessionId`, `userId`, `text`, and `createdAt`; expected indexes on (liveSessionId, createdAt) and (userId, createdAt); and FKs to LiveSession.id and User.id, each ON DELETE CASCADE and ON UPDATE CASCADE.

If a separately authorized future reconciliation confirms the intended database and exact migration files, the required ledger reconciliation is to mark these migrations applied, in chronological order: `20261004090000_expand_legacy_schema`, then `20261004100000_add_live_chat_message`. No reconciliation was performed.

## GIT STATUS

- Branch: `main`
- Recent commits: `7b38814 Connect SIX20 LIVE to real backend`; `2b225d0 SIX20 LIVE production backend integration`; `ba80f12 SIX20 local backend integration and rename update`; `ee1acfd Clean SIX20 frontend branding and demo store`; `cb9c1be Clean SIX20 frontend branding and demo store`
- Remote origin fetch and push: `https://github.com/six20official/Six20.git`.
- Initial `git status --short` showed pre-existing untracked migration directories and audit/design/stage reports, including this requested report. No tracked-file changes were present. No files were staged; no commit or push was performed.

## FINAL SAFETY REPORT

REAL DATABASE MODIFIED: NO
MIGRATION APPLIED: NO
DATA CHANGED: NO
SCHEMA CHANGED: NO
GIT CHANGED: NO

PHYSICAL SCHEMA MATCH: PASS

INDEX VERIFICATION: PASS

FOREIGN KEY VERIFICATION: PASS

FOREIGN KEY INTEGRITY: PASS

PRISMA DIFF: EMPTY

MIGRATION LEDGER:
Only 20260915022555_init is recorded, finished successfully with applied_steps_count 1; the two later migrations are absent. No failed, rolled-back, or incomplete rows.

RECOMMENDED NEXT STEP:
The physical schema already contains both unrecorded migration changes. Before any reconciliation, verify the intended target database and migration files/checksums; then, only with explicit authorization, mark 20261004090000_expand_legacy_schema and 20261004100000_add_live_chat_message applied in chronological order. Do not rerun their SQL against this database.
