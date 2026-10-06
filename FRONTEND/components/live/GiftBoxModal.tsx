"use client";

import { createPortal } from "react-dom";
import { Gift, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type GiftItem = { id: number; name: string; category?: string; rarity?: string; description?: string; imageUrl?: string | null; thumbnailUrl?: string | null; animationUrl?: string | null; priceKobo: number; isFeatured?: boolean; brand?: string | null; team?: string | null; country?: string | null; licenseStatus?: string };
const naira = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(kobo / 100);
const heritageArtwork: Record<string, string> = {
  "afro-spark": "afro-spark", "drum-pulse": "drum-pulse", "adire-flow": "adire-flow",
  "golden-calabash": "golden-calabash", "baobab-bloom": "baobab-bloom", "sankofa-flight": "sankofa-flight",
  "african-sun": "african-sun", "aso-oke-royale": "aso-oke-royale", "heritage-crown": "heritage-crown",
  "golden-continent": "golden-continent", "six20-legacy": "six20-legacy", "six20-universe": "six20-universe",
};
const categoryArtwork: Record<string, string> = {
  AFRICAN_HERITAGE: "african-heritage", TASTE_OF_AFRICA: "taste-of-africa",
  AFRICAN_FOOTBALL: "african-football", EUROPEAN_FOOTBALL: "european-football",
  SPORTS: "sports", FAN_BATTLES: "fan-battles", PREMIUM: "premium", LEGENDARY: "legendary",
};
function localGiftArtwork(gift: GiftItem) {
  const slug = gift.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/gifts/${heritageArtwork[slug] || categoryArtwork[gift.category || ""] || "gift-default"}.svg`;
}
const categories = ["TRENDING", "AFRICAN_HERITAGE", "TASTE_OF_AFRICA", "AFRICAN_FOOTBALL", "EUROPEAN_FOOTBALL", "SPORTS", "FAN_BATTLES", "PREMIUM", "LEGENDARY"];
const labels: Record<string, string> = { TRENDING: "Trending", AFRICAN_HERITAGE: "African Heritage", TASTE_OF_AFRICA: "Taste of Africa", AFRICAN_FOOTBALL: "African Football", EUROPEAN_FOOTBALL: "European Football", SPORTS: "Sports", FAN_BATTLES: "Fan Battles", PREMIUM: "Premium", LEGENDARY: "Legendary", RECENT: "Recently used", POPULAR: "Popular" };

export default function GiftBoxModal({ gifts, balance, selectedId, quantity, busy, onSelect, onQuantity, onClose, onSend }: {
  gifts: GiftItem[]; balance: number | null; selectedId: string; quantity: number; busy: boolean;
  onSelect: (id: string) => void; onQuantity: (quantity: number) => void; onClose: () => void; onSend: () => void;
}) {
  const [tab, setTab] = useState("TRENDING");
  const [search, setSearch] = useState("");
  const [popular, setPopular] = useState<number[]>([]);
  const [recent, setRecent] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [finalText, setFinalText] = useState("");
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("six20-recent-gifts") || "[]").filter(Number.isSafeInteger)); } catch { setRecent([]); }
    apiFetch("/api/gifts?sort=popular").then((response) => setPopular((response.gifts || []).map((gift: GiftItem) => gift.id))).catch(() => {});
  }, []);
  const selected = gifts.find((gift) => String(gift.id) === selectedId);
  const total = selected ? selected.priceKobo * quantity : 0;
  const filtered = useMemo(() => {
    let items = gifts;
    if (tab === "TRENDING") items = items.filter((gift) => gift.isFeatured || ["PREMIUM", "LEGENDARY"].includes(gift.category || "") || gift.priceKobo <= 200_000);
    else if (tab === "POPULAR") items = [...items].sort((a, b) => (popular.indexOf(a.id) < 0 ? 9999 : popular.indexOf(a.id)) - (popular.indexOf(b.id) < 0 ? 9999 : popular.indexOf(b.id)));
    else if (tab === "RECENT") items = [...items].sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id)).filter((gift) => recent.includes(gift.id));
    else items = items.filter((gift) => gift.category === tab);
    const term = search.trim().toLowerCase();
    return term ? items.filter((gift) => `${gift.name} ${gift.description || ""} ${gift.country || ""} ${gift.team || ""}`.toLowerCase().includes(term)) : items;
  }, [gifts, tab, search, popular, recent]);
  if (typeof document === "undefined") return null;
  const requestSend = () => {
    if (total >= 100_000_000 && finalText !== "CONFIRM") return;
    setConfirming(false); setFinalText(""); onSend();
  };
  const needsConfirmation = total >= 10_000_000;
  const strongConfirmation = total >= 50_000_000;
  const finalConfirmation = total >= 100_000_000;
  return createPortal(<div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Send a LIVE gift">
    <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Close gifts" />
    <section className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-amber-200/20 bg-[#100c20] p-4 shadow-[0_0_80px_rgba(217,119,6,.18)] sm:rounded-[28px] sm:p-6" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <header className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300/30 to-fuchsia-500/20 text-amber-200"><Gift /></div><div><h2 className="text-lg font-black">Gift Universe</h2><p className="text-xs text-white/55">Celebrate this moment with the creator</p></div></div><button onClick={onClose} type="button" className="rounded-xl p-2 text-white/70 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Close gifts"><X /></button></header>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3"><span className="text-xs font-bold text-white/60">AVAILABLE BALANCE</span><span className="font-black text-amber-200">{balance === null ? "Loading…" : naira(balance)}</span></div>
      <label className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-white/60"><Search size={17} /><input aria-label="Search gifts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search gifts, teams, countries…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" /></label>
      <nav aria-label="Gift categories" className="mb-4 flex gap-2 overflow-x-auto pb-2">{["TRENDING", "RECENT", "POPULAR", ...categories.filter((category) => category !== "TRENDING")].map((category) => <button key={category} type="button" onClick={() => setTab(category)} className={`min-h-10 shrink-0 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${tab === category ? "border-amber-200 bg-amber-200/15 text-amber-100" : "border-white/10 bg-white/[.03] text-white/65"}`}>{labels[category]}</button>)}</nav>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{filtered.map((gift) => <button key={gift.id} type="button" aria-pressed={selectedId === String(gift.id)} onClick={() => { onSelect(String(gift.id)); setConfirming(false); setFinalText(""); }} className={`min-h-28 rounded-2xl border p-3 text-left transition motion-reduce:transition-none active:scale-[.98] ${selectedId === String(gift.id) ? "border-amber-200 bg-amber-300/10 shadow-[0_0_24px_rgba(251,191,36,.13)]" : "border-white/10 bg-white/[.035] hover:border-fuchsia-300/40"}`}>
        <img src={localGiftArtwork(gift)} alt={`${gift.name} gift artwork`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/gifts/gift-default.svg"; }} className="mb-2 h-14 w-14 rounded-xl border border-amber-100/15 object-cover shadow-[0_4px_18px_rgba(0,0,0,.3)]" />
        <div className="line-clamp-1 text-sm font-black">{gift.name}</div><div className="mt-1 text-xs text-amber-100/80">{naira(gift.priceKobo)}</div>{gift.team && <div className="mt-1 text-[10px] text-white/45">{gift.licenseStatus === "ACTIVE" ? `Licensed · ${gift.brand || gift.team}` : `Original fan design · ${gift.country || ""}`}</div>}
      </button>)}</div>
      {!filtered.length && <p className="rounded-xl border border-white/10 p-6 text-center text-sm text-white/55">No gifts in this collection yet.</p>}
      <footer className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#100c20]/95 pt-4 backdrop-blur"><label className="flex items-center gap-2 text-xs text-white/60">Quantity<input aria-label="Gift quantity" type="number" min={1} max={100} value={quantity} onChange={(event) => onQuantity(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white" /></label><span className="mr-auto text-sm font-black text-amber-100">{selected ? naira(total) : "Select a gift"}</span>
        {needsConfirmation && confirming ? <div className="w-full rounded-xl border border-amber-200/30 bg-amber-200/10 p-3 text-sm text-amber-50" role="alert"><p className="font-bold">{finalConfirmation ? "Final confirmation: this gift costs at least ₦1,000,000." : strongConfirmation ? "High value gift: review this ₦500,000+ purchase." : "Confirm this ₦100,000+ gift purchase."}</p>{finalConfirmation && <input aria-label="Type CONFIRM for final gift purchase" value={finalText} onChange={(event) => setFinalText(event.target.value.toUpperCase())} placeholder="Type CONFIRM" className="mt-2 min-h-10 w-full rounded-lg bg-black/30 px-3 text-white" />}<button type="button" onClick={requestSend} disabled={busy || (finalConfirmation && finalText !== "CONFIRM")} className="mt-2 min-h-11 w-full rounded-xl bg-amber-300 px-4 font-black text-[#1a1022] disabled:opacity-40">{finalConfirmation ? "Confirm final purchase" : "Confirm gift purchase"}</button><button type="button" onClick={() => setConfirming(false)} className="mt-2 min-h-10 w-full rounded-xl border border-white/15">Go back</button></div> : <button type="button" disabled={busy || !selected} onClick={() => needsConfirmation ? setConfirming(true) : requestSend()} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 font-black text-[#1a1022] shadow-lg shadow-amber-900/20 disabled:opacity-40"><Sparkles size={17} />{busy ? "Sending…" : "Send gift"}</button>}
      </footer>
    </section>
  </div>, document.body);
}
