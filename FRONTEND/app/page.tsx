"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bell, ChevronRight, Compass, Gamepad2, Headphones,
  Heart, Home as HomeIcon, MessageCircle, Music2, Play, Plus, Radio,
  Search, ShoppingBag, Sparkles, Trophy, Users, Wallet, Zap
} from "lucide-react";

type Post = {
  id: string;
  author?: { name?: string; username?: string; avatarUrl?: string };
  content?: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
};

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${API}/api/posts`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.posts)) return data.posts;
    if (Array.isArray(data.data)) return data.data;
  } catch {}
  return [];
}

const nav = [
  ["discover", "Discover", Compass, "/discover"],
  ["live", "LIVE", Radio, "/live"],
  ["play", "Play", Gamepad2, "/games"],
  ["chat", "Chat", MessageCircle, "/messages"],
  ["market", "Market", ShoppingBag, "/marketplace"],
  ["wallet", "Wallet", Wallet, "/wallet"],
] as const;

function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[#1B1734] shadow-lg">
        <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#FF6B6B]" />
        <span className="absolute -bottom-3 -left-2 h-7 w-7 rounded-full bg-[#FFB52E]" />
        <b className="relative text-[13px] tracking-[-.08em] text-white">S20</b>
      </span>
      <b className="text-[22px] tracking-[-.07em] text-[#1B1734]">SIX<span className="text-[#6947F5]">20</span></b>
    </a>
  );
}

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#6947F5]">{eyebrow}</p>
        <h2 className="text-2xl font-black tracking-[-.04em] text-[#1B1734] md:text-3xl">{title}</h2>
      </div>
      {href && <a href={href} className="hidden items-center gap-1 text-sm font-bold text-[#6947F5] sm:flex">Explore <ArrowRight size={16} /></a>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-[#EDE6FF] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#F0ECFF] text-[#6947F5]"><Users size={25} /></div>
      <h3 className="font-black text-[#1B1734]">Your community is waiting.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77728A]">
        Connect the SIX20 backend and real posts will appear here. No fake activity is shown.
      </p>
    </div>
  );
}

export default function Home() {
  const [intro, setIntro] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const seen = sessionStorage.getItem("six20-intro-seen");
    if (seen) setIntro(false);
    else {
      const timer = window.setTimeout(() => {
        sessionStorage.setItem("six20-intro-seen", "1");
        setIntro(false);
      }, 2700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getPosts().then((items) => {
      if (active) {
        setPosts(items);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(p => `${p.content || ""} ${p.author?.name || ""} ${p.author?.username || ""}`.toLowerCase().includes(q));
  }, [posts, search]);

  const experiences = [
    [Radio, "SIX20 LIVE", "Watch live creators and join the conversation.", "/live", "from-[#FFF0EE]"],
    [Gamepad2, "SIX20 PLAY", "Games, challenges and social competition.", "/games", "from-[#F0ECFF]"],
    [Headphones, "SIX20 MUSIC", "Discover sounds, artists and moments.", "#music", "from-[#E8F9F6]"],
    [CalendarIcon, "SIX20 EVENTS", "Find experiences and things happening around you.", "#events", "from-[#FFF5D9]"],
    [ShoppingBag, "SIX20 MARKET", "Products, creators and commerce.", "/marketplace", "from-[#EAF4FF]"],
    [Zap, "SIX20 REWARDS", "Earn through participation, creativity and activity.", "/wallet", "from-[#FFF0E5]"],
  ] as const;

  return (
    <>
      {intro && (
        <div className="six20-intro fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#FFF9F2]">
          <div className="intro-orb one" /><div className="intro-orb two" />
          <div className="relative text-center">
            <div className="mx-auto mb-7 grid h-28 w-28 place-items-center rounded-[34px] bg-[#1B1734] shadow-[0_25px_70px_rgba(105,71,245,.25)]">
              <b className="text-3xl tracking-[-.1em] text-white">SIX<span className="text-[#FF7A66]">20</span></b>
            </div>
            <h1 className="text-5xl font-black tracking-[-.08em] text-[#1B1734]">SIX<span className="text-[#6947F5]">20</span></h1>
            <p className="mt-3 text-xs font-extrabold uppercase tracking-[.28em] text-[#77728A]">Where Entertainment Comes Alive</p>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#FFF9F2] text-[#1B1734]">
        <header className="sticky top-0 z-40 border-b border-[#EEE7DE] bg-[#FFF9F2]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-6 px-4 md:px-8">
            <Logo />
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {nav.map(([id, label, Icon, href]) => (
                <a key={id} href={href} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#625D70] transition hover:bg-white hover:text-[#6947F5]">
                  <Icon size={17} />{label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden h-11 w-56 items-center gap-2 rounded-2xl border border-[#EAE2D9] bg-white px-3 md:flex">
                <Search size={17} className="text-[#9690A3]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SIX20" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#AAA4B0]" />
              </label>
              <a href="/notifications" className="grid h-11 w-11 place-items-center rounded-2xl border border-[#EAE2D9] bg-white text-[#625D70]"><Bell size={19} /></a>
              <a href="/profile" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1B1734] text-sm font-black text-white">S</a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 md:px-8 md:pb-12">
          <section className="relative overflow-hidden rounded-[36px] bg-[#1B1734] px-6 py-8 text-white shadow-[0_30px_80px_rgba(39,28,72,.15)] md:px-10 md:py-12">
            <div className="hero-a" /><div className="hero-b" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[.16em]"><Sparkles size={14} className="text-[#FFB52E]" />Africa&apos;s entertainment universe</div>
                <h1 className="max-w-3xl text-4xl font-black leading-[.98] tracking-[-.06em] md:text-6xl lg:text-7xl">
                  Your world.<span className="block text-[#FFB52E]">Your vibe.</span><span className="block">Live on SIX20.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">Discover people, live moments, games, music, events and opportunities in one entertainment community.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="/live" className="inline-flex items-center gap-2 rounded-2xl bg-[#FF7A66] px-5 py-3.5 text-sm font-black text-white"><Play size={17} fill="currentColor" />Explore LIVE</a>
                  <a href="/discover" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-black text-white ring-1 ring-white/10">Discover SIX20 <ArrowRight size={17} /></a>
                </div>
              </div>
              <div className="relative mx-auto hidden h-[300px] w-full max-w-[470px] lg:block">
                <div className="absolute inset-10 rounded-full border border-white/10" /><div className="absolute inset-16 rounded-full border border-white/10" />
                <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[42px] bg-white text-3xl font-black tracking-[-.08em] text-[#1B1734] shadow-2xl">SIX<span className="text-[#6947F5]">20</span></div>
                <div className="chip c1"><Radio size={15} />LIVE</div><div className="chip c2"><Gamepad2 size={15} />PLAY</div><div className="chip c3"><Music2 size={15} />MUSIC</div><div className="chip c4"><Trophy size={15} />REWARDS</div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <SectionTitle eyebrow="Explore" title="Everything in one universe." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map(([Icon, title, text, href, gradient]) => (
                <a key={title} href={href} className={`group rounded-[28px] border border-[#EEE7DE] bg-gradient-to-br ${gradient} via-white to-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#6947F5] shadow-sm"><Icon size={22} /></div>
                    <ChevronRight size={19} className="text-[#A49EAC] transition group-hover:translate-x-1 group-hover:text-[#6947F5]" />
                  </div>
                  <h3 className="mt-6 font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#77728A]">{text}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <SectionTitle eyebrow="Community" title="What&apos;s happening" href="/discover" />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-[28px] bg-[#F0EAE2]" /><div className="h-48 animate-pulse rounded-[28px] bg-[#F0EAE2]" /></div>
            ) : filtered.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.slice(0, 6).map(post => (
                  <article key={post.id} className="overflow-hidden rounded-[28px] border border-[#EEE7DE] bg-white shadow-sm">
                    {post.imageUrl && <img src={post.imageUrl} alt="" className="h-56 w-full object-cover" />}
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F0ECFF] text-sm font-black text-[#6947F5]">{(post.author?.name || "S").slice(0,1).toUpperCase()}</div>}
                        <div><p className="text-sm font-black">{post.author?.name || "SIX20 creator"}</p><p className="text-xs text-[#9892A2]">{post.author?.username || ""}</p></div>
                      </div>
                      {post.content && <p className="mt-4 text-sm leading-6 text-[#514C5D]">{post.content}</p>}
                      <div className="mt-5 flex gap-5 text-xs font-bold text-[#8A8495]"><span className="inline-flex items-center gap-1"><Heart size={15} />{post.likes || 0}</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} />{post.comments || 0}</span></div>
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyState />}
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[30px] bg-gradient-to-br from-[#E9E2FF] via-white to-[#F7F3FF] p-7 md:p-9">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6947F5] text-white"><Trophy size={23} /></div>
              <h2 className="mt-7 text-3xl font-black tracking-[-.05em]">Play. Participate. Earn.</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#6E687C]">SIX20 is designed for participation, eligible rewards, affiliate activity and creator opportunities.</p>
              <a href="/wallet" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1B1734] px-5 py-3 text-sm font-black text-white">Explore rewards <ArrowRight size={17} /></a>
            </div>
            <div className="rounded-[30px] bg-gradient-to-br from-[#FFF0E8] via-white to-[#E9FBF8] p-7 md:p-9">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF7A66] text-white"><Plus size={23} /></div>
              <h2 className="mt-7 text-3xl font-black tracking-[-.05em]">Your next audience is here.</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#6E687C]">Build a creator identity, publish content, go live and turn your community into an entertainment experience.</p>
              <a href="/profile" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#FF7A66] px-5 py-3 text-sm font-black text-white">Open creator space <ArrowRight size={17} /></a>
            </div>
          </section>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EAE2D9] bg-[#FFF9F2]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {[
              { id: "home", label: "Home", icon: HomeIcon, href: "/" },
              { id: "discover", label: "Discover", icon: Compass, href: "/discover" },
              { id: "live", label: "Live", icon: Radio, href: "/live" },
              { id: "play", label: "Play", icon: Gamepad2, href: "/games" },
              { id: "chat", label: "Chat", icon: MessageCircle, href: "/messages" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold text-[#77728A]"
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </main>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #fff9f2; }
        .six20-intro { animation: introOut .7s ease 2.05s forwards; }
        .intro-orb { position:absolute; border-radius:999px; filter:blur(5px); opacity:.75; animation:orbFloat 5s ease-in-out infinite; }
        .intro-orb.one { width:280px;height:280px;left:12%;top:15%;background:#ffb52e; }
        .intro-orb.two { width:330px;height:330px;right:8%;bottom:5%;background:#b9a8ff;animation-delay:-2s; }
        .hero-a,.hero-b { position:absolute;border-radius:999px;pointer-events:none;filter:blur(2px); }
        .hero-a { width:300px;height:300px;right:-70px;top:-110px;background:radial-gradient(circle,rgba(255,122,102,.8),transparent 65%); }
        .hero-b { width:350px;height:350px;right:22%;bottom:-250px;background:radial-gradient(circle,rgba(105,71,245,.7),transparent 65%); }
        .chip { position:absolute;display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.09);padding:9px 12px;border-radius:15px;font-size:11px;font-weight:900;backdrop-filter:blur(10px);animation:chipFloat 4s ease-in-out infinite; }
        .c1{left:4%;top:18%;color:#ff9b8b}.c2{right:3%;top:26%;color:#b7a7ff;animation-delay:-.8s}.c3{left:9%;bottom:15%;color:#75e2d2;animation-delay:-1.6s}.c4{right:10%;bottom:10%;color:#ffd26a;animation-delay:-2.4s}
        @keyframes introOut{to{opacity:0;visibility:hidden;pointer-events:none}}
        @keyframes orbFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(25px,-20px,0) scale(1.08)}}
        @keyframes chipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.six20-intro{animation:introOut .2s ease forwards}.intro-orb,.chip{animation:none}}
      `}</style>
    </>
  );
}

function CalendarIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
