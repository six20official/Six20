"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

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

function getStoredUser(): UserData | null {
if (typeof window === "undefined") return null;

const stored = window.localStorage.getItem(USER_KEY);

if (!stored) return null;

try {
return JSON.parse(stored) as UserData;
} catch {
return null;
}
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
      throw new Error("Registration response was incomplete.");
    }

    saveAuth(data.token, data.user);
    setUser(data.user);
    setAuthSuccess("Your SIX20 account has been created.");

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

if (!authChecked) {
return (
<main
style={{
minHeight: "100vh",
display: "grid",
placeItems: "center",
background: "#F7F5FC",
color: "#1B1734",
fontFamily:
"Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
}}
>
<div
style={{
textAlign: "center",
padding: 30,
}}
>
<div
style={{
width: 58,
height: 58,
borderRadius: 18,
display: "grid",
placeItems: "center",
margin: "0 auto 16px",
background: "#6947F5",
color: "#fff",
fontWeight: 900,
fontSize: 20,
}}
>
S20 </div>
<strong>Loading SIX20...</strong>
    </div>
  </main>
);
}

return (
<main
style={{
minHeight: "100vh",
background: "#F7F5FC",
color: "#1B1734",
fontFamily:
"Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
}}
>
<header
style={{
position: "sticky",
top: 0,
zIndex: 20,
background: "rgba(247,245,252,0.94)",
backdropFilter: "blur(14px)",
borderBottom: "1px solid #E8E4F0",
}}
>
<div
style={{
maxWidth: 1180,
margin: "0 auto",
padding: "15px 20px",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 20,
}}
>
<button
type="button"
onClick={() => navigate("/")}
style={{
border: 0,
background: "transparent",
padding: 0,
display: "flex",
alignItems: "center",
gap: 10,
cursor: "pointer",
color: "#1B1734",
}}
>
<span
style={{
width: 42,
height: 42,
borderRadius: 13,
display: "grid",
placeItems: "center",
background:
"linear-gradient(135deg, #6947F5, #FF7A66)",
color: "#fff",
fontWeight: 900,
fontSize: 15,
}}
>
S20 </span>
<span
          style={{
            fontSize: 21,
            fontWeight: 950,
            letterSpacing: "-0.6px",
          }}
        >
          SIX20
        </span>
      </button>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/discover")}
          style={navButton}
        >
          Discover
        </button>

        <button
          type="button"
          onClick={() => navigate("/live")}
          style={navButton}
        >
          LIVE
        </button>

        <button
          type="button"
          onClick={() => navigate("/games")}
          style={navButton}
        >
          Play
        </button>

        <button
          type="button"
          onClick={() => navigate("/messages")}
          style={navButton}
        >
          Chat
        </button>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          style={navButton}
        >
          Market
        </button>
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {user ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              style={secondaryButton}
            >
              Wallet
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              style={primaryButton}
            >
              {user.displayName || user.username}
            </button>

            <button
              type="button"
              onClick={logout}
              style={secondaryButton}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openLogin}
              style={secondaryButton}
            >
              Login
            </button>

            <button
              type="button"
              onClick={openRegister}
              style={primaryButton}
            >
              Join SIX20
            </button>
          </>
        )}
      </div>
    </div>
  </header>

  <section
    style={{
      maxWidth: 1180,
      margin: "0 auto",
      padding: "80px 20px 55px",
      display: "grid",
      gridTemplateColumns:
        "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
      gap: 40,
      alignItems: "center",
    }}
  >
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 13px",
          borderRadius: 999,
          background: "#EEE9FF",
          color: "#6947F5",
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        AFRICA&apos;S ENTERTAINMENT UNIVERSE
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: "clamp(46px, 7vw, 82px)",
          lineHeight: 0.96,
          letterSpacing: "-4px",
          fontWeight: 950,
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
          maxWidth: 650,
          margin: "24px 0 0",
          fontSize: 19,
          lineHeight: 1.65,
          color: "#6F6A7C",
        }}
      >
        Discover creators, watch LIVE entertainment, play games,
        connect with people, shop, chat and earn � all inside one
        connected SIX20 experience.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 30,
        }}
      >
        <button
          type="button"
          onClick={() =>
            user ? navigate("/live") : openRegister()
          }
          style={{
            ...primaryButton,
            padding: "14px 21px",
            fontSize: 15,
          }}
        >
          {user ? "Explore LIVE" : "Join SIX20"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/discover")}
          style={{
            ...secondaryButton,
            padding: "14px 21px",
            fontSize: 15,
          }}
        >
          Discover
        </button>
      </div>

      {user && (
        <div
          style={{
            marginTop: 22,
            padding: 15,
            borderRadius: 16,
            background: "#FFFFFF",
            border: "1px solid #E7E2F1",
            display: "inline-block",
          }}
        >
          Welcome,{" "}
          <strong>
            {user.displayName || user.username}
          </strong>
          .
        </div>
      )}
    </div>

    <div
      style={{
        position: "relative",
        minHeight: 470,
        borderRadius: 34,
        overflow: "hidden",
        background:
          "linear-gradient(145deg, #1B1734 0%, #33256D 48%, #6947F5 100%)",
        padding: 25,
        boxShadow: "0 25px 70px rgba(40,25,100,0.20)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 230,
          height: 230,
          borderRadius: "50%",
          background: "#FF7A66",
          opacity: 0.32,
          right: -70,
          top: -65,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "#6947F5",
          opacity: 0.55,
          left: -70,
          bottom: -60,
        }}
      />

      <div
        style={{
          position: "relative",
          height: "100%",
          minHeight: 420,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "7px 11px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            SIX20 LIVE
          </span>

          <h2
            style={{
              color: "#fff",
              fontSize: 40,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
              margin: "22px 0 12px",
            }}
          >
            Your world.
            <br />
            Your vibe.
            <br />
            Live on SIX20.
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            LIVE creators, games, music, conversations and
            entertainment built for community.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <Feature label="LIVE" text="Creators" />
          <Feature label="PLAY" text="Games" />
          <Feature label="CHAT" text="Community" />
          <Feature label="MARKET" text="Shopping" />
        </div>
      </div>
    </div>
  </section>

  <section
    style={{
      maxWidth: 1180,
      margin: "0 auto",
      padding: "20px 20px 70px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        alignItems: "end",
        marginBottom: 20,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#6947F5",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          THE SIX20 EXPERIENCE
        </p>

        <h2
          style={{
            margin: "7px 0 0",
            fontSize: 34,
            letterSpacing: "-1px",
          }}
        >
          Everything connected.
        </h2>
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}
    >
      <EcosystemItem
        title="SIX20 LIVE"
        text="Go live, watch creators and interact with your community."
        action="Open LIVE"
        onClick={() => navigate("/live")}
      />

      <EcosystemItem
        title="SIX20 PLAY"
        text="Play casual games and build competitive community experiences."
        action="Play games"
        onClick={() => navigate("/games")}
      />

      <EcosystemItem
        title="SIX20 CHAT"
        text="Connect with people and continue conversations beyond LIVE."
        action="Open Chat"
        onClick={() => navigate("/messages")}
      />

      <EcosystemItem
        title="SIX20 MARKET"
        text="Discover products, sellers and entertainment-related offers."
        action="Visit Market"
        onClick={() => navigate("/marketplace")}
      />

      <EcosystemItem
        title="SIX20 WALLET"
        text="Keep your SIX20 earnings and transactions connected."
        action="Open Wallet"
        onClick={() => navigate("/wallet")}
      />

      <EcosystemItem
        title="SIX20 PROFILE"
        text="Build your identity, audience and creator presence."
        action="View Profile"
        onClick={() =>
          user ? navigate("/profile") : openLogin()
        }
      />
    </div>
  </section>

  <section
    style={{
      background: "#1B1734",
      color: "#fff",
    }}
  >
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "65px 20px",
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1fr) minmax(260px, 0.7fr)",
        gap: 35,
        alignItems: "center",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#B8A9FF",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          BUILT FOR CREATORS AND COMMUNITIES
        </p>

        <h2
          style={{
            margin: "10px 0",
            fontSize: 38,
            letterSpacing: "-1.2px",
          }}
        >
          One platform.
          <br />
          Many ways to participate.
        </h2>

        <p
          style={{
            margin: 0,
            maxWidth: 620,
            color: "rgba(255,255,255,0.70)",
            lineHeight: 1.7,
          }}
        >
          SIX20 brings entertainment, LIVE interaction, games,
          community, marketplace experiences and creator
          monetization together.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        <DarkItem title="LIVE" text="Watch and create." />
        <DarkItem title="PLAY" text="Play and interact." />
        <DarkItem title="CHAT" text="Connect and communicate." />
        <DarkItem title="EARN" text="Participate in the SIX20 economy." />
      </div>
    </div>
  </section>

  <footer
    style={{
      maxWidth: 1180,
      margin: "0 auto",
      padding: "25px 20px",
      color: "#777184",
      fontSize: 13,
      display: "flex",
      justifyContent: "space-between",
      gap: 15,
      flexWrap: "wrap",
    }}
  >
    <span>� {new Date().getFullYear()} SIX20</span>
    <span>Where Entertainment Comes Alive.</span>
  </footer>

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
        background: "rgba(15,10,30,0.58)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          background: "#fff",
          borderRadius: 24,
          padding: 25,
          boxShadow: "0 30px 100px rgba(0,0,0,0.25)",
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
            <p
              style={{
                margin: 0,
                color: "#6947F5",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              SIX20
            </p>

            <h2
              style={{
                margin: "5px 0 0",
                fontSize: 28,
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
            style={{
              border: 0,
              background: "#F3F0F8",
              width: 36,
              height: 36,
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            �
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 5,
            borderRadius: 13,
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

  {mobileMenuOpen && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,10,30,0.55)",
        padding: 20,
      }}
      onClick={() => setMobileMenuOpen(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(360px, 100%)",
          marginLeft: "auto",
          background: "#fff",
          borderRadius: 22,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>SIX20 Menu</h3>

        <button
          type="button"
          onClick={() => navigate("/discover")}
          style={mobileMenuButton}
        >
          Discover
        </button>

        <button
          type="button"
          onClick={() => navigate("/live")}
          style={mobileMenuButton}
        >
          LIVE
        </button>

        <button
          type="button"
          onClick={() => navigate("/games")}
          style={mobileMenuButton}
        >
          Play
        </button>

        <button
          type="button"
          onClick={() => navigate("/messages")}
          style={mobileMenuButton}
        >
          Chat
        </button>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          style={mobileMenuButton}
        >
          Market
        </button>

        <button
          type="button"
          onClick={() => navigate("/wallet")}
          style={mobileMenuButton}
        >
          Wallet
        </button>

        <button
          type="button"
          onClick={() =>
            user ? navigate("/profile") : openLogin()
          }
          style={mobileMenuButton}
        >
          Profile
        </button>
      </div>
    </div>
  )}
</main>
);
}

function Feature({
label,
text,
}: {
label: string;
text: string;
}) {
return (
<div
style={{
padding: 14,
borderRadius: 16,
background: "rgba(255,255,255,0.12)",
border: "1px solid rgba(255,255,255,0.12)",
}}
>
<div
style={{
color: "#fff",
fontWeight: 900,
fontSize: 12,
}}
>
{label} </div>
<div
    style={{
      marginTop: 3,
      color: "rgba(255,255,255,0.68)",
      fontSize: 12,
    }}
  >
    {text}
  </div>
</div>
);
}

function EcosystemItem({
title,
text,
action,
onClick,
}: {
title: string;
text: string;
action: string;
onClick: () => void;
}) {
return (
<div
style={{
background: "#fff",
border: "1px solid #E8E4F0",
borderRadius: 20,
padding: 20,
}}
>
<h3
style={{
margin: 0,
fontSize: 19,
}}
>
{title} </h3>
<p
    style={{
      margin: "9px 0 18px",
      color: "#777184",
      lineHeight: 1.55,
      fontSize: 14,
    }}
  >
    {text}
  </p>

  <button
    type="button"
    onClick={onClick}
    style={{
      ...secondaryButton,
      fontSize: 13,
      padding: "9px 12px",
    }}
  >
    {action}
  </button>
</div>
);
}

function DarkItem({
title,
text,
}: {
title: string;
text: string;
}) {
return (
<div
style={{
padding: 15,
borderRadius: 15,
background: "rgba(255,255,255,0.08)",
border: "1px solid rgba(255,255,255,0.08)",
}}
> <strong>{title}</strong>
<div
    style={{
      marginTop: 3,
      color: "rgba(255,255,255,0.65)",
      fontSize: 13,
    }}
  >
    {text}
  </div>
</div>
);
}

const navButton = {
border: 0,
background: "transparent",
padding: "9px 10px",
borderRadius: 10,
cursor: "pointer",
color: "#4F4A5C",
fontWeight: 700,
};

const primaryButton = {
border: 0,
background: "#6947F5",
color: "#fff",
padding: "10px 15px",
borderRadius: 12,
cursor: "pointer",
fontWeight: 800,
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
boxShadow: "0 2px 8px rgba(40,30,70,0.08)",
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

const mobileMenuButton = {
width: "100%",
border: 0,
background: "#F7F4FC",
marginBottom: 8,
padding: "13px",
borderRadius: 12,
textAlign: "left" as const,
fontWeight: 800,
cursor: "pointer",
};

