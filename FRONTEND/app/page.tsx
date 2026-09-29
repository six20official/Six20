"use client";

import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Check,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  Gamepad2,
  Heart,
  Home as HomeIcon,
  LogIn,
  LogOut,
  MessageCircle,
  Play,
  Plus,
  Radio,
  Search,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  username: string;
};

type Video = {
  id: number;
  creator: string;
  username: string;
  caption: string;
  image: string;
  likes: string;
  comments: string;
  category: string;
  live?: boolean;
};

const videos: Video[] = [
  {
    id: 1,
    creator: "Lagos Lifestyle",
    username: "@lagoslifestyle",
    caption: "Lagos nights just hit different 🇳🇬✨ Who's outside tonight?",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85",
    likes: "24.8K",
    comments: "1.2K",
    category: "Lagos",
  },
  {
    id: 2,
    creator: "Naija Culture",
    username: "@naijaculture",
    caption: "Celebrating our beautiful Nigerian culture ❤️💚",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85",
    likes: "18.4K",
    comments: "734",
    category: "Culture",
  },
  {
    id: 3,
    creator: "Afrobeats Daily",
    username: "@afrobeatsdaily",
    caption: "The sound of Africa is taking over the world 🔥🎵",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=85",
    likes: "36.2K",
    comments: "2.1K",
    category: "Music",
  },
  {
    id: 4,
    creator: "Naija Food Plug",
    username: "@naijafoodplug",
    caption: "Jollof rice supremacy! 🍚🔥 Rate this plate from 1-10.",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85",
    likes: "12.7K",
    comments: "982",
    category: "Food",
  },
  {
    id: 5,
    creator: "Explore Nigeria",
    username: "@explorenigeria",
    caption: "There is beauty everywhere when you take the time to look. 🌍",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85",
    likes: "9.6K",
    comments: "421",
    category: "Travel",
  },
];

const menuItems: {
  label: string;
  icon: LucideIcon;
  id: string;
}[] = [
  { label: "Home", icon: HomeIcon, id: "home" },
  { label: "Discover", icon: Compass, id: "discover" },
  { label: "LIVE", icon: Radio, id: "live" },
  { label: "Messages", icon: MessageCircle, id: "messages" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Marketplace", icon: ShoppingBag, id: "marketplace" },
  { label: "Wallet", icon: Wallet, id: "wallet" },
  { label: "Games", icon: Gamepad2, id: "games" },
  { label: "Profile", icon: User, id: "profile" },
];

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] font-black text-white shadow-lg ${
          small ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl"
        }`}
      >
        S20
      </div>

      {!small && (
        <span className="text-2xl font-black tracking-tight text-[#17202A]">
          How<span className="text-[#FF6B00]">Far</span>
        </span>
      )}
    </div>
  );
}

function SidebarButton({
  item,
  active,
  onClick,
}: {
  item: (typeof menuItems)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
        active
          ? "bg-[#FFF0E5] text-[#FF6B00] shadow-sm"
          : "text-[#5F6872] hover:bg-[#FFF8F0] hover:text-[#17202A]"
      }`}
    >
      <Icon size={21} strokeWidth={active ? 2.5 : 2} />
      <span>{item.label}</span>
      {item.id === "notifications" && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">
          3
        </span>
      )}
    </button>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-black text-[#17202A]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#7A838C]">{subtitle}</p>}
    </div>
  );
}

function EmptyPage({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-[#F0E6DC] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFF0E5] text-[#FF6B00]">
          <Icon size={36} />
        </div>
        <h2 className="text-2xl font-black text-[#17202A]">{title}</h2>
        <p className="mt-3 text-[#7A838C]">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [liked, setLiked] = useState<number[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [postText, setPostText] = useState("");
  const [feedTab, setFeedTab] = useState("For You");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("six20-user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("six20-user");
      }
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => {
    setToast(message);
  };

  const toggleLike = (id: number) => {
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleFollow = (username: string) => {
    setFollowing((current) =>
      current.includes(username)
        ? current.filter((item) => item !== username)
        : [...current, username]
    );

    notify(
      following.includes(username)
        ? "You unfollowed this creator"
        : "You are now following this creator"
    );
  };

  const sharePost = () => {
    notify("Post link copied!");
  };

  const handleAuth = (event: FormEvent) => {
    event.preventDefault();

    const newUser: UserData = {
      id: Date.now().toString(),
      name: authName || "SIX20 User",
      email: authEmail,
      username:
        "@" +
        (authName || "six20user")
          .toLowerCase()
          .replace(/\s+/g, "")
          .slice(0, 18),
    };

    setUser(newUser);
    localStorage.setItem("six20-user", JSON.stringify(newUser));
    setShowAuth(false);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    notify(authMode === "login" ? "Welcome back to SIX20!" : "Welcome to SIX20!");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("six20-user");
    setShowProfileMenu(false);
    notify("You have been logged out");
  };

  const createPost = (event: FormEvent) => {
    event.preventDefault();

    if (!postText.trim()) {
      notify("Write something before posting");
      return;
    }

    setShowCreate(false);
    setPostText("");
    notify("Your post has been published!");
  };

  const renderContent = () => {
    if (activeTab === "home") {
      return (
        <>
          {/* Hero */}
          <section className="overflow-hidden rounded-[32px] border border-[#F1E5DA] bg-gradient-to-br from-[#FFF0E5] via-white to-[#E8F8FF] p-6 shadow-sm md:p-8">
            <div className="grid items-center gap-8 md:grid-cols-[1.2fr_.8fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#FF6B00] shadow-sm">
                  <Sparkles size={15} />
                  MADE FOR AFRICA
                </div>

                <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-[#17202A] md:text-5xl">
                  Where Entertainment
                  <span className="block text-[#FF6B00]">
                    Comes Alive.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-[#65717C]">
                  Create, entertain, connect and discover what&apos;s happening
                  around you on SIX20.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-2xl bg-[#FF6B00] px-5 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5"
                  >
                    <Plus size={20} />
                    Create Post
                  </button>

                  <button
                    onClick={() => setActiveTab("discover")}
                    className="flex items-center gap-2 rounded-2xl border border-[#E8DDD3] bg-white px-5 py-3 font-bold text-[#17202A] transition hover:border-[#FF6B00]"
                  >
                    <Compass size={20} />
                    Explore
                  </button>
                </div>
              </div>

              <div className="relative hidden md:block">
                <div className="mx-auto flex h-56 w-56 rotate-3 items-center justify-center rounded-[48px] bg-gradient-to-br from-[#FF6B00] via-[#FF8C42] to-[#00C2FF] shadow-2xl">
                  <div className="-rotate-3 text-center text-white">
                    <div className="text-7xl font-black">H</div>
                    <div className="mt-1 text-lg font-black tracking-[0.3em]">
                      HOWFAR
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold shadow-lg">
                  🇳🇬 Made for Africa
                </div>

                <div className="absolute -right-3 -top-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold shadow-lg">
                  🔥 What&apos;s happening?
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                icon: Radio,
                label: "Go LIVE",
                text: "Connect now",
                color: "text-red-500",
                bg: "bg-red-50",
                tab: "live",
              },
              {
                icon: ShoppingBag,
                label: "Marketplace",
                text: "Shop Naija",
                color: "text-[#FF6B00]",
                bg: "bg-[#FFF0E5]",
                tab: "marketplace",
              },
              {
                icon: Wallet,
                label: "SIX20 Wallet",
                text: "Send & receive",
                color: "text-[#008751]",
                bg: "bg-[#EAF8F0]",
                tab: "wallet",
              },
              {
                icon: Gamepad2,
                label: "SIX20 Games",
                text: "Play & win",
                color: "text-[#00A8D8]",
                bg: "bg-[#E8F8FF]",
                tab: "games",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.tab)}
                  className="rounded-2xl border border-[#F0E6DC] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                  >
                    <Icon size={22} />
                  </div>
                  <p className="font-bold text-[#17202A]">{item.label}</p>
                  <p className="mt-1 text-xs text-[#8A929A]">{item.text}</p>
                </button>
              );
            })}
          </section>

          {/* SIX20 Stories */}
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#17202A]">SIX20 Stories</h2>
                <p className="mt-1 text-xs text-[#89929B]">Quick moments from people around you.</p>
              </div>
              <button onClick={() => notify("All stories opened")} className="text-xs font-black text-[#FF6B00]">See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                ["You", "bg-gradient-to-br from-[#FF6B00] to-[#00C2FF]"],
                ["Lagos", "bg-gradient-to-br from-[#7C3AED] to-[#EC4899]"],
                ["Music", "bg-gradient-to-br from-[#111827] to-[#7C3AED]"],
                ["Food", "bg-gradient-to-br from-[#F97316] to-[#FACC15]"],
                ["Games", "bg-gradient-to-br from-[#0891B2] to-[#22C55E]"],
                ["Events", "bg-gradient-to-br from-[#DB2777] to-[#F97316]"],
              ].map(([label, gradient]) => (
                <button key={label} onClick={() => notify(`${label} story opened`)} className="min-w-[86px] text-center">
                  <div className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full p-[3px] ${gradient}`}>
                    <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-[#17202A] text-[11px] font-black text-white">
                      {label === "You" ? <Plus size={22} /> : label.slice(0, 1)}
                    </div>
                  </div>
                  <p className="mt-2 truncate text-xs font-bold text-[#17202A]">{label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Live spotlight */}
          <section className="mt-7 overflow-hidden rounded-[28px] bg-[#111318] p-5 text-white shadow-xl md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#FF8A3D]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  SIX20 LIVE
                </div>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">Tonight in Lagos: Music, games & vibes.</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">Watch creators live, jump into the chat and play interactive games without leaving the stream.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["🎵 Music", "🎮 Ludo", "💬 Chat", "🏆 Challenges"].map((item) => (
                    <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{item}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setActiveTab("live")} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 py-3.5 font-black text-white transition hover:scale-[1.02]">
                <Radio size={19} /> Watch LIVE
              </button>
            </div>
          </section>

          {/* Entertainment hubs */}
          <section className="mt-7">
            <div className="mb-4">
              <h2 className="text-xl font-black text-[#17202A]">Explore SIX20</h2>
              <p className="mt-1 text-xs text-[#89929B]">More ways to watch, play, connect and discover.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { title: "Live", text: "Watch creators now", icon: Radio, gradient: "from-[#FF6B00] to-[#EF4444]", tab: "live" },
                { title: "Play", text: "Ludo & challenges", icon: Gamepad2, gradient: "from-[#7C3AED] to-[#EC4899]", tab: "games" },
                { title: "Music", text: "Afrobeats & sounds", icon: Play, gradient: "from-[#0891B2] to-[#2563EB]", tab: "discover" },
                { title: "Events", text: "What's happening", icon: Sparkles, gradient: "from-[#F97316] to-[#EAB308]", tab: "discover" },
              ].map(({ title, text, icon: Icon, gradient, tab }) => (
                <button key={title} onClick={() => setActiveTab(tab)} className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-[#EEE5DC] transition hover:-translate-y-1 hover:shadow-md">
                  <div className={`bg-gradient-to-br ${gradient} p-4 text-white`}>
                    <Icon size={24} />
                    <p className="mt-6 font-black">{title}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-[#65717C]">{text}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Feed tabs */}
          <section className="mt-8">
            <div className="mb-5 flex items-center gap-6 border-b border-[#EDE4DC]">
              {["For You", "Following", "Trending"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFeedTab(tab)}
                  className={`relative pb-3 text-sm font-bold ${
                    feedTab === tab ? "text-[#FF6B00]" : "text-[#858D95]"
                  }`}
                >
                  {tab}
                  {feedTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#FF6B00]" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {videos.map((video) => {
                const isLiked = liked.includes(video.id);
                const isFollowing = following.includes(video.username);

                return (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-[28px] border border-[#EEE5DC] bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-sm font-black text-white">
                          {video.creator.charAt(0)}
                        </div>

                        <div>
                          <p className="font-bold text-[#17202A]">
                            {video.creator}
                          </p>
                          <p className="text-xs text-[#89929B]">
                            {video.username} · {video.category}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollow(video.username)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold ${
                          isFollowing
                            ? "bg-[#EAF8F0] text-[#008751]"
                            : "bg-[#FFF0E5] text-[#FF6B00]"
                        }`}
                      >
                        {isFollowing ? (
                          <span className="flex items-center gap-1">
                            <Check size={14} />
                            Following
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserPlus size={14} />
                            Follow
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F5]">
                      <img
                        src={video.image}
                        alt={video.caption}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#17202A] shadow">
                        #{video.category}
                      </div>

                      <button
                        onClick={() => notify("Opening video...")}
                        className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#FF6B00] shadow-lg"
                      >
                        <Play size={20} fill="currentColor" />
                      </button>
                    </div>

                    <div className="p-4">
                      <p className="text-[15px] leading-6 text-[#37414A]">
                        {video.caption}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLike(video.id)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                              isLiked
                                ? "bg-[#FFF0E5] text-[#FF6B00]"
                                : "bg-[#F7F7F7] text-[#626B74]"
                            }`}
                          >
                            <Heart
                              size={19}
                              fill={isLiked ? "currentColor" : "none"}
                            />
                            {video.likes}
                          </button>

                          <button
                            onClick={() => notify("Comments opened")}
                            className="flex items-center gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-sm font-bold text-[#626B74]"
                          >
                            <MessageCircle size={19} />
                            {video.comments}
                          </button>

                          <button
                            onClick={sharePost}
                            className="flex items-center gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-sm font-bold text-[#626B74]"
                          >
                            <Share2 size={18} />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      );
    }

    if (activeTab === "discover") {
      return (
        <>
          <SectionTitle
            title="Discover"
            subtitle="Find people, trends and communities on SIX20."
          />

          <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#FFF0E5] to-[#E8F8FF] p-5">
            <div className="flex items-center gap-3">
              <Search className="text-[#FF6B00]" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search SIX20..."
                className="w-full bg-transparent text-[#17202A] outline-none placeholder:text-[#9AA1A8]"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["🔥 Trending in Lagos", "Lagos nightlife", "24.5K posts"],
              ["🎵 Music", "Afrobeats", "18.2K posts"],
              ["🍲 Food", "Naija Food", "12.7K posts"],
              ["⚽ Sports", "Football Naija", "9.4K posts"],
              ["👗 Fashion", "Naija Fashion", "7.8K posts"],
              ["✈️ Travel", "Explore Nigeria", "6.2K posts"],
            ].map(([title, subtitle, count]) => (
              <button
                key={title}
                onClick={() => notify(`Exploring ${subtitle}`)}
                className="flex items-center justify-between rounded-3xl border border-[#EEE5DC] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <p className="font-black text-[#17202A]">{title}</p>
                  <p className="mt-1 text-sm text-[#FF6B00]">{subtitle}</p>
                  <p className="mt-2 text-xs text-[#8A929A]">{count}</p>
                </div>
                <ChevronRight className="text-[#9AA1A8]" />
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "live") {
      return (
        <>
          <SectionTitle
            title="LIVE on SIX20"
            subtitle="Join creators and communities in real time."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                name: "Lagos Night Hangout",
                host: "DJ Naija",
                viewers: "4.8K",
                image:
                  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
              },
              {
                name: "Afrobeats Live Session",
                host: "AfroBeats HQ",
                viewers: "3.2K",
                image:
                  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
              },
              {
                name: "Naija Food Talk",
                host: "Chef T",
                viewers: "1.9K",
                image:
                  "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
              },
              {
                name: "Gaming Naija",
                host: "GameKing",
                viewers: "1.4K",
                image:
                  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
              },
            ].map((live) => (
              <button
                key={live.name}
                onClick={() => notify(`Joining ${live.name}`)}
                className="group overflow-hidden rounded-3xl border border-[#EEE5DC] bg-white text-left shadow-sm"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={live.image}
                    alt={live.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                    LIVE
                  </div>

                  <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#17202A]">
                    👁 {live.viewers}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-black text-[#17202A]">{live.name}</h3>
                  <p className="mt-1 text-sm text-[#8A929A]">
                    Hosted by {live.host}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "messages") {
      return (
        <>
          <SectionTitle
            title="Messages"
            subtitle="Stay connected with your SIX20 community."
          />

          <div className="overflow-hidden rounded-3xl border border-[#EEE5DC] bg-white">
            {[
              ["Amaka", "You dey come Lagos this weekend?", "2m"],
              ["Tunde", "That video was 🔥🔥", "15m"],
              ["Chioma", "Let's collaborate!", "1h"],
              ["SIX20 Team", "Welcome to SIX20!", "2h"],
            ].map(([name, message, time]) => (
              <button
                key={name}
                onClick={() => notify(`Opening chat with ${name}`)}
                className="flex w-full items-center gap-4 border-b border-[#F1ECE7] p-4 text-left last:border-b-0 hover:bg-[#FFF8F0]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] font-black text-white">
                  {name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#17202A]">{name}</p>
                  <p className="truncate text-sm text-[#818A93]">
                    {message}
                  </p>
                </div>

                <span className="text-xs text-[#A0A6AC]">{time}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "notifications") {
      return (
        <>
          <SectionTitle
            title="Notifications"
            subtitle="See what is happening with your account."
          />

          <div className="space-y-3">
            {[
              ["❤️", "Amaka liked your post", "2 minutes ago"],
              ["👤", "Tunde started following you", "15 minutes ago"],
              ["💬", "Chioma commented on your video", "1 hour ago"],
              ["🔥", "Your post is trending in Lagos", "2 hours ago"],
              ["🎉", "Welcome to SIX20!", "Today"],
            ].map(([emoji, title, time]) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border border-[#EEE5DC] bg-white p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E5] text-xl">
                  {emoji}
                </div>

                <div>
                  <p className="font-bold text-[#17202A]">{title}</p>
                  <p className="mt-1 text-xs text-[#8A929A]">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "marketplace") {
      return (
        <>
          <SectionTitle
            title="SIX20 Marketplace"
            subtitle="Buy and sell products across Nigeria."
          />

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {["Fashion", "Phones", "Beauty", "Food"].map((item) => (
              <button
                key={item}
                onClick={() => notify(`${item} marketplace opened`)}
                className="rounded-2xl bg-white p-4 text-center font-bold text-[#17202A] shadow-sm ring-1 ring-[#EEE5DC] hover:ring-[#FF6B00]"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              ["Premium Sneakers", "₦85,000", "Fashion"],
              ["iPhone 15", "₦980,000", "Phones"],
              ["African Print Set", "₦45,000", "Fashion"],
              ["Smart Watch", "₦65,000", "Tech"],
              ["Designer Bag", "₦120,000", "Fashion"],
              ["Jollof Party Pack", "₦18,000", "Food"],
            ].map(([name, price, category]) => (
              <button
                key={name}
                onClick={() => notify(`${name} selected`)}
                className="overflow-hidden rounded-3xl border border-[#EEE5DC] bg-white text-left shadow-sm"
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#FFF0E5] to-[#E8F8FF] text-5xl">
                  {category === "Fashion"
                    ? "👟"
                    : category === "Phones" || category === "Tech"
                    ? "📱"
                    : "🍲"}
                </div>

                <div className="p-4">
                  <p className="font-bold text-[#17202A]">{name}</p>
                  <p className="mt-2 font-black text-[#FF6B00]">{price}</p>
                  <p className="mt-1 text-xs text-[#9299A0]">{category}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "wallet") {
      return (
        <>
          <SectionTitle
            title="SIX20 Wallet"
            subtitle="Manage your money and payments."
          />

          <div className="rounded-[32px] bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] p-6 text-white shadow-xl">
            <p className="text-sm font-semibold opacity-90">Available Balance</p>
            <p className="mt-2 text-4xl font-black">₦245,800.00</p>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => notify("Send money opened")}
                className="rounded-2xl bg-white px-5 py-3 font-bold text-[#FF6B00]"
              >
                Send
              </button>

              <button
                onClick={() => notify("Add money opened")}
                className="rounded-2xl bg-white/20 px-5 py-3 font-bold text-white backdrop-blur"
              >
                Add Money
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#EEE5DC] bg-white p-5">
            <h3 className="font-black text-[#17202A]">Recent Transactions</h3>

            <div className="mt-4 space-y-4">
              {[
                ["Received from Amaka", "+₦25,000", "Today"],
                ["Marketplace purchase", "-₦18,500", "Yesterday"],
                ["Wallet top up", "+₦50,000", "Sep 15"],
              ].map(([name, amount, date]) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-[#F2ECE7] pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-bold text-[#17202A]">{name}</p>
                    <p className="text-xs text-[#9299A0]">{date}</p>
                  </div>

                  <p
                    className={`font-black ${
                      amount.startsWith("+")
                        ? "text-[#008751]"
                        : "text-[#FF6B00]"
                    }`}
                  >
                    {amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activeTab === "games") {
      return (
        <>
          <SectionTitle
            title="SIX20 Games"
            subtitle="Play, compete and have fun."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["🎯", "Naija Trivia", "Test your Nigerian knowledge"],
              ["⚽", "Football Challenge", "Show your football skills"],
              ["🧠", "Brain Battle", "Challenge your friends"],
              ["🎵", "Music Quiz", "How well do you know Afrobeats?"],
            ].map(([emoji, name, description]) => (
              <button
                key={name}
                onClick={() => notify(`Starting ${name}`)}
                className="rounded-3xl border border-[#EEE5DC] bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-5xl">{emoji}</div>
                <h3 className="mt-4 text-xl font-black text-[#17202A]">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-[#858D95]">{description}</p>

                <div className="mt-5 inline-flex rounded-xl bg-[#FFF0E5] px-4 py-2 text-sm font-bold text-[#FF6B00]">
                  Play Now
                </div>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "profile") {
      return (
        <>
          <div className="rounded-[32px] border border-[#EEE5DC] bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-3xl font-black text-white">
                {user?.name?.charAt(0) || "H"}
              </div>

              <h2 className="mt-4 text-2xl font-black text-[#17202A]">
                {user?.name || "SIX20 User"}
              </h2>

              <p className="text-sm text-[#8A929A]">
                {user?.username || "@six20user"}
              </p>

              <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
                {[
                  ["124", "Posts"],
                  ["8.4K", "Followers"],
                  ["632", "Following"],
                ].map(([number, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-[#FFF8F0] p-4"
                  >
                    <p className="font-black text-[#17202A]">{number}</p>
                    <p className="mt-1 text-xs text-[#89929B]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-2xl bg-[#FF6B00] px-5 py-3 font-bold text-white"
                >
                  Create Post
                </button>

                <button
                  onClick={() => notify("Profile settings opened")}
                  className="rounded-2xl border border-[#E7DDD4] bg-white px-5 py-3 font-bold text-[#17202A]"
                >
                  <Settings size={18} className="inline mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <EmptyPage
        icon={HomeIcon}
        title="Welcome to SIX20"
        description="Your SIX20 content will appear here."
      />
    );
  };

  if (showSplash) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF8F0]">
        <div className="text-center">
          <div className="mx-auto flex h-28 w-28 animate-pulse items-center justify-center rounded-[32px] bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-5xl font-black text-white shadow-2xl">
            S20
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight text-[#17202A]">
            How<span className="text-[#FF6B00]">Far</span>
          </h1>

          <p className="mt-3 text-sm font-bold tracking-[0.25em] text-[#7B858E]">
            CREATE • ENTERTAIN • CONNECT
          </p>

          <div className="mx-auto mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-[#EDE2D8]">
            <div className="h-full w-full origin-left animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#FF6B00] to-[#00C2FF]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] text-[#17202A]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#EEE5DC] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 md:px-6">
          <div className="lg:hidden">
            <Logo small />
          </div>

          <div className="hidden lg:block">
            <Logo />
          </div>

          <div className="mx-auto hidden max-w-xl flex-1 md:block">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F7F5F2] px-4 py-2.5">
              <Search size={19} className="text-[#89929B]" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder="Search SIX20..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9BA2A8]"
              />

              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="text-[#89929B]"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F5F2] text-[#5F6872] md:hidden"
          >
            <Search size={19} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F5F2] text-[#5F6872]"
            >
              <Bell size={20} />

              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#FF6B00]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl border border-[#EEE5DC] bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="font-black">Notifications</p>
                  <span className="rounded-full bg-[#FFF0E5] px-2 py-1 text-xs font-bold text-[#FF6B00]">
                    3 new
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  <p className="text-sm text-[#65717C]">
                    ❤️ Amaka liked your post
                  </p>
                  <p className="text-sm text-[#65717C]">
                    👤 Tunde followed you
                  </p>
                  <p className="text-sm text-[#65717C]">
                    🔥 Your video is trending
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("notifications");
                    setShowNotifications(false);
                  }}
                  className="mt-4 w-full rounded-xl bg-[#FFF0E5] py-2 text-sm font-bold text-[#FF6B00]"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[#F7F5F2]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-sm font-black text-white">
                {user?.name?.charAt(0) || "H"}
              </div>

              <span className="hidden text-sm font-bold lg:block">
                {user?.name || "Guest"}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#EEE5DC] bg-white p-2 shadow-xl">
                {!user ? (
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuth(true);
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left font-bold hover:bg-[#FFF8F0]"
                  >
                    <LogIn size={19} />
                    Login / Sign Up
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left font-bold hover:bg-[#FFF8F0]"
                    >
                      <User size={19} />
                      My Profile
                    </button>

                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left font-bold text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={19} />
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-[#EEE5DC] px-4 py-3 md:hidden">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F7F5F2] px-4 py-3">
              <Search size={18} className="text-[#89929B]" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search SIX20..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        )}
      </header>

      {/* DESKTOP LAYOUT */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
        {/* SIDEBAR */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] border-r border-[#EEE5DC] bg-white p-4 lg:block">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] py-3 font-black text-white shadow-lg shadow-orange-100"
          >
            <Plus size={20} />
            Create
          </button>

          <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#FFF0E5] to-[#E8F8FF] p-5">
            <Sparkles className="text-[#FF6B00]" size={24} />
            <p className="mt-3 font-black text-[#17202A]">
              Your SIX20 space
            </p>
            <p className="mt-1 text-xs leading-5 text-[#737D86]">
              Create content, build your community and discover what&apos;s
              happening.
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 px-4 py-6 md:px-6 lg:px-8">
          {renderContent()}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] border-l border-[#EEE5DC] bg-[#FFFDFB] p-5 xl:block">
          <div className="rounded-3xl bg-gradient-to-br from-[#EAF8F0] to-[#FFF0E5] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <p className="font-black text-[#17202A]">LIVE NOW</p>
              </div>

              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-red-500">
                12.8K
              </span>
            </div>

            <p className="mt-4 text-lg font-black text-[#17202A]">
              Lagos Night Hangout
            </p>

            <p className="mt-1 text-xs text-[#75808A]">
              Join thousands of people live now.
            </p>

            <button
              onClick={() => setActiveTab("live")}
              className="mt-4 w-full rounded-xl bg-[#FF6B00] py-2.5 text-sm font-bold text-white"
            >
              Watch LIVE
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#17202A]">Trending</h3>
              <button
                onClick={() => setActiveTab("discover")}
                className="text-xs font-bold text-[#FF6B00]"
              >
                See all
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {[
                ["#Lagos", "48.2K posts"],
                ["#Afrobeats", "36.7K posts"],
                ["#NaijaFood", "28.4K posts"],
                ["#SIX20", "21.9K posts"],
                ["#Nigeria", "19.3K posts"],
              ].map(([tag, count], index) => (
                <button
                  key={tag}
                  onClick={() => notify(`Opening ${tag}`)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-[#EEE5DC]"
                >
                  <span className="text-xs font-black text-[#B0B6BB]">
                    0{index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[#17202A]">{tag}</p>
                    <p className="text-[11px] text-[#9199A0]">{count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#EEE5DC] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Users size={21} className="text-[#FF6B00]" />
              <p className="font-black">Who to follow</p>
            </div>

            <div className="mt-4 space-y-4">
              {["@lagoslife", "@naijaculture", "@afrobeatsdaily"].map(
                (name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-xs font-black text-white">
                        {name.charAt(1).toUpperCase()}
                      </div>

                      <p className="text-xs font-bold text-[#17202A]">{name}</p>
                    </div>

                    <button
                      onClick={() => toggleFollow(name)}
                      className="rounded-lg bg-[#FFF0E5] px-2.5 py-1.5 text-[10px] font-black text-[#FF6B00]"
                    >
                      {following.includes(name) ? "Following" : "Follow"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EEE5DC] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {[
            { id: "home", icon: HomeIcon, label: "Home" },
            { id: "discover", icon: Compass, label: "Discover" },
            { id: "create", icon: Plus, label: "Create" },
            { id: "messages", icon: MessageCircle, label: "Chat" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((item) => {
            const Icon = item.icon;

            if (item.id === "create") {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowCreate(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#00C2FF] text-white shadow-lg"
                >
                  <Icon size={25} />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex min-w-[60px] flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold ${
                  activeTab === item.id
                    ? "text-[#FF6B00]"
                    : "text-[#8A929A]"
                }`}
              >
                <Icon size={21} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17202A]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Create on SIX20</h2>
                <p className="mt-1 text-sm text-[#8A929A]">
                  Share what&apos;s happening.
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F5F2]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createPost} className="mt-6">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's happening, SIX20?"
                rows={6}
                className="w-full resize-none rounded-2xl border border-[#E8DED5] bg-[#FFFDFB] p-4 outline-none focus:border-[#FF6B00]"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {["📸 Photo", "🎥 Video", "🎵 Sound", "📍 Location"].map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => notify(`${item} selected`)}
                      className="rounded-xl bg-[#FFF0E5] px-3 py-2 text-xs font-bold text-[#FF6B00]"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="submit"
                className="mt-5 w-full rounded-2xl bg-[#FF6B00] py-3.5 font-black text-white"
              >
                Publish Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17202A]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl">
            <div className="flex justify-center">
              <Logo />
            </div>

            <div className="mt-7 text-center">
              <h2 className="text-2xl font-black">
                {authMode === "login"
                  ? "Welcome back"
                  : "Join SIX20"}
              </h2>

              <p className="mt-2 text-sm text-[#89929B]">
                {authMode === "login"
                  ? "Login to continue your SIX20 experience."
                  : "Create your account and start connecting."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              {authMode === "signup" && (
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full rounded-2xl border border-[#E8DED5] px-4 py-3 outline-none focus:border-[#FF6B00]"
                />
              )}

              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                type="email"
                placeholder="Email address"
                required
                className="w-full rounded-2xl border border-[#E8DED5] px-4 py-3 outline-none focus:border-[#FF6B00]"
              />

              <div className="relative">
                <input
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full rounded-2xl border border-[#E8DED5] px-4 py-3 pr-12 outline-none focus:border-[#FF6B00]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89929B]"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] py-3.5 font-black text-white"
              >
                {authMode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-[#7D8790]">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
                className="font-bold text-[#FF6B00]"
              >
                {authMode === "login" ? "Sign up" : "Login"}
              </button>
            </div>

            <button
              onClick={() => setShowAuth(false)}
              className="mt-5 w-full text-sm font-semibold text-[#9AA1A8]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-2xl bg-[#FF6B00] px-5 py-3 text-sm font-bold text-white shadow-xl lg:bottom-8">
          {toast}
        </div>
      )}
    </main>
  );
}