"use client";

import { FormEvent, useEffect, useState } from "react";
import FeatureShell, { Card, btn, ghost } from "../../components/FeatureShell";
import { apiFetch } from "../../lib/api";

type Wallet = { availableKobo: number | string; earningsKobo: number | string; pendingKobo: number | string };
type Bank = { name: string; code: string };
type Account = { id: string; bankName: string; accountName: string; accountLast4: string };
type Tx = { id: number; type: string; amountKobo: number | string; description?: string; status: string; createdAt: string };
const naira = (kobo: number | string = 0) => {
  let amount: bigint;
  try { amount = BigInt(kobo); } catch { amount = 0n; }
  const negative = amount < 0n, absolute = negative ? -amount : amount;
  const whole = absolute / 100n, fraction = String(absolute % 100n).padStart(2, "0");
  return `${negative ? "-" : ""}â‚¦${new Intl.NumberFormat("en-NG").format(whole)}.${fraction}`;
};
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("six20-token") || ""}` });

export default function Page() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [fundAmount, setFundAmount] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [username, setUsername] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  async function refresh() {
    const headers = auth();
    const [w, t, a, b] = await Promise.all([
      apiFetch("/api/wallet", { headers }), apiFetch("/api/wallet/transactions", { headers }),
      apiFetch("/api/wallet/bank-accounts", { headers }), apiFetch("/api/wallet/banks", { headers }),
    ]);
    setWallet(w.wallet); setTransactions(t.transactions || []); setAccounts(a.accounts || []); setBanks(b.banks || []);
  }
  useEffect(() => { const hasToken = Boolean(localStorage.getItem("six20-token")); setSignedIn(hasToken); if (hasToken) refresh().catch(e => setNotice(e.message)); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedStatus = params.get("status")?.toLowerCase();
    if (params.get("cancelled") === "1" || returnedStatus === "cancelled") {
      setNotice("Payment cancelled. Your wallet was not charged.");
      return;
    }
    if (returnedStatus === "failed") {
      setNotice("Payment failed. Your wallet was not charged.");
      return;
    }
    const reference = params.get("reference") || params.get("trxref");
    if (!reference || !localStorage.getItem("six20-token")) return;
    apiFetch("/api/wallet/fund/verify", { method: "POST", headers: auth(), body: JSON.stringify({ reference }) })
      .then(() => { setNotice("Payment successful. Your wallet balance has been refreshed."); window.history.replaceState({}, "", window.location.pathname); return refresh(); })
      .catch(e => setNotice(e instanceof Error ? e.message : "Payment verification failed"));
  }, []);

  async function submit(event: FormEvent, endpoint: string, body: object, redirect = false) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await apiFetch(endpoint, { method: "POST", headers: auth(), body: JSON.stringify(body) });
      if (redirect && result.authorizationUrl) { window.location.assign(result.authorizationUrl); return; }
      setNotice("Request completed successfully."); await refresh();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Request failed"); }
    finally { setBusy(false); }
  }

  return <FeatureShell title="Wallet" subtitle="Manage your Naira balance, earnings and payouts.">
    {!signedIn && <Card>Sign in to view and manage your wallet.</Card>}
    {wallet && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      {[["Available Balance", wallet.availableKobo], ["Creator Earnings", wallet.earningsKobo], ["Pending", wallet.pendingKobo]].map(([label, value]) => <Card key={String(label)}><p style={{ margin: 0, color: "#756F80" }}>{label}</p><h2 style={{ margin: "8px 0", fontSize: 30, fontWeight: 900 }}>{naira(value as number | string)}</h2></Card>)}
    </div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16, marginTop: 16 }}>
      <Card><h2>Add Money</h2><form onSubmit={e => submit(e, "/api/wallet/fund", { amountNaira: Number(fundAmount) }, true)}><label>Amount (â‚¦)<input required min="100" step="0.01" type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} /></label><button style={btn} disabled={busy}>Continue to Paystack</button></form></Card>
      <Card><h2>Send Money</h2><form onSubmit={e => submit(e, "/api/wallet/transfer", { receiverUsername: username, amountNaira: Number(sendAmount) })}><label>Recipient username<input required value={username} onChange={e => setUsername(e.target.value)} /></label><label>Amount (â‚¦)<input required min="0.01" step="0.01" type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} /></label><button style={btn} disabled={busy}>Send Money</button></form></Card>
      <Card><h2>Verify Bank Account</h2><form onSubmit={e => submit(e, "/api/wallet/bank-account", { bankCode, accountNumber })}><label>Bank<select required value={bankCode} onChange={e => setBankCode(e.target.value)}><option value="">Select a bank</option>{banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></label><label>Account number<input required maxLength={10} inputMode="numeric" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ""))} /></label><button style={btn} disabled={busy}>Verify and Save</button></form></Card>
      <Card><h2>Withdraw</h2><form onSubmit={e => submit(e, "/api/wallet/withdraw", { bankAccountId: withdrawAccount, amountNaira: Number(withdrawAmount) })}><label>Saved bank account<select required value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)}><option value="">Select an account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName} â€¢â€¢â€¢â€¢{a.accountLast4} ({a.accountName})</option>)}</select></label><label>Amount (â‚¦)<input required min="50" step="0.01" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} /></label><button style={ghost} disabled={busy}>Withdraw</button></form></Card>
    </div>
    {notice && <Card className="mt-4">{notice}</Card>}
    <Card className="mt-5"><h2>Transaction History</h2>{transactions.length ? transactions.map(t => <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, borderTop: "1px solid #eee", padding: "12px 0" }}><div><strong>{t.description || t.type}</strong><div style={{ color: "#756F80", fontSize: 13 }}>{new Date(t.createdAt).toLocaleString("en-NG")} Â· {t.status}</div></div><strong>{naira(t.amountKobo)}</strong></div>) : <p>No transactions yet.</p>}</Card>
  </FeatureShell>;
}
