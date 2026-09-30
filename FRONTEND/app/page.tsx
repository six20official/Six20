"use client";

import {
  ArrowRight,
  Bell,
  ChevronRight,
  Compass,
  Gamepad2,
  Heart,
  Home,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Radio,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Zap,
  Flame,
  Gift,
  Star,
} from "lucide-react";

const liveRooms = [
  {
    name: "Afro Night",
    creator: "Kenny Vibes",
    viewers: "12.8K",
    emoji: "🎤",
    color: "bg-[#FF6B35]",
  },
  {
    name: "Lagos Lounge",
    creator: "Teni Talks",
    viewers: "8.4K",
    emoji: "🎙️",
    color: "bg-[#6C3BFF]",
  },
  {
    name: "Game Arena",
    creator: "JayPlay",
    viewers: "6.2K",
    emoji: "🎮",
    color: "bg-[#18D9C5]",
  },
  {
    name: "Music Room",
    creator: "DJ Kross",
    viewers: "4.9K",
    emoji: "🎧",
    color: "bg-[#FF4FA3]",
  },
];

const vibes = [
  ["🔥", "Trending", "#FFF0E8"],
  ["🎵", "Music", "#E9F9F6"],
  ["😂", "Fun", "#FFF5D7"],
  ["🎮", "Games", "#EEE9FF"],
  ["🏆", "Challenges", "#FFE9F2"],
];

const games = [
  {
    title: "Ludo Arena",
    description: "Challenge friends while watching LIVE.",
    icon: "🎲",
    color: "from-[#6C3BFF] to-[#9A7BFF]",
  },
  {
    title: "SIX20 Quiz",
    description: "Fast questions. Real competition.",
    icon: "⚡",
    color: "from-[#FF6B35] to-[#FF9B6B]",
  },
  {
    title: "Creator Battle",
    description: "Choose your side and play.",
    icon: "🏆",
    color: "from-[#18BFAF] to-[#5DE8D8]",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFDF8] text-[#17132F]">
      {/* AMBIENT BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[120px] h-[420px] w-[420px] rounded-full bg-[#E8DEFF] blur-[100px] opacity-70 animate-float" />
        <div className="absolute right-[-180px] top-[500px] h-[420px] w-[420px] rounded-full bg-[#FFE0D3] blur-[100px] opacity-70 animate-float-slow" />
        <div className="absolute bottom-[-180px] left-[35%] h-[400px] w-[400px] rounded-full bg-[#D9FAF5] blur-[110px] opacity-60" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#FFFDF8]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center gap-5 px-5 lg:px-10">
          {/* LOGO */}
          <a href="/" className="group flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-[17px] bg-[#17132F] shadow-xl transition duration-500 group-hover:rotate-6 group-hover:scale-105">
              <div className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-[#FF6B35]" />
              <div className="absolute -bottom-3 -left-2 h-7 w-7 rounded-full bg-[#FFC83D]" />
              <span className="relative text-sm font-black tracking-[-.1em] text-white">
                S20
              </span>
            </div>

            <span className="text-[25px] font-black tracking-[-.08em]">
              SIX<span className="text-[#6C3BFF]">20</span>
            </span>
          </a>

          {/* DESKTOP NAV */}
          <nav className="ml-8 hidden items-center gap-1 xl:flex">
            {[
              ["Discover", Compass, "/discover"],
              ["LIVE", Radio, "/live"],
              ["Play", Gamepad2, "/games"],
              ["Chat", MessageCircle, "/messages"],
              ["Market", ShoppingBag, "/marketplace"],
            ].map(([label, Icon, href]) => (
              <a
                key={String(label)}
                href={String(href)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#716B80] transition hover:bg-white hover:text-[#6C3BFF]"
              >
                <Icon size={17} />
                {String(label)}
              </a>
            ))}
          </nav>

          {/* SEARCH */}
          <div className="ml-auto hidden h-11 w-[240px] items-center gap-2 rounded-2xl border border-black/[0.07] bg-white px-3 md:flex">
            <Search size={17} className="text-[#9B95A8]" />
            <input
              placeholder="Search SIX20"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#A9A3B2]"
            />
          </div>

          <a
            href="/notifications"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-black/[0.07] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Bell size={18} />
          </a>

          <a
            href="/profile"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17132F] text-sm font-black text-white shadow-lg"
          >
            S
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 pb-28 pt-7 lg:px-10">
        {/* HERO / SIX20 PULSE */}
        <section className="relative overflow-hidden rounded-[42px] bg-[#17132F] px-6 py-8 text-white shadow-[0_30px_100px_rgba(23,19,47,.18)] md:px-10 md:py-12 lg:min-h-[500px]">
          {/* GLOW */}
          <div className="absolute -right-24 -top-32 h-[430px] w-[430px] rounded-full bg-[#6C3BFF] opacity-40 blur-[30px] animate-pulse" />
          <div className="absolute -bottom-48 left-[35%] h-[400px] w-[400px] rounded-full bg-[#FF6B35] opacity-30 blur-[50px]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_500px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.15em] backdrop-blur-xl">
                <Sparkles size={14} className="text-[#FFC83D]" />
                Africa's entertainment universe
              </div>

              <h1 className="max-w-3xl text-5xl font-black leading-[.94] tracking-[-.065em] md:text-7xl">
                Don't just
                <span className="block text-[#FFC83D]">watch.</span>
                <span className="block">Be part of it.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 md:text-base">
                Live. Play. Connect. Create. Shop. Earn.
                <br />
                One universe. One pulse. Your SIX20.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/live"
                  className="group flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3.5 text-sm font-black shadow-lg shadow-[#FF6B35]/20 transition hover:-translate-y-1"
                >
                  <Radio size={17} />
                  Enter LIVE
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </a>

                <a
                  href="/games"
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-black ring-1 ring-white/10 transition hover:bg-white/15"
                >
                  <Gamepad2 size={17} />
                  Play something
                </a>
              </div>
            </div>

            {/* PULSE */}
            <div className="relative mx-auto h-[390px] w-full max-w-[480px]">
              <div className="absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-pulse-ring" />
              <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

              <div className="absolute left-1/2 top-1/2 z-10 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[42px] bg-white text-3xl font-black tracking-[-.1em] text-[#17132F] shadow-[0_30px_80px_rgba(0,0,0,.25)] transition duration-500 hover:scale-110">
                SIX<span className="text-[#6C3BFF]">20</span>
              </div>

              <PulseBubble
                className="left-2 top-[18%]"
                icon="🔴"
                label="LIVE"
                value="12.8K"
              />

              <PulseBubble
                className="right-0 top-[28%]"
                icon="🎮"
                label="PLAY"
                value="2.4K"
              />

              <PulseBubble
                className="bottom-[15%] left-[8%]"
                icon="🎵"
                label="MUSIC"
                value="LIVE"
              />

              <PulseBubble
                className="bottom-[8%] right-[5%]"
                icon="🏆"
                label="REWARD"
                value="+420"
              />

              <div className="absolute left-1/2 top-0 -translate-x-1/2 text-xs font-black uppercase tracking-[.3em] text-white/40">
                SIX20 PULSE
              </div>
            </div>
          </div>
        </section>

        {/* QUICK VIBES */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#6C3BFF]">
                Choose your energy
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">
                What's your vibe?
              </h2>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {vibes.map(([emoji, label, bg]) => (
              <button
                key={String(label)}
                style={{ background: String(bg) }}
                className="flex min-w-[145px] items-center gap-3 rounded-[22px] border border-black/[0.04] px-4 py-4 text-left font-black shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-2xl">{String(emoji)}</span>
                <span>{String(label)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* LIVE ROOMS */}
        <section className="mt-12">
          <SectionHeading
            eyebrow="Happening now"
            title="LIVE rooms"
            href="/live"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {liveRooms.map((room, index) => (
              <a
                href="/live"
                key={room.name}
                className="group relative overflow-hidden rounded-[30px] bg-[#17132F] p-5 text-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${room.color} opacity-50 blur-2xl`}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-[#FF4D5F] px-3 py-1.5 text-[10px] font-black">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    LIVE
                  </div>

                  <span className="text-xs font-bold text-white/60">
                    {room.viewers}
                  </span>
                </div>

                <div className="relative mt-8 flex h-28 items-center justify-center">
                  <div
                    className={`grid h-24 w-24 place-items-center rounded-full ${room.color} text-5xl shadow-2xl transition duration-500 group-hover:scale-110`}
                  >
                    {room.emoji}
                  </div>
                </div>

                <div className="relative mt-5">
                  <p className="text-lg font-black">{room.name}</p>
                  <p className="mt-1 text-xs text-white/55">
                    @{room.creator}
                  </p>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-bold text-white/60">
                    Join room
                  </span>
                  <ChevronRight size={17} />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* PLAY */}
        <section className="mt-12">
          <SectionHeading
            eyebrow="Play together"
            title="Entertainment that moves"
            href="/games"
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {games.map((game) => (
              <a
                href="/games"
                key={game.title}
                className={`group relative overflow-hidden rounded-[30px] bg-gradient-to-br ${game.color} p-7 text-white transition duration-500 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">
                  <div className="text-5xl transition duration-500 group-hover:scale-110">
                    {game.icon}
                  </div>

                  <h3 className="mt-7 text-2xl font-black tracking-[-.04em]">
                    {game.title}
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
                    {game.description}
                  </p>

                  <div className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-black backdrop-blur">
                    Play now
                    <ArrowRight size={15} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* DISCOVER + REWARD */}
        <section className="mt-12 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="relative overflow-hidden rounded-[34px] bg-[#F0ECFF] p-7 md:p-9">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#BBA9FF] opacity-40 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6C3BFF] text-white">
                  <Compass size={23} />
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#6C3BFF]">
                  Discover
                </span>
              </div>

              <h2 className="mt-8 max-w-xl text-4xl font-black tracking-[-.06em]">
                Find your people.
                <span className="text-[#6C3BFF]"> Find your world.</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#655E78]">
                Discover creators, conversations, music, communities,
                businesses and experiences that match your energy.
              </p>

              <a
                href="/discover"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#17132F] px-5 py-3.5 text-sm font-black text-white"
              >
                Explore Discover
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] bg-[#FFF0E7] p-7 md:p-9">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF6B35] text-white">
              <Gift size={22} />
            </div>

            <h2 className="mt-7 text-3xl font-black tracking-[-.05em]">
              Your SIX20
              <span className="text-[#FF6B35]"> rewards.</span>
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#756D76]">
              Participate, create, invite and earn eligible rewards.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8B8490]">
                  Pulse points
                </span>
                <Zap size={16} className="text-[#FF6B35]" />
              </div>
              <p className="mt-1 text-3xl font-black">2,420</p>
            </div>

            <a
              href="/wallet"
              className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#FF6B35]"
            >
              Open wallet
              <ArrowRight size={15} />
            </a>
          </div>
        </section>

        {/* CREATOR CTA */}
        <section className="relative mt-12 overflow-hidden rounded-[36px] bg-[#17132F] p-8 text-white md:p-12">
          <div className="absolute right-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-[#6C3BFF] opacity-40 blur-[70px]" />
          <div className="absolute bottom-[-150px] left-[40%] h-[300px] w-[300px] rounded-full bg-[#FF6B35] opacity-25 blur-[60px]" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                <Star size={13} className="text-[#FFC83D]" />
                Creator universe
              </div>

              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-.06em] md:text-5xl">
                Your audience isn't just watching.
                <span className="text-[#FFC83D]"> They're playing with you.</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                Go LIVE, launch games, build your community, share products,
                create experiences and unlock eligible earning opportunities.
              </p>
            </div>

            <a
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-4 text-sm font-black shadow-xl transition hover:-translate-y-1"
            >
              <Plus size={18} />
              Create on SIX20
            </a>
          </div>
        </section>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06] bg-[#FFFDF8]/95 px-2 py-2 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          <MobileNav icon={Home} label="Home" href="/" active />
          <MobileNav icon={Compass} label="Discover" href="/discover" />
          <MobileNav icon={Radio} label="LIVE" href="/live" />
          <MobileNav icon={Gamepad2} label="Play" href="/games" />
          <MobileNav icon={MessageCircle} label="Chat" href="/messages" />
        </div>
      </nav>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #fffdf8;
        }

        @keyframes float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(20px, -25px, 0);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-25px, 20px, 0);
          }
        }

        @keyframes pulseRing {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.25;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.25;
          }
        }

        .animate-float {
          animation: float 7s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: floatSlow 9s ease-in-out infinite;
        }

        .animate-pulse-ring {
          animation: pulseRing 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}

function PulseBubble({
  icon,
  label,
  value,
  className,
}: {
  icon: string;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`absolute z-20 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-xl ${className}`}
    >
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-white/50">
          {label}
        </p>
        <p className="text-xs font-black">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#6C3BFF]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">
          {title}
        </h2>
      </div>

      <a
        href={href}
        className="hidden items-center gap-1 text-sm font-black text-[#6C3BFF] sm:flex"
      >
        See all
        <ArrowRight size={15} />
      </a>
    </div>
  );
}

function MobileNav({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: typeof Home;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-black ${
        active ? "text-[#6C3BFF]" : "text-[#817A8D]"
      }`}
    >
      <Icon size={19} />
      <span>{label}</span>
    </a>
  );
}