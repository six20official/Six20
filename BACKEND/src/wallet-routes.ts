import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import type { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";

const paystack = "https://api.paystack.co";
type Auth = (req: Request, res: Response, next: NextFunction) => unknown;
const money = (n: unknown) => {
  const amount = Number(n);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return null;
  const kobo = Math.round(amount * 100);
  return Number.isSafeInteger(kobo) ? kobo : null;
};
const ref = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
const key = () => process.env.PAYSTACK_SECRET_KEY;
async function ps(path: string, init: RequestInit = {}) {
  if (!key()) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const response = await fetch(`${paystack}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data: any = await response.json();
  if (!response.ok || !data.status) throw new Error(data.message || "Paystack request failed");
  return data.data;
}
const id = (req: Request) => Number((req as Request & { userId?: number }).userId);
const limit = rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });

export function registerWalletRoutes(app: Express, prisma: PrismaClient, auth: Auth) {
  app.post("/api/payments/paystack/webhook", async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"];
    const secret = key();
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!secret || !raw || typeof signature !== "string") return res.sendStatus(401);
    const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    const a = Buffer.from(signature, "hex"), b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
    try {
      const event = req.body;
      const data = event?.data;
      if (event.event === "charge.success") {
        const payment = data?.reference ? await prisma.paymentTransaction.findUnique({ where: { reference: data.reference } }) : null;
        if (!payment) return res.sendStatus(200);
        await settleFunding(prisma, payment.reference, data);
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
    res.json({ success: true, transactions: rows.map(({ amountKobo, type, description, status, createdAt, reference }) => ({ amountKobo, type, description, status, createdAt, reference })) });
  });
  app.get("/api/wallet/earnings", auth, async (req: Request, res: Response) => {
    const userId = id(req);
    const wallet = await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
    const stats = await prisma.giftTransaction.aggregate({ where: { receiverId: userId }, _sum: { totalKobo: true, creatorEarnKobo: true } });
    res.json({ success: true, wallet: { availableKobo: wallet.availableKobo, earningsKobo: wallet.earningsKobo, pendingKobo: wallet.pendingKobo }, giftStats: { totalGiftNaira: (stats._sum.totalKobo || 0) / 100, creatorEarningsNaira: (stats._sum.creatorEarnKobo || 0) / 100 } });
  });
  app.post("/api/wallet/fund", limit, auth, async (req: Request, res: Response) => {
    try {
      const amountKobo = money(req.body?.amountNaira);
      if (!amountKobo || amountKobo < 10000) return res.status(400).json({ message: "Minimum funding amount is ₦100" });
      const user = await prisma.user.findUnique({ where: { id: id(req) }, select: { email: true } });
      if (!user) return res.sendStatus(401);
      const reference = ref("six20_fund");
      const result = await ps("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: user.email, amount: amountKobo, currency: "NGN", reference, callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined }) });
      await prisma.paymentTransaction.create({ data: { userId: id(req), reference, amountKobo, currency: "NGN", provider: "paystack", status: "pending", authorizationUrl: result.authorization_url } });
      res.json({ success: true, authorizationUrl: result.authorization_url, reference });
    } catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Funding initialization failed" }); }
  });
  app.post("/api/wallet/fund/verify", limit, auth, async (req: Request, res: Response) => {
    try {
      const reference = String(req.body?.reference || "");
      const payment = await prisma.paymentTransaction.findUnique({ where: { reference } });
      if (!payment || payment.userId !== id(req)) return res.sendStatus(404);
      const data = await ps(`/transaction/verify/${encodeURIComponent(reference)}`);
      if (data.status !== "success" || data.currency !== "NGN" || data.amount !== payment.amountKobo) return res.status(400).json({ message: "Payment could not be verified" });
      await settleFunding(prisma, reference, data);
      res.json({ success: true, reference });
    } catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Verification failed" }); }
  });
  app.post("/api/wallet/transfer", limit, auth, async (req: Request, res: Response) => {
    const senderId = id(req), amountKobo = money(req.body?.amountNaira), username = String(req.body?.receiverUsername || "").trim();
    if (!amountKobo || !username) return res.status(400).json({ message: "A valid amount and username are required" });
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
    const [gift, receiver] = await Promise.all([prisma.gift.findFirst({ where: { id: giftId, isActive: true } }), prisma.user.findUnique({ where: { id: receiverId } })]);
    if (!gift || gift.priceKobo <= 0) return res.status(404).json({ success: false, message: "Gift is unavailable" });
    if (!receiver) return res.status(404).json({ success: false, message: "Recipient not found" });
    if (liveSessionId !== null) {
      const live = await prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { status: true, creatorId: true } });
      if (!live || live.status !== "live" || live.creatorId !== receiverId) return res.status(409).json({ success: false, message: "Invalid or ended LIVE recipient" });
    }
    const totalKobo = gift.priceKobo * quantity;
    if (!Number.isSafeInteger(totalKobo) || totalKobo <= 0 || totalKobo > 2_000_000_000) return res.status(400).json({ success: false, message: "Gift amount is invalid" });
    const creatorEarnKobo = Math.floor(totalKobo * 0.70), platformEarnKobo = totalKobo - creatorEarnKobo;
    const idempotencyKey = `livegift:${senderId}:${clientKey}`;
    const prior = await prisma.walletTransaction.findUnique({ where: { idempotencyKey }, select: { reference: true, amountKobo: true, description: true } });
    if (prior) {
      const creatorEntry = await prisma.walletTransaction.findUnique({ where: { idempotencyKey: `${prior.reference}:creator` }, select: { userId: true, amountKobo: true, description: true } });
      const expectedDescription = `Sent ${quantity} ${gift.name}`;
      if (prior.amountKobo !== -totalKobo || prior.description !== expectedDescription || creatorEntry?.userId !== receiverId || creatorEntry.amountKobo !== creatorEarnKobo || creatorEntry.description !== `Received ${quantity} ${gift.name}`) return res.status(409).json({ success: false, message: "Idempotency key was already used for a different gift" });
      return res.json({ success: true, duplicate: true, reference: prior.reference, totalNaira: totalKobo / 100, creatorEarnNaira: creatorEarnKobo / 100, platformEarnNaira: platformEarnKobo / 100, gift: { name: gift.name, icon: gift.imageUrl } });
    }
    const reference = ref("six20_gift");
    try {
      await prisma.$transaction(async tx => {
        const session = await tx.liveSession.findUnique({ where: { id: liveSessionId! }, select: { status: true, creatorId: true } });
        if (!session || session.status !== "live" || session.creatorId !== receiverId) throw new Error("LIVE_INVALID");
        const debit = await tx.wallet.updateMany({ where: { userId: senderId, availableKobo: { gte: totalKobo } }, data: { availableKobo: { decrement: totalKobo } } });
        if (!debit.count) throw new Error("INSUFFICIENT");
        await tx.wallet.upsert({ where: { userId: receiverId }, update: { availableKobo: { increment: creatorEarnKobo }, earningsKobo: { increment: creatorEarnKobo } }, create: { userId: receiverId, availableKobo: creatorEarnKobo, earningsKobo: creatorEarnKobo } });
        const giftTx = await tx.giftTransaction.create({ data: { senderId, receiverId, giftId, quantity, totalCoins: 0, creatorEarn: 0, platformEarn: 0, totalKobo, creatorEarnKobo, platformEarnKobo, liveSessionId } });
        await tx.walletTransaction.createMany({ data: [
          { userId: senderId, type: "gift_sent", amount: 0, amountKobo: -totalKobo, reference, providerReference: reference, idempotencyKey, description: `Sent ${quantity} ${gift.name}` },
          { userId: receiverId, type: "gift_received", amount: 0, amountKobo: creatorEarnKobo, reference, providerReference: reference, idempotencyKey: `${reference}:creator`, description: `Received ${quantity} ${gift.name}` },
        ] });
        return giftTx;
      });
      res.status(201).json({ success: true, reference, totalNaira: totalKobo / 100, creatorEarnNaira: creatorEarnKobo / 100, platformEarnNaira: platformEarnKobo / 100, gift: { name: gift.name, icon: gift.imageUrl }, sender: { username: (await prisma.user.findUnique({ where: { id: senderId }, select: { username: true } }))?.username }, creator: { username: receiver.username }, createdAt: new Date().toISOString() });
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "INSUFFICIENT") return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      if (message === "LIVE_INVALID") return res.status(409).json({ success: false, message: "Invalid or ended LIVE recipient" });
      if (message === "P2002" || (e as { code?: string })?.code === "P2002") {
        const duplicate = await prisma.walletTransaction.findUnique({ where: { idempotencyKey }, select: { reference: true, amountKobo: true, description: true } });
        if (duplicate?.amountKobo === -totalKobo && duplicate.description === `Sent ${quantity} ${gift.name}`) return res.json({ success: true, duplicate: true, reference: duplicate.reference, totalNaira: totalKobo / 100, creatorEarnNaira: creatorEarnKobo / 100, platformEarnNaira: platformEarnKobo / 100, gift: { name: gift.name, icon: gift.imageUrl } });
        if (duplicate) return res.status(409).json({ success: false, message: "Idempotency key was already used for a different gift" });
      }
      console.error("LIVE gift transaction failed", e);
      return res.status(500).json({ success: false, message: "Gift could not be sent" });
    }
  });
  app.get("/api/wallet/banks", auth, async (_req: Request, res: Response) => {
    try { res.json({ success: true, banks: await ps("/bank?country=nigeria&perPage=100") }); }
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
      const [resolved, banks] = await Promise.all([ps(`/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(bankCode)}`), ps("/bank?country=nigeria&perPage=100")]);
      const bank = banks.find((b: any) => String(b.code) === bankCode);
      if (!bank) return res.status(400).json({ message: "Bank not found" });
      const recipient = await ps("/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: resolved.account_name, account_number: accountNumber, bank_code: bankCode, currency: "NGN" }) });
      const account = await prisma.bankAccount.create({ data: { userId: id(req), bankCode, bankName: bank.name, accountName: resolved.account_name, accountLast4: accountNumber.slice(-4), recipientCode: recipient.recipient_code } });
      res.status(201).json({ success: true, account: { id: account.id, bankName: account.bankName, accountName: account.accountName, accountLast4: account.accountLast4 } });
    } catch (e) { res.status(502).json({ message: e instanceof Error ? e.message : "Account verification failed" }); }
  });
  app.post("/api/wallet/withdraw", limit, auth, async (req: Request, res: Response) => {
    let withdrawalId: string | undefined;
    try {
      const amountKobo = money(req.body?.amountNaira), bankAccountId = String(req.body?.bankAccountId || "");
      if (!amountKobo || amountKobo < 5000) return res.status(400).json({ message: "Minimum withdrawal amount is ₦50" });
      const account = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, userId: id(req) } });
      if (!account) return res.status(404).json({ message: "Saved bank account not found" });
      const reference = ref("six20_withdrawal");
      const withdrawal = await prisma.$transaction(async tx => {
        const debit = await tx.wallet.updateMany({ where: { userId: id(req), availableKobo: { gte: amountKobo } }, data: { availableKobo: { decrement: amountKobo }, pendingKobo: { increment: amountKobo } } });
        if (debit.count !== 1) throw new Error("INSUFFICIENT");
        const row = await tx.withdrawal.create({ data: { userId: id(req), bankAccountId, amountKobo, feeKobo: 0, netKobo: amountKobo, reference, recipientCode: account.recipientCode } });
        await tx.walletTransaction.create({ data: { userId: id(req), type: "withdrawal", amount: 0, amountKobo: -amountKobo, reference, providerReference: reference, idempotencyKey: `withdraw:${reference}`, status: "pending", description: `Withdrawal to ${account.bankName} ••••${account.accountLast4}` } });
        return row;
      });
      withdrawalId = withdrawal.id;
      const result = await ps("/transfer", { method: "POST", body: JSON.stringify({ source: "balance", amount: amountKobo, recipient: account.recipientCode, reference, currency: "NGN", reason: "SIX20 wallet withdrawal" }) });
      await prisma.withdrawal.update({ where: { id: withdrawal.id }, data: { providerTransferCode: String(result.transfer_code || result.id) } });
      res.status(201).json({ success: true, reference, status: "pending" });
    } catch (e) {
      const insufficient = e instanceof Error && e.message === "INSUFFICIENT";
      // Keep a reserved withdrawal pending if the provider call is ambiguous. A webhook or
      // reconciliation can settle it without risking a refund after a transfer was accepted.
      res.status(insufficient ? 400 : 502).json({ message: insufficient ? "Insufficient available balance" : withdrawalId ? "Withdrawal is pending provider confirmation" : e instanceof Error ? e.message : "Withdrawal failed", status: withdrawalId ? "pending" : undefined });
    }
  });
}

async function settleFunding(prisma: PrismaClient, reference: string, data: any) {
  const payment = await prisma.paymentTransaction.findUnique({ where: { reference } });
  if (!payment || payment.status === "success" || data.status !== "success" || data.currency !== "NGN" || data.amount !== payment.amountKobo) return;
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
