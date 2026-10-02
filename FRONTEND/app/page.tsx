"use client";

import {
  ArrowRight,
  Bell,
  ChevronRight,
  Compass,
  Crown,
  Flame,
  Gamepad2,
  Gift,
  Globe2,
  MessageCircle,
  Music2,
  Radio,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../lib/api";
import SIX20Intro from "../components/SIX20Intro";

type UserData = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
};

type AuthMode = "login" | "register";

const TOKEN_KEY = "six20-token";
const USER_KEY = "six20-user";

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

function saveAuth(token: string, user: UserData) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export default function Page() {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [startupDone, setStartupDone] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const [search, setSearch] = useState("");

  const finishStartup = useCallback(() => {
    setStartupDone(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = getStoredToken();

      if (!token) {
        if (active) {
          setAuthChecked(true);
        }
        return;
      }

      try {
        const data = await apiFetch("/api/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (active && data?.user) {
          setUser(data.user);

          window.localStorage.setItem(
            USER_KEY,
            JSON.stringify(data.user)
          );
        }
      } catch {
        clearAuth();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  function openLogin() {
    setAuthMode("login");
    setAuthOpen(true);
    setAuthError("");
    setAuthSuccess("");
  }

  function openRegister() {
    setAuthMode("register");
    setAuthOpen(true);
    setAuthError("");
    setAuthSuccess("");
  }

  function closeAuth() {
    if (authLoading) return;

    setAuthOpen(false);
    setAuthError("");
    setAuthSuccess("");
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const data = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!data?.token || !data?.user) {
          throw new Error("Login response was incomplete.");
        }

        saveAuth(data.token, data.user);
        setUser(data.user);
        setAuthSuccess("Welcome back to SIX20.");
        setPassword("");

        setTimeout(() => {
          setAuthOpen(false);
          setAuthSuccess("");
        }, 700);
      } else {
        const data = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password,
            displayName: displayName || username,
          }),
        });

        if (!data?.token || !data?.user) {
          throw new Error(
            "Registration response was incomplete."
          );
        }

        saveAuth(data.token, data.user);
        setUser(data.user);
        setAuthSuccess(
          "Your SIX20 account has been created."
        );
        setPassword("");

        setTimeout(() => {
          setAuthOpen(false);
          setAuthSuccess("");
        }, 700);
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    clearAuth();
    setUser(null);
    setMobileMenuOpen(false);
  }

  function navigate(path: string) {
    window.location.href = path;
  }

  function searchSIX20() {
    const value = search.trim();

    if (value) {
      navigate(`/discover?q=${encodeURIComponent(value)}`);
    } else {
      navigate("/discover");
    }
  }

  const currentDisplayName =
    user?.displayName ||
    user?.username ||
    "Guest";

  return (
    <>
      {!startupDone && (
        <SIX20Intro onComplete={finishStartup} />
      )}

      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg,#FBFAFF 0%,#F7F5FC 45%,#FFFFFF 100%)",
          color: "#171329",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(251,250,255,0.90)",
            backdropFilter: "blur(20px)",
            borderBottom:
              "1px solid rgba(220,214,236,0.75)",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="SIX20 home"
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 43,
                  height: 43,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 950,
                  fontSize: 14,
                  background:
                    "linear-gradient(135deg,#6947F5,#FF7A66)",
                  boxShadow:
                    "0 9px 25px rgba(105,71,245,0.28)",
                }}
              >
                S20
              </span>

              <span
                style={{
                  fontSize: 21,
                  fontWeight: 950,
                  letterSpacing: "-0.8px",
                }}
              >
                SIX20
              </span>
            </button>

            <div
              style={{
                flex: 1,
                maxWidth: 390,
                display: "flex",
                alignItems: "center",
                gap: 9,
                background: "#F2EFF9",
                border: "1px solid #E5DFEF",
                borderRadius: 14,
                padding: "0 12px",
              }}
            >
              <Search size={18} color="#81798F" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchSIX20();
                  }
                }}
                placeholder="Search SIX20..."
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  padding: "11px 0",
                  fontSize: 14,
                  color: "#211B32",
                }}
              />
            </div>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginLeft: "auto",
              }}
            >
              <HeaderButton
                icon={<Compass size={17} />}
                label="Discover"
                onClick={() => navigate("/discover")}
              />

              <HeaderButton
                icon={<Radio size={17} />}
                label="LIVE"
                onClick={() => navigate("/live")}
              />

              <HeaderButton
                icon={<Gamepad2 size={17} />}
                label="Play"
                onClick={() => navigate("/games")}
              />

              <HeaderButton
                icon={<MessageCircle size={17} />}
                label="Chat"
                onClick={() => navigate("/messages")}
              />
            </nav>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid #E2DCEC",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  color: "#504A5D",
                }}
              >
                <Bell size={18} />
              </button>

              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    style={{
                      border: 0,
                      background: "#EEE9FF",
                      color: "#6040E8",
                      padding: "10px 13px",
                      borderRadius: 12,
                      fontWeight: 850,
                      cursor: "pointer",
                      maxWidth: 150,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentDisplayName}
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      ...secondaryButton,
                      padding: "10px 12px",
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openLogin}
                    style={{
                      ...secondaryButton,
                      padding: "10px 13px",
                    }}
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={openRegister}
                    style={{
                      ...primaryButton,
                      padding: "10px 14px",
                    }}
                  >
                    Join SIX20
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                style={{
                  display: "none",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid #E2DCEC",
                  background: "#fff",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <span>
                  <Compass size={20} />
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "72px 20px 45px",
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.08fr) minmax(390px,0.92fr)",
            gap: 45,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg,#EEE9FF,#FFF0ED)",
                color: "#6243E8",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.3px",
              }}
            >
              <Sparkles size={14} />
              AFRICA → GLOBAL
            </div>

            <h1
              style={{
                margin: "21px 0 0",
                fontSize: "clamp(50px,7vw,88px)",
                lineHeight: 0.94,
                letterSpacing: "-5px",
                fontWeight: 950,
                maxWidth: 780,
              }}
            >
              Entertainment
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg,#6947F5,#FF7A66)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Comes Alive.
              </span>
            </h1>

            <p
              style={{
                maxWidth: 690,
                margin: "25px 0 0",
                fontSize: 19,
                lineHeight: 1.65,
                color: "#6D667B",
              }}
            >
              Discover creators, watch LIVE entertainment,
              play games, connect, chat, shop and
              participate in one connected entertainment
              universe.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 11,
                marginTop: 28,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  user ? navigate("/live") : openRegister()
                }
                style={{
                  ...primaryButton,
                  padding: "14px 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow:
                    "0 12px 30px rgba(105,71,245,0.24)",
                }}
              >
                {user ? "Explore LIVE" : "Join SIX20"}
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/discover")}
                style={{
                  ...secondaryButton,
                  padding: "14px 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Compass size={17} />
                Explore
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 18,
                marginTop: 30,
                color: "#777083",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <MiniStat icon={<Radio size={15} />} text="LIVE" />
              <MiniStat
                icon={<Gamepad2 size={15} />}
                text="PLAY"
              />
              <MiniStat icon={<Music2 size={15} />} text="MUSIC" />
              <MiniStat
                icon={<ShoppingBag size={15} />}
                text="MARKET"
              />
              <MiniStat icon={<Gift size={15} />} text="REWARDS" />
            </div>
          </div>

          <div
            style={{
              position: "relative",
              minHeight: 535,
              borderRadius: 34,
              overflow: "hidden",
              background:
                "linear-gradient(145deg,#17122D 0%,#31216C 48%,#6947F5 100%)",
              padding: 25,
              boxShadow:
                "0 35px 90px rgba(48,31,110,0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                right: -70,
                top: -65,
                background:
                  "linear-gradient(135deg,#FF7A66,#FFB36B)",
                opacity: 0.65,
                filter: "blur(5px)",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                left: -100,
                bottom: -100,
                background: "#6947F5",
                opacity: 0.65,
                filter: "blur(3px)",
              }}
            />

            <div
              style={{
                position: "relative",
                minHeight: 485,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 11px",
                    borderRadius: 999,
                    background:
                      "rgba(255,255,255,0.13)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#FF7A66",
                    }}
                  />
                  SIX20 LIVE
                </div>

                <h2
                  style={{
                    color: "#fff",
                    fontSize: "clamp(36px,4vw,54px)",
                    lineHeight: 1.02,
                    letterSpacing: "-2.5px",
                    margin: "22px 0 13px",
                    fontWeight: 900,
                  }}
                >
                  Your world.
                  <br />
                  Your vibe.
                  <br />
                  Your SIX20.
                </h2>

                <p
                  style={{
                    maxWidth: 420,
                    color: "rgba(255,255,255,0.70)",
                    lineHeight: 1.65,
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  A connected place for entertainment,
                  creators, communities and experiences.
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2,minmax(0,1fr))",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <HeroTile
                    icon={<Radio size={20} />}
                    title="LIVE"
                    text="Watch & create"
                  />

                  <HeroTile
                    icon={<Gamepad2 size={20} />}
                    title="PLAY"
                    text="Games & challenges"
                  />

                  <HeroTile
                    icon={<MessageCircle size={20} />}
                    title="CHAT"
                    text="People & communities"
                  />

                  <HeroTile
                    icon={<ShoppingBag size={20} />}
                    title="MARKET"
                    text="Products & offers"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/discover")}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 15,
                    padding: "14px 16px",
                    background:
                      "rgba(255,255,255,0.13)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    fontWeight: 850,
                  }}
                >
                  <span>Explore the SIX20 universe</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* UNIVERSE */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 20px 70px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: "#6947F5",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                <Zap size={14} />
                THE SIX20 UNIVERSE
              </div>

              <h2
                style={{
                  margin: "7px 0 0",
                  fontSize: "clamp(29px,4vw,42px)",
                  letterSpacing: "-1.8px",
                  lineHeight: 1.05,
                }}
              >
                Everything connected.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/discover")}
              style={{
                ...secondaryButton,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              Explore all
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(210px,1fr))",
              gap: 13,
            }}
          >
            <UniverseCard
              icon={<Radio size={21} />}
              title="SIX20 LIVE"
              text="Watch creators, join conversations and experience LIVE entertainment."
              accent="#6947F5"
              onClick={() => navigate("/live")}
            />

            <UniverseCard
              icon={<Gamepad2 size={21} />}
              title="SIX20 PLAY"
              text="Casual games and interactive experiences built for community."
              accent="#FF7A66"
              onClick={() => navigate("/games")}
            />

            <UniverseCard
              icon={<MessageCircle size={21} />}
              title="SIX20 CHAT"
              text="Continue the conversation beyond LIVE with people and communities."
              accent="#25A77A"
              onClick={() => navigate("/messages")}
            />

            <UniverseCard
              icon={<ShoppingBag size={21} />}
              title="SIX20 MARKET"
              text="Discover products, sellers, creator offers and entertainment deals."
              accent="#E59A2F"
              onClick={() => navigate("/marketplace")}
            />

            <UniverseCard
              icon={<Gift size={21} />}
              title="SIX20 REWARDS"
              text="Build participation around rewards, challenges, referrals and community."
              accent="#D94B8B"
              onClick={() => navigate("/wallet")}
            />

            <UniverseCard
              icon={<Wallet size={21} />}
              title="SIX20 WALLET"
              text="Keep your SIX20 earnings and transactions connected in one place."
              accent="#4A7AE8"
              onClick={() => navigate("/wallet")}
            />
          </div>
        </section>

        {/* DISCOVER */}
        <section
          style={{
            background:
              "linear-gradient(180deg,#F1EDFF 0%,#F8F6FC 100%)",
            borderTop: "1px solid #E9E3F3",
            borderBottom: "1px solid #E9E3F3",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "72px 20px",
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) minmax(300px,0.8fr)",
              gap: 45,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#6947F5",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Compass size={15} />
                DISCOVER
              </div>

              <h2
                style={{
                  fontSize: "clamp(34px,5vw,55px)",
                  lineHeight: 1,
                  letterSpacing: "-2.5px",
                  margin: "10px 0 18px",
                }}
              >
                Find your next
                <br />
                obsession.
              </h2>

              <p
                style={{
                  maxWidth: 620,
                  color: "#716A7D",
                  fontSize: 16,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                SIX20 is designed around discovery —
                creators, games, entertainment,
                communities and experiences that give
                people a reason to keep exploring.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                  marginTop: 25,
                }}
              >
                <Pill
                  icon={<Flame size={14} />}
                  text="Trending"
                />

                <Pill
                  icon={<Globe2 size={14} />}
                  text="Africa → Global"
                />

                <Pill
                  icon={<Users size={14} />}
                  text="Communities"
                />

                <Pill
                  icon={<Star size={14} />}
                  text="Creators"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/discover")}
                style={{
                  ...primaryButton,
                  marginTop: 27,
                  padding: "13px 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Open Discover
                <ArrowRight size={17} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <PreviewCard
                number="01"
                icon={<Flame size={19} />}
                title="Trending"
                text="Discover what is gaining attention across the SIX20 ecosystem."
              />

              <PreviewCard
                number="02"
                icon={<Crown size={19} />}
                title="Creators"
                text="Find personalities and entertainment voices you want to follow."
              />

              <PreviewCard
                number="03"
                icon={<Globe2 size={19} />}
                title="Africa → Global"
                text="Built with African energy and designed for a worldwide audience."
              />
            </div>
          </div>
        </section>

        {/* CREATOR ECONOMY */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "75px 20px",
          }}
        >
          <div
            style={{
              borderRadius: 30,
              overflow: "hidden",
              background:
                "linear-gradient(135deg,#17132D,#291E59 55%,#4E36A4)",
              color: "#fff",
              padding: "42px 38px",
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) minmax(290px,0.7fr)",
              gap: 35,
              alignItems: "center",
              boxShadow:
                "0 30px 70px rgba(31,22,68,0.18)",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 10px",
                  borderRadius: 999,
                  background:
                    "rgba(255,255,255,0.10)",
                  color: "#D7CEFF",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <Sparkles size={13} />
                CREATOR ECONOMY
              </div>

              <h2
                style={{
                  fontSize: "clamp(32px,5vw,52px)",
                  lineHeight: 1,
                  letterSpacing: "-2.2px",
                  margin: "15px 0",
                }}
              >
                Create.
                <br />
                Connect.
                <br />
                Participate.
              </h2>

              <p
                style={{
                  maxWidth: 610,
                  color: "rgba(255,255,255,0.68)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                SIX20 brings creator experiences,
                LIVE interaction, marketplace
                opportunities, affiliate participation
                and rewards into one connected
                ecosystem.
              </p>

              <button
                type="button"
                onClick={() =>
                  user ? navigate("/profile") : openRegister()
                }
                style={{
                  marginTop: 25,
                  border: 0,
                  borderRadius: 13,
                  padding: "13px 17px",
                  background: "#fff",
                  color: "#2D215D",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {user
                  ? "Open my profile"
                  : "Join the community"}
                <ArrowRight size={17} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <EconomyCard
                icon={<Radio size={19} />}
                title="LIVE"
                text="Creator interaction"
              />

              <EconomyCard
                icon={<ShoppingBag size={19} />}
                title="AFFILIATE"
                text="Product participation"
              />

              <EconomyCard
                icon={<Gift size={19} />}
                title="REWARDS"
                text="Community incentives"
              />

              <EconomyCard
                icon={<Wallet size={19} />}
                title="WALLET"
                text="Connected transactions"
              />
            </div>
          </div>
        </section>

        {/* PLAY + COMMUNITY */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 20px 75px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",
              gap: 15,
            }}
          >
            <BigFeature
              icon={<Gamepad2 size={25} />}
              eyebrow="PLAY"
              title="Games belong inside the entertainment."
              text="Casual multiplayer experiences can become part of LIVE interaction — not a separate destination."
              button="Open SIX20 Play"
              onClick={() => navigate("/games")}
              background="linear-gradient(135deg,#FFF0EC,#FFF9F7)"
            />

            <BigFeature
              icon={<MessageCircle size={25} />}
              eyebrow="COMMUNITY"
              title="The conversation continues."
              text="Move from watching to talking, connecting and building communities around the things you love."
              button="Open SIX20 Chat"
              onClick={() => navigate("/messages")}
              background="linear-gradient(135deg,#EEE9FF,#FAF8FF)"
            />
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            background:
              "linear-gradient(135deg,#6947F5,#4A31B9)",
            color: "#fff",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "75px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                margin: "0 auto 18px",
                display: "grid",
                placeItems: "center",
                background:
                  "rgba(255,255,255,0.13)",
              }}
            >
              <Sparkles size={25} />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(35px,5vw,58px)",
                lineHeight: 1,
                letterSpacing: "-2.5px",
              }}
            >
              Where Entertainment
              <br />
              Comes Alive.
            </h2>

            <p
              style={{
                maxWidth: 600,
                margin: "18px auto 0",
                color:
                  "rgba(255,255,255,0.73)",
                lineHeight: 1.65,
              }}
            >
              The SIX20 journey starts with one tap.
            </p>

            <button
              type="button"
              onClick={() =>
                user
                  ? navigate("/discover")
                  : openRegister()
              }
              style={{
                marginTop: 25,
                border: 0,
                borderRadius: 14,
                padding: "14px 22px",
                background: "#fff",
                color: "#4C32B9",
                fontWeight: 900,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {user ? "Explore SIX20" : "Join SIX20"}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            background: "#121024",
            color: "#fff",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "30px 20px",
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <span
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg,#6947F5,#FF7A66)",
                  fontSize: 11,
                  fontWeight: 950,
                }}
              >
                S20
              </span>

              <span style={{ fontWeight: 900 }}>
                SIX20
              </span>
            </div>

            <span
              style={{
                color:
                  "rgba(255,255,255,0.48)",
                fontSize: 12,
              }}
            >
              © {new Date().getFullYear()} SIX20 ·
              Where Entertainment Comes Alive.
            </span>
          </div>
        </footer>

        {/* AUTH MODAL */}
        {authOpen && (
          <div
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeAuth();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(15,10,30,0.64)",
              backdropFilter: "blur(8px)",
              display: "grid",
              placeItems: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "min(470px,100%)",
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 26,
                padding: 27,
                boxShadow:
                  "0 35px 110px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: 15,
                  marginBottom: 22,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#6947F5",
                      fontSize: 12,
                      fontWeight: 950,
                    }}
                  >
                    <Sparkles size={13} />
                    SIX20
                  </div>

                  <h2
                    style={{
                      margin: "6px 0 0",
                      fontSize: 29,
                      letterSpacing: "-1px",
                    }}
                  >
                    {authMode === "login"
                      ? "Welcome back"
                      : "Create your account"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeAuth}
                  aria-label="Close"
                  style={{
                    border: 0,
                    background: "#F3F0F8",
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <X size={19} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 7,
                  padding: 5,
                  borderRadius: 14,
                  background: "#F5F2FA",
                  marginBottom: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  style={{
                    ...tabButton,
                    ...(authMode === "login"
                      ? activeTabButton
                      : {}),
                  }}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  style={{
                    ...tabButton,
                    ...(authMode === "register"
                      ? activeTabButton
                      : {}),
                  }}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth}>
                {authMode === "register" && (
                  <>
                    <label style={labelStyle}>
                      Display name
                    </label>

                    <input
                      value={displayName}
                      onChange={(event) =>
                        setDisplayName(event.target.value)
                      }
                      placeholder="Your name"
                      style={inputStyle}
                    />

                    <label style={labelStyle}>
                      Username
                    </label>

                    <input
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      placeholder="yourusername"
                      autoComplete="username"
                      required
                      style={inputStyle}
                    />
                  </>
                )}

                <label style={labelStyle}>
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  style={inputStyle}
                />

                <label style={labelStyle}>
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 6 characters"
                  autoComplete={
                    authMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  minLength={6}
                  style={inputStyle}
                />

                {authError && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#FFF0EF",
                      color: "#B33A31",
                      fontSize: 14,
                    }}
                  >
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#EFFAF3",
                      color: "#18733C",
                      fontSize: 14,
                    }}
                  >
                    {authSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    ...primaryButton,
                    width: "100%",
                    padding: "14px 18px",
                    marginTop: 18,
                    opacity: authLoading ? 0.65 : 1,
                    cursor: authLoading
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "login"
                    ? "Login to SIX20"
                    : "Create SIX20 account"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              background: "rgba(15,10,30,0.60)",
              backdropFilter: "blur(7px)",
              padding: 16,
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "min(360px,100%)",
                marginLeft: "auto",
                background: "#fff",
                borderRadius: 24,
                padding: 20,
                boxShadow:
                  "0 30px 90px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <strong style={{ fontSize: 20 }}>
                  SIX20
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  style={{
                    border: 0,
                    background: "#F3F0F8",
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <MobileNav
                icon={<Compass size={18} />}
                text="Discover"
                onClick={() => navigate("/discover")}
              />

              <MobileNav
                icon={<Radio size={18} />}
                text="LIVE"
                onClick={() => navigate("/live")}
              />

              <MobileNav
                icon={<Gamepad2 size={18} />}
                text="Play"
                onClick={() => navigate("/games")}
              />

              <MobileNav
                icon={<MessageCircle size={18} />}
                text="Chat"
                onClick={() => navigate("/messages")}
              />

              <MobileNav
                icon={<ShoppingBag size={18} />}
                text="Market"
                onClick={() => navigate("/marketplace")}
              />

              <MobileNav
                icon={<Wallet size={18} />}
                text="Wallet"
                onClick={() => navigate("/wallet")}
              />

              <MobileNav
                icon={<UserRound size={18} />}
                text="Profile"
                onClick={() =>
                  user
                    ? navigate("/profile")
                    : openLogin()
                }
              />

              {!user && (
                <button
                  type="button"
                  onClick={openRegister}
                  style={{
                    ...primaryButton,
                    width: "100%",
                    marginTop: 8,
                    padding: "13px",
                  }}
                >
                  Join SIX20
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ---------- COMPONENTS ---------- */

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        background: "transparent",
        color: "#5D566B",
        padding: "9px 9px",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function MiniStat({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      {text}
    </span>
  );
}

function HeroTile({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background:
          "rgba(255,255,255,0.10)",
        border:
          "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        style={{
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {icon}
        {title}
      </div>

      <div
        style={{
          marginTop: 5,
          color:
            "rgba(255,255,255,0.58)",
          fontSize: 11,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function UniverseCard({
  icon,
  title,
  text,
  accent,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid #E8E3EF",
        background: "#fff",
        borderRadius: 20,
        padding: 19,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 43,
          height: 43,
          borderRadius: 13,
          display: "grid",
          placeItems: "center",
          background: `${accent}15`,
          color: accent,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: "15px 0 7px",
          fontSize: 17,
          letterSpacing: "-0.4px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#777083",
          lineHeight: 1.55,
          fontSize: 13,
        }}
      >
        {text}
      </p>

      <div
        style={{
          marginTop: 15,
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: accent,
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        Explore
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

function Pill({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 999,
        background: "#fff",
        border: "1px solid #E3DDED",
        color: "#5E576A",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {icon}
      {text}
    </span>
  );
}

function PreviewCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E4DFEC",
        borderRadius: 20,
        padding: 20,
        display: "grid",
        gridTemplateColumns: "40px 1fr",
        gap: 13,
        alignItems: "start",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          background: "#EEE9FF",
          color: "#6947F5",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {number}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontWeight: 900,
          }}
        >
          {icon}
          {title}
        </div>

        <p
          style={{
            margin: "7px 0 0",
            color: "#777083",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function EconomyCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 15,
        borderRadius: 16,
        background:
          "rgba(255,255,255,0.09)",
        border:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: 39,
          height: 39,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background:
            "rgba(255,255,255,0.10)",
        }}
      >
        {icon}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            fontSize: 12,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            display: "block",
            marginTop: 2,
            color:
              "rgba(255,255,255,0.55)",
            fontSize: 12,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

function BigFeature({
  icon,
  eyebrow,
  title,
  text,
  button,
  onClick,
  background,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  button: string;
  onClick: () => void;
  background: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #E5DFEC",
        borderRadius: 25,
        padding: 26,
        background,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          display: "grid",
          placeItems: "center",
          background: "#fff",
          color: "#6947F5",
          boxShadow:
            "0 7px 20px rgba(50,35,80,0.07)",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 21,
          color: "#6947F5",
          fontSize: 11,
          fontWeight: 950,
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          margin: "7px 0 9px",
          fontSize: 25,
          lineHeight: 1.08,
          letterSpacing: "-1px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#706A79",
          fontSize: 14,
          lineHeight: 1.65,
        }}
      >
        {text}
      </p>

      <button
        type="button"
        onClick={onClick}
        style={{
          ...secondaryButton,
          marginTop: 19,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        {button}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

function MobileNav({
  icon,
  text,
  onClick,
}: {
  icon: ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        border: 0,
        background: "#F7F4FC",
        marginBottom: 8,
        padding: 13,
        borderRadius: 13,
        display: "flex",
        alignItems: "center",
        gap: 10,
        textAlign: "left",
        fontWeight: 800,
        cursor: "pointer",
        color: "#302A3B",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

/* ---------- SHARED STYLES ---------- */

const primaryButton = {
  border: 0,
  background:
    "linear-gradient(135deg,#6947F5,#5A39D6)",
  color: "#fff",
  padding: "10px 15px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 850,
};

const secondaryButton = {
  border: "1px solid #DED8EA",
  background: "#fff",
  color: "#302B3C",
  padding: "10px 15px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800,
};

const tabButton = {
  flex: 1,
  border: 0,
  background: "transparent",
  padding: "10px",
  borderRadius: 9,
  cursor: "pointer",
  fontWeight: 800,
  color: "#716B7C",
};

const activeTabButton = {
  background: "#fff",
  color: "#6947F5",
  boxShadow:
    "0 2px 8px rgba(40,30,70,0.08)",
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  marginTop: 13,
  fontSize: 13,
  fontWeight: 800,
  color: "#4D4758",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #DDD7E8",
  borderRadius: 12,
  padding: "12px 13px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};