"use client";

import { useEffect, useState } from "react";

export type LiveGiftEffect = {
  eventId: string;
  senderUsername: string;
  giftName: string;
  giftIcon?: string | null;
  giftAnimationUrl?: string | null;
  rarity?: string;
  quantity: number;
  totalKobo: number;
  creatorEarnKobo: number;
};

const rarityStyle: Record<string, string> = {
  common: "border-white/20 from-slate-900/95 to-violet-950/90",
  rare: "border-sky-300/50 from-sky-950/95 to-indigo-950/90",
  epic: "border-fuchsia-300/60 from-fuchsia-950/95 to-violet-950/90",
  legendary: "border-amber-200/80 from-amber-950/95 to-fuchsia-950/90",
};

export default function GiftOverlay({ gift, isCreator = false, onComplete }: { gift: LiveGiftEffect | null; isCreator?: boolean; onComplete: () => void }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (!gift) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const timer = window.setTimeout(onComplete, media.matches ? 1800 : gift.rarity === "legendary" ? 6800 : 4800);
    return () => window.clearTimeout(timer);
  }, [gift, onComplete]);
  if (!gift) return null;
  const rarity = gift.rarity?.toLowerCase() || "common";
  const cinematic = rarity === "epic" || rarity === "legendary";
  const currency = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(kobo / 100);

  return <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-live="polite" aria-atomic="true">
    {cinematic && !reducedMotion && <div className="absolute inset-0 animate-[gift-flash_1.4s_ease-out_2] motion-reduce:animate-none bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,.3),transparent_60%)]" />}
    {!reducedMotion && Array.from({ length: cinematic ? 14 : 6 }, (_, index) => <span key={index} className="absolute animate-[gift-particle_2.4s_ease-out_forwards] motion-reduce:animate-none text-amber-200" style={{ left: `${8 + ((index * 37) % 84)}%`, top: `${26 + ((index * 19) % 48)}%`, animationDelay: `${(index % 6) * 70}ms` }}>✦</span>)}
    <div className={`absolute left-1/2 top-[38%] w-[min(88%,420px)] -translate-x-1/2 ${reducedMotion ? "" : "animate-[gift-arrive_.5s_cubic-bezier(.2,.8,.2,1)_both] motion-reduce:animate-none"} rounded-3xl border bg-gradient-to-br p-4 text-center text-white shadow-[0_25px_80px_rgba(0,0,0,.6)] ${rarityStyle[rarity] || rarityStyle.common} ${cinematic ? "ring-2 ring-amber-200/30" : ""}`}>
      <div className="flex items-center justify-center gap-3">
        {gift.giftAnimationUrl && !reducedMotion ? <video src={gift.giftAnimationUrl} autoPlay loop muted playsInline preload="none" className="h-16 w-16 rounded-2xl object-cover drop-shadow-[0_0_20px_rgba(251,191,36,.55)]" /> : gift.giftIcon ? <img src={gift.giftIcon} alt="" className="h-16 w-16 rounded-2xl object-cover drop-shadow-[0_0_20px_rgba(251,191,36,.55)]" /> : <span aria-hidden="true" className="text-5xl">🎁</span>}
        <div className="text-left"><div className="text-xs font-black uppercase tracking-[.2em] text-amber-200">{rarity} gift</div><div className="text-xl font-black">{gift.giftName}{gift.quantity > 1 ? ` × ${gift.quantity}` : ""}</div></div>
      </div>
      <div className="mt-3 text-sm font-bold"><span className="text-fuchsia-200">@{gift.senderUsername}</span> sent a gift</div>
      <div className="mt-1 text-xs text-white/65">Gift value {currency(gift.totalKobo)}{isCreator ? ` · You earned ${currency(gift.creatorEarnKobo)}` : ""}</div>
    </div>
  </div>;
}
