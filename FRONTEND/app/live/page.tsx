"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type User = { id: number; username: string; displayName: string; avatarUrl?: string | null };
type Live = { id: number; title: string; description?: string | null; status: string; creatorId: number; viewerCount: number; creator: User };
type Chat = { id: number; text: string; createdAt: string; user: User };
type GiftEvent = { giftName: string; giftIcon?: string | null; quantity: number; senderUsername: string; creatorUsername: string; totalNaira: number; timestamp: string };
type Gift = { id: number; name: string; imageUrl?: string | null; thumbnailUrl?: string | null; priceKobo: number; priceNaira: number; isActive: boolean };
const auth = () => ({ Authorization: `Bearer ${typeof window === "undefined" ? "" : localStorage.getItem("six20-token") || ""}` });
const naira = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

export default function LivePage() {
  const [lives, setLives] = useState<Live[]>([]), [live, setLive] = useState<Live | null>(null);
  const [user, setUser] = useState<User | null>(null), [wallet, setWallet] = useState<number | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]), [messages, setMessages] = useState<Chat[]>([]);
  const [giftEvents, setGiftEvents] = useState<GiftEvent[]>([]), [giftCursor, setGiftCursor] = useState("");
  const [joined, setJoined] = useState(false), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(""), [chatText, setChatText] = useState(""), [giftId, setGiftId] = useState(""), [quantity, setQuantity] = useState(1);
  const [giftKey, setGiftKey] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("six20-token") : null;
  const canUseChat = joined || Boolean(live && user && live.creatorId === user.id);

  const loadLives = useCallback(async () => {
    const r = await apiFetch("/api/live"); setLives(r.lives || []);
  }, []);
  const loadLive = useCallback(async (id: number) => {
    const r = await apiFetch(`/api/live/${id}`); setLive(r.live); return r.live as Live;
  }, []);
  const loadChat = useCallback(async (id: number) => {
    const r = await apiFetch(`/api/live/${id}/chat`, { headers: auth() }); setMessages(r.messages || []);
  }, []);
  const loadWallet = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch("/api/wallet", { headers: auth() }); setWallet(r.wallet.availableKobo);
  }, [token]);

  useEffect(() => {
    loadLives().catch(e => setNotice(e.message));
    apiFetch("/api/gifts").then(r => setGifts((r.gifts || []).filter((g: Gift) => g.isActive && g.priceKobo > 0))).catch(e => setNotice(e.message));
    if (token) {
      apiFetch("/api/auth/me", { headers: auth() }).then(r => setUser(r.user)).catch(() => setNotice("Please sign in again to use LIVE features."));
      loadWallet().catch(() => setNotice("Could not load your NGN wallet."));
    }
  }, [loadLives, loadWallet, token]);

  useEffect(() => {
    if (!live) return;
    const id = live.id;
    loadLive(id).catch(() => setLive(null));
    const poll = window.setInterval(() => {
      loadLive(id).catch(() => {}); loadLives().catch(() => {});
      if (token) {
        loadChat(id).catch(() => {});
        const query = giftCursor ? `?since=${encodeURIComponent(giftCursor)}` : "";
        apiFetch(`/api/live/${id}/gifts${query}`, { headers: auth() }).then(r => {
          if (r.events?.length) { setGiftEvents(v => [...r.events, ...v].slice(0, 8)); setGiftCursor(r.events[r.events.length - 1].timestamp); }
        }).catch(() => {});
      }
    }, 5000);
    return () => window.clearInterval(poll);
  }, [live?.id, giftCursor, loadChat, loadLive, loadLives, token]);

  useEffect(() => {
    if (!joined || !live || !token) return;
    let alive = true;
    const heartbeat = () => apiFetch(`/api/live/${live.id}/heartbeat`, { method: "POST", headers: auth() }).then(r => { if (alive) setLive(v => v ? { ...v, viewerCount: r.viewerCount } : v); }).catch(() => {});
    heartbeat(); const timer = window.setInterval(heartbeat, 25_000);
    return () => { alive = false; window.clearInterval(timer); fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/live/${live.id}/leave`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, keepalive: true }).catch(() => {}); };
  }, [joined, live?.id, token]);

  async function chooseLive(item: Live) {
    setNotice("");
    try { await loadLive(item.id); setMessages([]); setGiftEvents([]); setGiftCursor(""); if (token) await loadChat(item.id); setJoined(false); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not open LIVE."); }
  }
  async function startLive(e: FormEvent) {
    e.preventDefault(); if (!token) { setNotice("Sign in to start a LIVE."); return; }
    setBusy(true); setNotice("");
    try {
      const made = await apiFetch("/api/live", { method: "POST", headers: auth(), body: JSON.stringify({ title }) });
      const started = await apiFetch(`/api/live/${made.live.id}/start`, { method: "POST", headers: auth() });
      setTitle(""); await loadLives(); await chooseLive(started.live);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not start LIVE."); }
    finally { setBusy(false); }
  }
  async function join() {
    if (!token || !live) return setNotice("Sign in to join this LIVE.");
    setBusy(true); setNotice("");
    try { const r = await apiFetch(`/api/live/${live.id}/join`, { method: "POST", headers: auth() }); setLive(r.live); setJoined(true); await loadChat(live.id); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not join LIVE."); }
    finally { setBusy(false); }
  }
  async function sendChat(e: FormEvent) {
    e.preventDefault(); if (!live || !chatText.trim()) return;
    try { const r = await apiFetch(`/api/live/${live.id}/chat`, { method: "POST", headers: auth(), body: JSON.stringify({ text: chatText }) }); setMessages(v => [...v.slice(-99), r.message]); setChatText(""); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Message could not be sent."); }
  }
  async function sendGift() {
    if (!live || !giftId) return;
    setBusy(true); setNotice("");
    try {
      const key = giftKey || crypto.randomUUID(); if (!giftKey) setGiftKey(key);
      const r = await apiFetch("/api/gifts/send", { method: "POST", headers: { ...auth(), "Idempotency-Key": key }, body: JSON.stringify({ receiverId: live.creatorId, liveSessionId: live.id, giftId: Number(giftId), quantity }) });
      setGiftKey(""); await loadWallet(); setNotice(`Sent ${quantity} ${r.gift.name} for ${naira(r.totalNaira * 100)}. ${naira(r.creatorEarnNaira * 100)} goes to the creator.`);
    } catch (e) { const message = e instanceof Error ? e.message : "Gift could not be sent."; setNotice(message.toLowerCase().includes("insufficient") ? "Insufficient wallet balance. Add Money to continue." : message); }
    finally { setBusy(false); }
  }
  async function endLive() {
    if (!live) return; setBusy(true);
    try { await apiFetch(`/api/live/${live.id}/end`, { method: "POST", headers: auth() }); setJoined(false); setLive(null); await loadLives(); setNotice("LIVE ended."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not end LIVE."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#fffdf8] text-[#17132f]">
    <header className="flex items-center justify-between border-b bg-white px-5 py-4"><Link href="/" className="text-xl font-black">SIX20 LIVE</Link><div className="flex items-center gap-4"><span>{wallet === null ? "" : `Available ${naira(wallet)}`}</span><Link className="font-bold text-violet-700" href="/wallet">Add Money</Link></div></header>
    <div className="mx-auto grid max-w-7xl gap-6 p-5 lg:grid-cols-[1fr_340px]">
      <section>
        {!user && <p className="mb-4 rounded-xl bg-amber-50 p-3">Sign in to start or join a LIVE, chat, and send gifts.</p>}
        {user && <form onSubmit={startLive} className="mb-5 flex gap-2 rounded-2xl bg-white p-4 shadow-sm"><input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="What are you going LIVE about?" className="min-w-0 flex-1 rounded-lg border px-3"/><button disabled={busy} className="rounded-lg bg-violet-700 px-4 py-2 font-bold text-white">Go LIVE</button></form>}
        {live ? <article className="overflow-hidden rounded-3xl bg-[#17132f] text-white">
          <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-900 p-6 text-center"><span className="mb-4 rounded-full bg-red-500 px-3 py-1 text-xs font-black">{live.status.toUpperCase()}</span><h1 className="text-3xl font-black">{live.title}</h1><p className="mt-2">{live.creator.displayName} · @{live.creator.username}</p><p className="mt-3">{live.viewerCount} watching</p><p className="mt-6 max-w-lg text-sm text-white/70">This session is live. Video delivery requires a configured streaming provider.</p></div>
          <div className="flex flex-wrap gap-2 p-4">{!joined && live.creatorId !== user?.id && <button disabled={busy || !user} onClick={join} className="rounded-lg bg-violet-600 px-4 py-2 font-bold">Join LIVE</button>}{live.creatorId === user?.id && <button disabled={busy} onClick={endLive} className="rounded-lg bg-red-600 px-4 py-2 font-bold">End LIVE</button>}{joined && <span className="self-center text-sm text-white/70">Presence active · heartbeat every 25 seconds</span>}</div>
          {joined && <div className="border-t border-white/10 p-4"><h2 className="mb-3 font-bold">Send a Naira gift</h2><div className="flex flex-wrap items-center gap-2"><select value={giftId} onChange={e => { setGiftId(e.target.value); setGiftKey(""); }} className="rounded-lg px-3 py-2 text-black"><option value="">Choose a gift</option>{gifts.map(g => <option key={g.id} value={g.id}>{g.name} · {naira(g.priceKobo)}</option>)}</select><input type="number" min={1} max={100} value={quantity} onChange={e => { setQuantity(Math.max(1, Math.min(100, Number(e.target.value)))); setGiftKey(""); }} className="w-20 rounded-lg px-3 py-2 text-black"/><button disabled={busy || !giftId} onClick={sendGift} className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-black">Send gift</button><span className="text-sm">Balance {wallet === null ? "—" : naira(wallet)}</span></div></div>}
          {giftEvents.length > 0 && <div aria-live="polite" className="space-y-1 border-t border-white/10 p-3 text-sm">{giftEvents.slice(0, 3).map((event, i) => <p key={`${event.timestamp}-${i}`}><span>{event.giftIcon ? "🎁" : "🎁"}</span> @{event.senderUsername} sent {event.quantity} {event.giftName} · {naira(event.totalNaira * 100)}</p>)}</div>}
        </article> : <div className="rounded-3xl bg-[#17132f] p-10 text-center text-white"><h1 className="text-3xl font-black">Where Entertainment Comes Alive</h1><p className="mt-2 text-white/70">Choose an active LIVE session below.</p></div>}
        {notice && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3">{notice}{notice.includes("Add Money") && <Link href="/wallet" className="ml-2 font-bold text-violet-700">Add Money →</Link>}</p>}
        <section className="mt-8"><h2 className="mb-4 text-2xl font-black">Happening now <span className="text-sm font-normal text-black/50">({lives.length})</span></h2>{lives.length ? <div className="grid gap-3 sm:grid-cols-2">{lives.map(item => <button key={item.id} onClick={() => chooseLive(item)} className="rounded-2xl bg-white p-5 text-left shadow-sm"><span className="text-xs font-black text-red-600">● LIVE · {item.viewerCount} watching</span><h3 className="mt-2 text-lg font-bold">{item.title}</h3><p className="text-sm text-black/55">{item.creator.displayName} · @{item.creator.username}</p></button>)}</div> : <p className="rounded-xl bg-white p-5 text-black/60">No creators are live right now.</p>}</section>
      </section>
      <aside className="flex min-h-[420px] flex-col rounded-3xl bg-[#17132f] p-4 text-white"><div className="mb-3 flex justify-between font-bold"><span>LIVE chat</span><span>{live?.viewerCount ?? 0} watching</span></div>{!canUseChat && <p className="mb-3 text-xs text-white/60">Join the LIVE to see chat. Sign in required.</p>}<div className="flex-1 space-y-3 overflow-y-auto">{canUseChat && messages.map(m => <div key={m.id}><b className="text-amber-300">@{m.user.username}</b><p className="break-words text-sm text-white/85">{m.text}</p></div>)}</div>{canUseChat && <form onSubmit={sendChat} className="mt-3 flex gap-2"><input value={chatText} onChange={e => setChatText(e.target.value)} maxLength={500} placeholder="Say something…" className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm outline-none"/><button className="rounded-full bg-amber-400 px-4 font-bold text-black">Send</button></form>}</aside>
    </div>
  </main>;
}
