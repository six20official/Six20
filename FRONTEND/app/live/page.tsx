"use client";

import {
  ArrowLeft,
  Flame,
  Gamepad2,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Radio,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const liveRooms = [
  {
    creator: "Maya Vibes",
    username: "@mayavibes",
    category: "Music",
    viewers: "12.8K",
    title: "Afrobeats After Dark",
    avatar: "MV",
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
    badge: "HOT",
  },
  {
    creator: "Kenny Live",
    username: "@kennylive",
    category: "Entertainment",
    viewers: "8.4K",
    title: "Guess The Song",
    avatar: "KL",
    gradient: "from-orange-400 via-pink-500 to-red-500",
    badge: "LIVE",
  },
  {
    creator: "Tomi Kitchen",
    username: "@tomikitchen",
    category: "Food",
    viewers: "5.7K",
    title: "Street Food Challenge",
    avatar: "TK",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    badge: "NEW",
  },
];

const reactions = ["❤️", "🔥", "😂", "👏", "😍", "💎"];

export default function LivePage() {
  const [liked, setLiked] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#17132f]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#fffdf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17132f] text-white transition hover:scale-105"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">
                  SIX20
                </span>
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black text-white">
                  LIVE
                </span>
              </div>
              <p className="hidden text-xs text-black/45 sm:block">
                Watch. Play. Connect.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 md:flex">
            <Search size={16} className="text-black/35" />
            <input
              placeholder="Find live rooms..."
              className="w-52 bg-transparent text-sm outline-none placeholder:text-black/35"
            />
          </div>

          <Link
            href="/wallet"
            className="flex items-center gap-2 rounded-full bg-[#17132f] px-4 py-2 text-sm font-bold text-white"
          >
            <Zap size={15} className="text-[#ffc83d]" />
            <span className="hidden sm:inline">Rewards</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Live hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#17132f] p-5 text-white md:p-8">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_0.7fr]">
            {/* Main stream */}
            <div className="overflow-hidden rounded-[26px] bg-black">
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute left-[15%] top-[15%] h-40 w-40 rounded-full bg-orange-400 blur-3xl" />
                  <div className="absolute bottom-[10%] right-[15%] h-48 w-48 rounded-full bg-cyan-300 blur-3xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/15 text-3xl font-black backdrop-blur-xl">
                      MV
                    </div>
                    <p className="text-2xl font-black md:text-4xl">
                      Afrobeats After Dark
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Maya Vibes is live now
                    </p>
                  </div>
                </div>

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black">
                  <Radio size={13} />
                  LIVE
                </div>

                <div className="absolute right-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  12.8K watching
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["AB", "JD", "KO", "TY"].map((x) => (
                        <div
                          key={x}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#17132f] text-[9px] font-black"
                        >
                          {x}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white/80">
                      +12.8K people
                    </span>
                  </div>

                  <button
                    onClick={() => setLiked(!liked)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${
                      liked
                        ? "bg-pink-500 text-white"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={liked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              {/* Stream controls */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0d0b1d] p-3">
                <button
                  onClick={() => setGameOpen(!gameOpen)}
                  className="flex items-center gap-2 rounded-full bg-[#6c3bff] px-4 py-2.5 text-xs font-black transition hover:scale-[1.03]"
                >
                  <Gamepad2 size={15} />
                  PLAY LUDO
                </button>

                <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/15">
                  <GiftIcon />
                  Gift
                </button>

                <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/15">
                  <Share2 size={15} />
                  Share
                </button>

                <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="flex min-h-[420px] flex-col rounded-[26px] bg-white/10 p-4 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black">Live Chat</p>
                  <p className="text-xs text-white/45">
                    12,846 people are here
                  </p>
                </div>

                <Users size={18} className="text-white/50" />
              </div>

              <div className="flex-1 space-y-4 overflow-hidden">
                <ChatMessage name="Tayo" message="This vibe is crazy 🔥" />
                <ChatMessage name="Amaka" message="Maya!!! ❤️❤️❤️" />
                <ChatMessage name="Jay" message="Let's play Ludo!" />
                <ChatMessage name="Kenny" message="Who is winning today 😂" />
                <ChatMessage name="Femi" message="SIX20 is different!" />
                <ChatMessage name="Zee" message="Drop the song name!" />
              </div>

              <div className="mt-4 flex gap-2">
                <div className="flex flex-1 items-center rounded-full bg-white/10 px-4">
                  <input
                    placeholder="Say something..."
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/35"
                  />
                </div>
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffc83d] text-[#17132f]">
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded game */}
        {gameOpen && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-[#6c3bff]/15 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Gamepad2 size={21} className="text-[#6c3bff]" />
                  <h2 className="text-xl font-black">Ludo Battle</h2>
                </div>
                <p className="mt-1 text-sm text-black/45">
                  Play directly inside Maya's live session.
                </p>
              </div>

              <Link
                href="/games"
                className="rounded-full bg-[#6c3bff] px-5 py-3 text-sm font-black text-white"
              >
                Enter Game Arena
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 rounded-3xl bg-[#17132f] p-4 sm:grid-cols-8">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md ${
                    i % 17 === 0
                      ? "bg-[#ffc83d]"
                      : i % 13 === 0
                        ? "bg-[#18d9c5]"
                        : i % 11 === 0
                          ? "bg-[#ff4fa3]"
                          : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other live rooms */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-black text-[#ff4fa3]">
                <Flame size={16} />
                HAPPENING NOW
              </p>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                More live rooms
              </h2>
            </div>

            <button className="text-sm font-black text-[#6c3bff]">
              See all
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {liveRooms.map((room) => (
              <button
                key={room.creator}
                className="group overflow-hidden rounded-[26px] bg-white text-left shadow-[0_10px_40px_rgba(23,19,47,0.07)] transition hover:-translate-y-1"
              >
                <div
                  className={`relative aspect-[16/10] bg-gradient-to-br ${room.gradient}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-black text-white backdrop-blur-xl">
                      {room.avatar}
                    </div>
                  </div>

                  <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black text-white">
                    {room.badge}
                  </span>

                  <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                    {room.viewers} watching
                  </span>
                </div>

                <div className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6c3bff]">
                      {room.category}
                    </span>
                    <Sparkles size={14} className="text-[#ffc83d]" />
                  </div>
                  <h3 className="font-black">{room.title}</h3>
                  <p className="mt-1 text-sm text-black/45">
                    {room.creator} · {room.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Feature strip */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Gamepad2 />}
            title="Play together"
            text="Games live inside the stream."
          />
          <Feature
            icon={<Trophy />}
            title="Earn rewards"
            text="Turn participation into rewards."
          />
          <Feature
            icon={<ShoppingBag />}
            title="Shop the vibe"
            text="Discover products without leaving."
          />
        </section>
      </div>
    </main>
  );
}

function ChatMessage({
  name,
  message,
}: {
  name: string;
  message: string;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6c3bff] to-[#ff4fa3] text-[9px] font-black">
        {name.slice(0, 2).toUpperCase()}
      </div>

      <div>
        <p className="text-[11px] font-black text-[#ffc83d]">{name}</p>
        <p className="text-sm text-white/75">{message}</p>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0ebff] text-[#6c3bff]">
        {icon}
      </div>
      <div>
        <p className="font-black">{title}</p>
        <p className="text-sm text-black/45">{text}</p>
      </div>
    </div>
  );
}

function GiftIcon() {
  return <span className="text-sm">🎁</span>;
}