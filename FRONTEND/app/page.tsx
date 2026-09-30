"use client";

import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Gamepad2,
  Heart,
  Home,
  MessageCircle,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  Video,
  Wallet,
  Users,
  Music,
  CalendarDays,
  Flame,
  Radio,
  Plus,
} from "lucide-react";

const discoverItems = [
  {
    id: "live",
    title: "SIX20 Live",
    description: "Watch creators live and join the conversation.",
    icon: Radio,
  },
  {
    id: "play",
    title: "Play",
    description: "Challenge friends with games, quizzes and battles.",
    icon: Gamepad2,
  },
  {
    id: "music",
    title: "Music",
    description: "Discover artists, sounds and entertainment.",
    icon: Music,
  },
  {
    id: "events",
    title: "Events",
    description: "Find events, parties and experiences.",
    icon: CalendarDays,
  },
];

const liveCreators = [
  {
    id: "1",
    name: "Ayo Creator",
    viewers: "2.4K",
    category: "Entertainment",
  },
  {
    id: "2",
    name: "Lagos Vibes",
    viewers: "1.8K",
    category: "Music",
  },
  {
    id: "3",
    name: "Naija Games",
    viewers: "954",
    category: "Gaming",
  },
];

const trendingPosts = [
  {
    id: "1",
    name: "SIX20 Entertainment",
    text: "Welcome to SIX20 — where entertainment comes alive.",
    likes: 1240,
    comments: 86,
  },
  {
    id: "2",
    name: "Tunde Live",
    text: "Tonight's live challenge starts at 8PM. Who is joining?",
    likes: 892,
    comments: 64,
  },
  {
    id: "3",
    name: "Lagos Food & Vibes",
    text: "Good food, good music and good people. That's the vibe.",
    likes: 631,
    comments: 42,
  },
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Home");
  const [search, setSearch] = useState("");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const toggleLike = (id: string) => {
    setLikedPosts((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(124,58,237,.18), transparent 30%), #08080b",
        color: "#fff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(8,8,11,.9)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 27,
              fontWeight: 900,
              letterSpacing: "-1.5px",
              background:
                "linear-gradient(90deg, #fff, #c084fc, #f472b6)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            SIX20
          </div>

          <div
            style={{
              flex: 1,
              maxWidth: 520,
              position: "relative",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: 13,
                opacity: 0.55,
              }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SIX20..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 16px 12px 42px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            style={iconButton}
            onClick={() => setActiveNav("Notifications")}
          >
            <Bell size={19} />
          </button>

          <button
            type="button"
            aria-label="Messages"
            style={iconButton}
            onClick={() => setActiveNav("Messages")}
          >
            <MessageCircle size={19} />
          </button>

          <button
            type="button"
            style={{
              ...primaryButton,
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Plus size={17} />
            Create
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "28px 20px 60px",
          display: "grid",
          gridTemplateColumns: "230px minmax(0,1fr) 290px",
          gap: 22,
        }}
      >
        {/* SIDEBAR */}
        <aside>
          <nav
            style={{
              position: "sticky",
              top: 90,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <NavButton
              icon={<Home size={19} />}
              label="Home"
              active={activeNav === "Home"}
              onClick={() => setActiveNav("Home")}
            />

            <NavButton
              icon={<Sparkles size={19} />}
              label="Discover"
              active={activeNav === "Discover"}
              onClick={() => setActiveNav("Discover")}
            />

            <NavButton
              icon={<Radio size={19} />}
              label="LIVE"
              active={activeNav === "LIVE"}
              onClick={() => setActiveNav("LIVE")}
            />

            <NavButton
              icon={<MessageCircle size={19} />}
              label="Messages"
              active={activeNav === "Messages"}
              onClick={() => setActiveNav("Messages")}
            />

            <NavButton
              icon={<Gamepad2 size={19} />}
              label="Play"
              active={activeNav === "Play"}
              onClick={() => setActiveNav("Play")}
            />

            <NavButton
              icon={<ShoppingBag size={19} />}
              label="Market"
              active={activeNav === "Market"}
              onClick={() => setActiveNav("Market")}
            />

            <NavButton
              icon={<Wallet size={19} />}
              label="Wallet"
              active={activeNav === "Wallet"}
              onClick={() => setActiveNav("Wallet")}
            />

            <NavButton
              icon={<User size={19} />}
              label="Profile"
              active={activeNav === "Profile"}
              onClick={() => setActiveNav("Profile")}
            />
          </nav>
        </aside>

        {/* MAIN */}
        <section>
          {/* HERO */}
          <div
            style={{
              borderRadius: 26,
              padding: "34px",
              marginBottom: 22,
              background:
                "linear-gradient(135deg, rgba(124,58,237,.85), rgba(236,72,153,.65), rgba(249,115,22,.65))",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                right: -80,
                top: -100,
                background: "rgba(255,255,255,.12)",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.25)",
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 15,
                }}
              >
                <Sparkles size={14} />
                THE NEW SIX20
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(34px, 5vw, 62px)",
                  lineHeight: 0.98,
                  letterSpacing: "-3px",
                  maxWidth: 720,
                }}
              >
                Where
                <br />
                Entertainment
                <br />
                Comes Alive.
              </h1>

              <p
                style={{
                  maxWidth: 620,
                  margin: "18px 0 22px",
                  fontSize: 16,
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                Watch. Chat. Play. Discover. Connect with creators,
                communities, music, games and experiences from Africa and
                around the world.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  style={{
                    ...whiteButton,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Play size={17} fill="currentColor" />
                  Explore SIX20
                </button>

                <button
                  type="button"
                  style={{
                    ...darkButton,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Video size={17} />
                  Go Live
                </button>
              </div>
            </div>
          </div>

          {/* DISCOVER */}
          <SectionHeader
            title="Explore SIX20"
            icon={<Sparkles size={19} />}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 13,
              marginBottom: 30,
            }}
          >
            {discoverItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.title)}
                  style={{
                    textAlign: "left",
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.045)",
                    borderRadius: 20,
                    padding: 18,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      display: "grid",
                      placeItems: "center",
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,.35), rgba(236,72,153,.25))",
                      marginBottom: 15,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      opacity: 0.58,
                    }}
                  >
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* FEED */}
          <SectionHeader
            title="Trending on SIX20"
            icon={<Flame size={19} />}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {trendingPosts
              .filter((post) => {
                if (!search.trim()) return true;

                const query = search.toLowerCase();

                return (
                  post.name.toLowerCase().includes(query) ||
                  post.text.toLowerCase().includes(query)
                );
              })
              .map((post) => {
                const liked = likedPosts.includes(post.id);

                return (
                  <article
                    key={post.id}
                    style={{
                      borderRadius: 21,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.04)",
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={avatar}>
                        {post.name.charAt(0)}
                      </div>

                      <div style={{ flex: 1 }}>
                        <strong>{post.name}</strong>

                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.5,
                            marginTop: 3,
                          }}
                        >
                          Just now
                        </div>
                      </div>

                      <button
                        type="button"
                        style={moreButton}
                        aria-label="More options"
                      >
                        •••
                      </button>
                    </div>

                    <p
                      style={{
                        margin: "18px 0",
                        lineHeight: 1.65,
                        opacity: 0.85,
                      }}
                    >
                      {post.text}
                    </p>

                    <div
                      style={{
                        height: 170,
                        borderRadius: 16,
                        background:
                          "linear-gradient(135deg, rgba(124,58,237,.25), rgba(236,72,153,.2), rgba(249,115,22,.18))",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 15,
                      }}
                    >
                      <Play size={38} opacity={0.8} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        style={{
                          ...actionButton,
                          color: liked ? "#f472b6" : "#fff",
                        }}
                      >
                        <Heart
                          size={18}
                          fill={liked ? "currentColor" : "none"}
                        />
                        {post.likes + (liked ? 1 : 0)}
                      </button>

                      <button
                        type="button"
                        style={actionButton}
                      >
                        <MessageCircle size={18} />
                        {post.comments}
                      </button>

                      <button
                        type="button"
                        style={{
                          ...actionButton,
                          marginLeft: "auto",
                        }}
                      >
                        Share
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside>
          <div
            style={{
              position: "sticky",
              top: 90,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {/* PROFILE CARD */}
            <div style={sideCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={largeAvatar}>A</div>

                <div>
                  <strong>Ayo Creator</strong>

                  <div
                    style={{
                      opacity: 0.5,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    @ayocreator
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <Stat value="128" label="Posts" />
                <Stat value="4.8K" label="Followers" />
                <Stat value="326" label="Following" />
              </div>
            </div>

            {/* LIVE NOW */}
            <div style={sideCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 15,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ef4444",
                      boxShadow: "0 0 10px #ef4444",
                    }}
                  />
                  <strong>Live Now</strong>
                </div>

                <button
                  type="button"
                  style={smallLink}
                  onClick={() => setActiveNav("LIVE")}
                >
                  See all
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                }}
              >
                {liveCreators.map((creator) => (
                  <div
                    key={creator.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        ...avatar,
                        border: "2px solid #ec4899",
                      }}
                    >
                      {creator.name.charAt(0)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13 }}>
                        {creator.name}
                      </strong>

                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.5,
                          marginTop: 3,
                        }}
                      >
                        {creator.category}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.65,
                      }}
                    >
                      {creator.viewers}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div style={sideCard}>
              <strong>Quick access</strong>

              <QuickLink
                icon={<Trophy size={17} />}
                title="Rewards"
              />

              <QuickLink
                icon={<Users size={17} />}
                title="Communities"
              />

              <QuickLink
                icon={<ShoppingBag size={17} />}
                title="Marketplace"
              />

              <QuickLink
                icon={<Wallet size={17} />}
                title="Wallet"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE NAV */}
      <div
        style={{
          position: "fixed",
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 100,
          padding: "10px 8px",
          borderRadius: 20,
          background: "rgba(15,15,20,.94)",
          border: "1px solid rgba(255,255,255,.1)",
          backdropFilter: "blur(20px)",
          display: "none",
          justifyContent: "space-around",
        }}
      >
        <MobileNav icon={<Home size={19} />} label="Home" />
        <MobileNav icon={<Search size={19} />} label="Discover" />
        <MobileNav icon={<Plus size={23} />} label="Create" />
        <MobileNav icon={<Radio size={19} />} label="Live" />
        <MobileNav icon={<User size={19} />} label="Profile" />
      </div>
    </main>
  );
}

/* COMPONENTS */

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        borderRadius: 13,
        border: "none",
        background: active
          ? "linear-gradient(90deg, rgba(124,58,237,.25), rgba(236,72,153,.12))"
          : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,.62)",
        cursor: "pointer",
        textAlign: "left",
        fontWeight: active ? 800 : 500,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
      }}
    >
      {icon}

      <h2
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 850,
        }}
      >
        {title}
      </h2>

      <ChevronRight size={17} opacity={0.45} />
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 4px",
        borderRadius: 12,
        background: "rgba(255,255,255,.04)",
      }}
    >
      <div style={{ fontWeight: 850 }}>{value}</div>

      <div
        style={{
          fontSize: 10,
          opacity: 0.45,
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "12px 0",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{title}</span>
      <ChevronRight size={15} opacity={0.4} />
    </button>
  );
}

function MobileNav({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      style={{
        border: "none",
        background: "transparent",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        fontSize: 9,
        opacity: 0.8,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* STYLES */

const iconButton: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "11px 16px",
  background: "#fff",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
};

const whiteButton: React.CSSProperties = {
  border: "none",
  borderRadius: 13,
  padding: "12px 18px",
  background: "#fff",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
};

const darkButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 13,
  padding: "12px 18px",
  background: "rgba(0,0,0,.25)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const sideCard: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  padding: 18,
};

const avatar: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background:
    "linear-gradient(135deg, #7c3aed, #ec4899)",
  fontWeight: 850,
  flexShrink: 0,
};

const largeAvatar: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background:
    "linear-gradient(135deg, #7c3aed, #ec4899)",
  fontWeight: 900,
  fontSize: 20,
};

const actionButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  border: "none",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
};

const moreButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#fff",
  opacity: 0.5,
  cursor: "pointer",
};

const smallLink: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#c084fc",
  fontSize: 12,
  cursor: "pointer",
};
