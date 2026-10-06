import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import type { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { contributeBattleScore } from "./live-interactive";
import { creatorShareKobo, formatNairaFromKobo, parseNairaToKobo, verifyPaystackSignature, type PaystackRuntimeConfig } from "./paystack-config";
import { publishLiveEvent } from "./live-events";

const paystack = "https://api.paystack.co";
type Auth = (req: Request, res: Response, next: NextFunction) => unknown;
const ref = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
class PaystackRequestError extends Error {
  constructor(readonly statusCode: number | undefined, message = "Paystack request failed") { super(message); }
}
async function ps(config: PaystackRuntimeConfig, path: string, init: RequestInit = {}) {
  const response = await fetch(`${paystack}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(12_000),
    headers: { Authorization: `Bearer ${config.secretKey}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  let data: any;
  try { data = await response.json(); } catch { throw new PaystackRequestError(response.status, "Paystack returned an invalid response"); }
  if (!response.ok || !data.status) throw new PaystackRequestError(response.status);
  return data.data;
}
const id = (req: Request) => Number((req as Request & { userId?: number }).userId);
const limit = rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });
async function bestEffortLiveBroadcast(sessionId: number, event: string, payload: Record<string, unknown>, actorId: number) {
  try { await publishLiveEvent(sessionId, event as any, payload, actorId); }
  catch (error) { console.error("LIVE gift event broadcast failed:", error); }
}
export function registerWalletRoutes(app: Express, prisma: PrismaClient, auth: Auth, config: PaystackRuntimeConfig) {
  app.post("/api/payments/paystack/webhook", async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"];
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw || typeof signature !== "string" || !verifyPaystackSignature(raw, signature, config.secretKey)) return res.sendStatus(401);
    try {
      const event = req.body;
      const data = event?.data;
      if (event.event === "charge.success") {
        const payment = data?.reference ? await prisma.paymentTransaction.findUnique({ where: { reference: data.reference } }) : null;
        if (!payment) return res.sendStatus(200);
        if (payment.status === "success") return res.sendStatus(200);
        const verified = await ps(config, `/transaction/verify/${encodeURIComponent(payment.reference)}`);
        if (verified.reference !== payment.reference || verified.status !== "success" || verified.currency !== payment.currency || !Number.isSafeInteger(verified.amount) || BigInt(verified.amount) !== payment.amountKobo) {
          console.error("Paystack webhook verification did not match the pending wallet payment");
          return res.sendStatus(500);
        }
        await settleFunding(prisma, payment.reference, verified);
        return res.sendStatus(200);
      }
      if (["transfer.success", "transfer.failed", "transfer.reversed"].includes(event.event)) {
        const withdrawal = data?.reference ? await prisma.withdrawal.findUnique({ where: { reference: data.reference } }) : null;
        if (!withdrawal) return res.sendStatus(200);
        await settleWithdrawal(prisma, withdrawal.reference, event.event, data);
        return res.sendStatus(200);
      }
      return res.sendStatus(200);
    } catch (e) { console.error("Paystack webhook processing failed", e); return res.sendStatus(500); }
  });

  app.get("/api/wallet", auth, async (req: Request, res: Response) => {
    const userId = id(req);
    const wallet = await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
    res.json({ success: true, wallet: { availableKobo: wallet.availableKobo, earningsKobo: wallet.earningsKobo, pendingKobo: wallet.pendingKobo } });
  });
  app.get("/api/wallet/transactions", auth, async (req: Request, res: Response) => {
    const rows = await prisma.walletTransaction.findMany({ where: { userId: id(req), amountKobo: { not: 0 } }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ success: true, transactions: rows.map(({ id, amountKobo, type, description, status, createdAt, reference }) => ({ id, amountKobo, type, description, status, createdAt, reference })) });
  });
  app.get("/api/wallet/earnings", auth, async (req: Request, res: Response) => {
    const userId = id(req);
    const wallet = await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
    const stats = await prisma.giftTransaction.aggregate({ where: { receiverId: userId }, _sum: { totalKobo: true, creatorEarnKobo: true } });
    res.json({ success: true, wallet: { availableKobo: wallet.availableKobo, earningsKobo: wallet.earningsKobo, pendingKobo: wallet.pendingKobo }, giftStats: { totalGiftNaira: formatNairaFromKobo(stats._sum.totalKobo || 0n), creatorEarningsNaira: formatNairaFromKobo(stats._sum.creatorEarnKobo || 0n) } });
  });
  app.post("/api/wallet/fund", limit, auth, async (req: Request, res: Response) => {
    const userId = id(req), amountKobo = parseNairaToKobo(req.body?.amountNaira);
    if (!Number.isSafeInteger(userId) || userId < 1) return res.sendStatus(401);
    if (!amountKobo || amountKobo < 10_000n) return res.status(400).json({ message: "Minimum funding amount is ₦100" });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return res.sendStatus(401);
    const reference = ref("six20_fund");
    let payment;
    try {
      payment = await prisma.paymentTransaction.create({ data: { userId, reference, amountKobo, currency: "NGN", provider: "paystack", status: "pending" } });
    } catch (error) {
      return res.status(500).json({ message: "Funding request could not be recorded" });
    }
    try {
      const result = await ps(config, "/transaction/initialize", { method: "POST", body: JSON.stringify({ email: user.email, amount: Number(amountKobo), currency: "NGN", reference, ...(config.callbackUrl ? { callback_url: config.callbackUrl } : {}) }) });
      if (result.reference !== reference || typeof result.authorization_url !== "string" || !result.authorization_url.startsWith("https://checkout.paystack.com/")) throw new Error("Invalid Paystack checkout response");
      await prisma.paymentTransaction.update({ where: { id: payment.id }, data: { status: "pending", authorizationUrl: result.authorization_url } });
      return res.json({ success: true, authorizationUrl: result.authorization_url, reference });
    } catch {
      await prisma.paymentTransaction.update({ where: { id: payment.id }, data: { status: "failed" } });
      return res.status(502).json({ message: "Paystack initialization failed" });
    }
  });
  app.post("/api/wallet/fund/verify", limit, auth, async (req: Request, res: Response) => {
    try {
      const reference = String(req.body?.reference || "");
      const payment = await prisma.paymentTransaction.findUnique({ where: { reference } });
      if (!payment || payment.userId !== id(req)) return res.sendStatus(404);
      const data = await ps(config, `/transaction/verify/${encodeURIComponent(reference)}`);
      if (data.reference !== payment.reference || data.currency !== payment.currency || !Number.isSafeInteger(data.amount) || BigInt(data.amount) !== payment.amountKobo) return res.status(400).json({ message: "Paystack payment details do not match this wallet funding request" });
      if (data.status !== "success") {
        if (["abandoned", "failed"].includes(String(data.status))) await prisma.paymentTransaction.updateMany({ where: { id: payment.id, status: "pending" }, data: { status: "failed" } });
        return res.status(400).json({ message: data.status === "abandoned" ? "Paystack checkout was cancelled" : "Payment is not successful" });
      }
      await settleFunding(prisma, reference, data);
      res.json({ success: true, reference, alreadyFulfilled: payment.status === "success" });
    } catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Verification failed" }); }
  });
  app.post("/api/wallet/transfer", limit, auth, async (req: Request, res: Response) => {
    const senderId = id(req), amountKobo = parseNairaToKobo(req.body?.amountNaira), username = String(req.body?.receiverUsername || "").trim();
    if (!amountKobo || !username) return res.status(400).json({ message: "A valid amount and username are required" });
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { id: true } });
    if (!sender) return res.sendStatus(401);
    const receiver = await prisma.user.findUnique({ where: { username } });
    if (!receiver) return res.status(404).json({ message: "Recipient not found" });
    if (receiver.id === senderId) return res.status(400).json({ message: "You cannot send money to yourself" });
    const reference = ref("six20_transfer");
    try {
      await prisma.$transaction(async tx => {
        const debit = await tx.wallet.updateMany({ where: { userId: senderId, availableKobo: { gte: amountKobo } }, data: { availableKobo: { decrement: amountKobo } } });
        if (debit.count !== 1) throw new Error("INSUFFICIENT");
        await tx.wallet.upsert({ where: { userId: receiver.id }, update: { availableKobo: { increment: amountKobo } }, create: { userId: receiver.id, availableKobo: amountKobo } });
        const transfer = await tx.walletTransfer.create({ data: { senderId, receiverId: receiver.id, amountKobo, reference } });
        await tx.walletTransaction.createMany({ data: [
          { userId: senderId, type: "transfer_sent", amount: 0, amountKobo: -amountKobo, reference, providerReference: reference, idempotencyKey: `${reference}:sender`, description: `Sent to @${receiver.username}` },
          { userId: receiver.id, type: "transfer_received", amount: 0, amountKobo, reference, providerReference: reference, idempotencyKey: `${reference}:receiver`, description: `Received from user ${senderId}` },
        ] });
        return transfer;
      });
      res.status(201).json({ success: true, reference });
    } catch (e) { res.status(e instanceof Error && e.message === "INSUFFICIENT" ? 400 : 500).json({ message: e instanceof Error && e.message === "INSUFFICIENT" ? "Insufficient available balance" : "Transfer failed" }); }
  });
  app.post("/api/gifts/send", limit, auth, async (req: Request, res: Response) => {
    const senderId = id(req), receiverId = Number(req.body?.receiverId), giftId = Number(req.body?.giftId);
    const quantity = Number(req.body?.quantity ?? 1), liveSessionId = req.body?.liveSessionId == null ? null : Number(req.body.liveSessionId);
    const clientKey = String(req.get("Idempotency-Key") || req.body?.idempotencyKey || "");
    if (!Number.isSafeInteger(receiverId) || receiverId < 1 || !Number.isSafeInteger(giftId) || giftId < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isSafeInteger(liveSessionId) || !liveSessionId || !/^[a-zA-Z0-9_-]{16,100}$/.test(clientKey)) return res.status(400).json({ success: false, message: "Invalid gift request or idempotency key" });
    if (receiverId === senderId) return res.status(400).json({ message: "You cannot gift yourself" });
    const [gift, receiver, sender] = await Promise.all([
      prisma.gift.findFirst({ where: { id: giftId, isActive: true } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
      prisma.user.findUnique({ where: { id: senderId }, select: { username: true } }),
    ]);
    if (!gift || gift.priceKobo < 20_000n) return res.status(404).json({ success: false, message: "Gift is unavailable" });
    if (!receiver) return res.status(404).json({ success: false, message: "Recipient not found" });
    if (!sender) return res.sendStatus(401);
    if (liveSessionId !== null) {
      const live = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { status: true, creatorId: true, giftsEnabled: true } });
      if (!live || live.status !== "live" || live.creatorId !== receiverId) return res.status(409).json({ success: false, message: "Invalid or ended LIVE recipient" });
      if (!live.giftsEnabled) return res.status(403).json({ success: false, message: "Gifts are disabled for this LIVE" });
      const [presence, restriction] = await Promise.all([
        prisma.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: senderId } }, select: { lastSeenAt: true } }),
        prisma.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId, userId: senderId } }, select: { isBanned: true, removedUntil: true } }),
      ]);
      if (!presence || presence.lastSeenAt < new Date(Date.now() - 75_000)) return res.status(403).json({ success: false, message: "Join this LIVE before sending gifts" });
      if (restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) return res.status(403).json({ success: false, message: "You cannot send gifts to this LIVE" });
    }
    const totalKobo = gift.priceKobo * BigInt(quantity);
    if (totalKobo <= 0n || totalKobo > 2_000_000_000n) return res.status(400).json({ success: false, message: "Gift amount is invalid" });
    const creatorEarnKobo = creatorShareKobo(totalKobo), platformEarnKobo = totalKobo - creatorEarnKobo;
    const idempotencyKey = `livegift:${senderId}:${clientKey}`;
    const prior = await prisma.walletTransaction.findUnique({ where: { idempotencyKey }, select: { reference: true, amountKobo: true, description: true } });
    if (prior) {
      const creatorEntry = await prisma.walletTransaction.findUnique({ where: { idempotencyKey: `${prior.reference}:creator` }, select: { userId: true, amountKobo: true, description: true } });
      const expectedDescription = `Sent ${quantity} ${gift.name}`;
      if (prior.amountKobo !== -totalKobo || prior.description !== expectedDescription || !creatorEntry || creatorEntry.userId !== receiverId || creatorEntry.amountKobo !== creatorEarnKobo || creatorEntry.description !== `Received ${quantity} ${gift.name}`) return res.status(409).json({ success: false, message: "Idempotency key was already used for a different gift" });
      return res.json({ success: true, duplicate: true, reference: prior.reference, totalNaira: formatNairaFromKobo(totalKobo), creatorEarnNaira: formatNairaFromKobo(creatorEarnKobo), platformEarnNaira: formatNairaFromKobo(platformEarnKobo), gift: { name: gift.name, icon: gift.imageUrl } });
    }
    const reference = ref("six20_gift");
    try {
      await prisma.$transaction(async tx => {
        const session = await tx.liveSession.findUnique({ where: { id: liveSessionId! }, select: { status: true, creatorId: true, giftsEnabled: true } });
        if (!session || session.status !== "live" || session.creatorId !== receiverId || !session.giftsEnabled) throw new Error("LIVE_INVALID");
        const viewer = await tx.liveViewer.findUnique({ where: { liveSessionId_userId: { liveSessionId: liveSessionId!, userId: senderId } }, select: { lastSeenAt: true } });
        const restriction = await tx.liveUserBlock.findUnique({ where: { liveSessionId_userId: { liveSessionId: liveSessionId!, userId: senderId } }, select: { isBanned: true, removedUntil: true } });
        if (!viewer || viewer.lastSeenAt < new Date(Date.now() - 75_000) || restriction?.isBanned || (restriction?.removedUntil && restriction.removedUntil > new Date())) throw new Error("LIVE_FORBIDDEN");
        const debit = await tx.wallet.updateMany({ where: { userId: senderId, availableKobo: { gte: totalKobo } }, data: { availableKobo: { decrement: totalKobo } } });
        if (!debit.count) throw new Error("INSUFFICIENT");
        await tx.wallet.upsert({ where: { userId: receiverId }, update: { availableKobo: { increment: creatorEarnKobo }, earningsKobo: { increment: creatorEarnKobo } }, create: { userId: receiverId, availableKobo: creatorEarnKobo, earningsKobo: creatorEarnKobo } });
        await tx.giftTransaction.create({ data: { senderId, receiverId, giftId, quantity, totalCoins: 0, creatorEarn: 0, platformEarn: 0, totalKobo, creatorEarnKobo, platformEarnKobo, liveSessionId } });
        await tx.walletTransaction.createMany({ data: [
          { userId: senderId, type: "gift_sent", amount: 0, amountKobo: -totalKobo, reference, providerReference: reference, idempotencyKey, description: `Sent ${quantity} ${gift.name}` },
          { userId: receiverId, type: "gift_received", amount: 0, amountKobo: creatorEarnKobo, reference, providerReference: reference, idempotencyKey: `${reference}:creator`, description: `Received ${quantity} ${gift.name}` },
        ] });
      });
      await contributeBattleScore(prisma, liveSessionId, "gift", Math.max(1, Number(totalKobo / 100n)), senderId, totalKobo);
      const raised = await prisma.giftTransaction.aggregate({ where: { liveSessionId }, _sum: { totalKobo: true } });
      await bestEffortLiveBroadcast(liveSessionId, "live.gift", { reference, giftId: gift.id, giftName: gift.name, giftIcon: gift.imageUrl, quantity, senderUsername: sender.username || "viewer", totalKobo: totalKobo.toString(), creatorEarnKobo: creatorEarnKobo.toString() }, senderId);
      const currentGoal = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { goalTitle: true, goalTargetKobo: true } });
      if (currentGoal?.goalTargetKobo) {
        const raisedKobo = raised._sum.totalKobo || 0n;
        await bestEffortLiveBroadcast(liveSessionId, "live.goal.update", { title: currentGoal.goalTitle, targetKobo: currentGoal.goalTargetKobo.toString(), raisedKobo: raisedKobo.toString() }, senderId);
        if (raisedKobo >= currentGoal.goalTargetKobo && raisedKobo - totalKobo < currentGoal.goalTargetKobo) await bestEffortLiveBroadcast(liveSessionId, "live.goal.complete", { title: currentGoal.goalTitle, targetKobo: currentGoal.goalTargetKobo.toString(), raisedKobo: raisedKobo.toString() }, senderId);
      }
      const supporters = await prisma.giftTransaction.groupBy({ by: ["senderId"], where: { liveSessionId }, _sum: { totalKobo: true }, orderBy: { _sum: { totalKobo: "desc" } }, take: 5 });
      const topSupporters = await Promise.all(supporters.map(async (row) => ({ userId: row.senderId, username: (await prisma.user.findUnique({ where: { id: row.senderId }, select: { username: true } }))?.username || "viewer", totalKobo: String(row._sum.totalKobo || 0n) })));
      await bestEffortLiveBroadcast(liveSessionId, "live.leaderboard.update", { topSupporters }, senderId);
      res.status(201).json({ success: true, reference, totalNaira: formatNairaFromKobo(totalKobo), creatorEarnNaira: formatNairaFromKobo(creatorEarnKobo), platformEarnNaira: formatNairaFromKobo(platformEarnKobo), gift: { name: gift.name, icon: gift.imageUrl }, sender: { username: sender.username }, creator: { username: receiver.username }, createdAt: new Date().toISOString() });
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "INSUFFICIENT") return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      if (message === "LIVE_INVALID") return res.status(409).json({ success: false, message: "Invalid or ended LIVE recipient" });
      if (message === "LIVE_FORBIDDEN") return res.status(403).json({ success: false, message: "Join this LIVE before sending gifts" });
      if (message === "P2002" || (e as { code?: string })?.code === "P2002") {
        const duplicate = await prisma.walletTransaction.findUnique({ where: { idempotencyKey }, select: { reference: true, amountKobo: true, description: true } });
      if (duplicate?.amountKobo === -totalKobo && duplicate.description === `Sent ${quantity} ${gift.name}`) return res.json({ success: true, duplicate: true, reference: duplicate.reference, totalNaira: formatNairaFromKobo(totalKobo), creatorEarnNaira: formatNairaFromKobo(creatorEarnKobo), platformEarnNaira: formatNairaFromKobo(platformEarnKobo), gift: { name: gift.name, icon: gift.imageUrl } });
        if (duplicate) return res.status(409).json({ success: false, message: "Idempotency key was already used for a different gift" });
      }
      console.error("LIVE gift transaction failed", e);
      return res.status(500).json({ success: false, message: "Gift could not be sent" });
    }
  });
  app.get("/api/wallet/banks", auth, async (_req: Request, res: Response) => {
    try { res.json({ success: true, banks: await ps(config, "/bank?country=nigeria&perPage=100") }); }
    catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Could not load banks" }); }
  });
  app.get("/api/wallet/bank-accounts", auth, async (req: Request, res: Response) => {
    const accounts = await prisma.bankAccount.findMany({ where: { userId: id(req) }, orderBy: { createdAt: "desc" }, select: { id: true, bankCode: true, bankName: true, accountName: true, accountLast4: true, currency: true } });
    res.json({ success: true, accounts });
  });
  app.post("/api/wallet/bank-account", limit, auth, async (req: Request, res: Response) => {
    try {
      const bankCode = String(req.body?.bankCode || ""), accountNumber = String(req.body?.accountNumber || "");
      if (!/^\d{10}$/.test(accountNumber) || !bankCode) return res.status(400).json({ message: "Enter a valid 10 digit account number and bank" });
      const [resolved, banks] = await Promise.all([ps(config, `/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(bankCode)}`), ps(config, "/bank?country=nigeria&perPage=100")]);
      const bank = banks.find((b: any) => String(b.code) === bankCode);
      if (!bank) return res.status(400).json({ message: "Bank not found" });
      const recipient = await ps(config, "/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: resolved.account_name, account_number: accountNumber, bank_code: bankCode, currency: "NGN" }) });
      const account = await prisma.bankAccount.create({ data: { userId: id(req), bankCode, bankName: bank.name, accountName: resolved.account_name, accountLast4: accountNumber.slice(-4), recipientCode: recipient.recipient_code } });
      res.status(201).json({ success: true, account: { id: account.id, bankName: account.bankName, accountName: account.accountName, accountLast4: account.accountLast4 } });
    } catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Account verification failed" }); }
  });
  app.post("/api/wallet/withdraw", limit, auth, async (req: Request, res: Response) => {
    const userId = id(req), amountKobo = parseNairaToKobo(req.body?.amountNaira), bankAccountId = String(req.body?.bankAccountId || "");
    if (!amountKobo || amountKobo < 5000n) return res.status(400).json({ message: "Minimum withdrawal amount is ₦50" });
    const account = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, userId } });
    if (!account) return res.status(404).json({ message: "Saved bank account not found" });
    const reference = ref("six20_withdrawal");
    try {
      const withdrawal = await prisma.$transaction(async tx => {
        const debit = await tx.wallet.updateMany({ where: { userId, availableKobo: { gte: amountKobo } }, data: { availableKobo: { decrement: amountKobo }, pendingKobo: { increment: amountKobo } } });
        if (debit.count !== 1) throw new Error("INSUFFICIENT");
        const row = await tx.withdrawal.create({ data: { userId, bankAccountId, amountKobo, feeKobo: 0n, netKobo: amountKobo, reference, recipientCode: account.recipientCode } });
        await tx.walletTransaction.create({ data: { userId, type: "withdrawal", amount: 0, amountKobo: -amountKobo, reference, providerReference: reference, idempotencyKey: `withdraw:${reference}`, status: "pending", description: `Withdrawal to ${account.bankName} ••••${account.accountLast4}` } });
        return row;
      });
      const result = await ps(config, "/transfer", { method: "POST", body: JSON.stringify({ source: "balance", amount: Number(amountKobo), recipient: account.recipientCode, reference, currency: "NGN", reason: "SIX20 wallet withdrawal" }) });
      await prisma.withdrawal.update({ where: { id: withdrawal.id }, data: { providerTransferCode: String(result.transfer_code || result.id) } });
      return res.status(201).json({ success: true, reference, status: "pending" });
    } catch (error) {
      const insufficient = error instanceof Error && error.message === "INSUFFICIENT";
      return res.status(insufficient ? 400 : 502).json({ message: insufficient ? "Insufficient available balance" : "Withdrawal failed" });
    }
  });
}

async function settleFunding(prisma: PrismaClient, reference: string, data: any) {
  const payment = await prisma.paymentTransaction.findUnique({ where: { reference } });
  if (!payment || payment.status === "success" || data.reference !== payment.reference || data.status !== "success" || data.currency !== payment.currency || !Number.isSafeInteger(data.amount) || BigInt(data.amount) !== payment.amountKobo) return;
  await prisma.$transaction(async tx => {
    const changed = await tx.paymentTransaction.updateMany({ where: { id: payment.id, status: { not: "success" } }, data: { status: "success", providerTransactionId: String(data.id), paidAt: new Date(data.paid_at || Date.now()) } });
    if (!changed.count) return;
    await tx.wallet.upsert({ where: { userId: payment.userId }, update: { availableKobo: { increment: payment.amountKobo } }, create: { userId: payment.userId, availableKobo: payment.amountKobo } });
    await tx.walletTransaction.create({ data: { userId: payment.userId, type: "funding", amount: 0, amountKobo: payment.amountKobo, reference, providerReference: String(data.id), idempotencyKey: `fund:${reference}`, description: "Wallet funding" } });
  });
}
async function settleWithdrawal(prisma: PrismaClient, reference: string, event: string, data: any) {
  const status = event === "transfer.success" ? "success" : event === "transfer.reversed" ? "reversed" : "failed";
  await prisma.$transaction(async tx => {
    const withdrawal = await tx.withdrawal.findUnique({ where: { reference } });
    if (!withdrawal || withdrawal.status !== "pending") return;
    await tx.withdrawal.update({ where: { id: withdrawal.id }, data: { status, providerTransferCode: data.transfer_code ? String(data.transfer_code) : undefined, failureReason: status === "success" ? null : String(data.reason || status) } });
    if (status === "success") await tx.wallet.update({ where: { userId: withdrawal.userId }, data: { pendingKobo: { decrement: withdrawal.amountKobo } } });
    else await tx.wallet.update({ where: { userId: withdrawal.userId }, data: { pendingKobo: { decrement: withdrawal.amountKobo }, availableKobo: { increment: withdrawal.amountKobo } } });
    await tx.walletTransaction.updateMany({ where: { idempotencyKey: `withdraw:${reference}` }, data: { status: status === "success" ? "completed" : status } });
  });
}
