"use client";

import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreVertical,
  Play,
  RefreshCw,
  Share2,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/* =========================================================
   TYPES
========================================================= */

type Creator = {
  id?: number | string;
  username?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  profileImage?: string;
};

type Video = {
  id: number | string;

  title?: string;
  caption?: string;
  description?: string;

  videoUrl?: string;
  videoURL?: string;
  mediaUrl?: string;
  url?: string;

  thumbnailUrl?: string;
  thumbnail?: string;

  views?: number;
  likes?: number;
  comments?: number;

  liked?: boolean;
  isLiked?: boolean;

  createdAt?: string;

  user?: Creator;
  creator?: Creator;
};

/* =========================================================
   HELPERS
========================================================= */

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("six20-token") ||
    localStorage.getItem("token")
  );
}

function getVideoUrl(video: Video) {
  const value =
    video.videoUrl ||
    video.videoURL ||
    video.mediaUrl ||
    video.url;

  if (!value) {
    return "";
  }

  if (value.startsWith("http")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function getAvatar(video: Video) {
  const creator = video.creator || video.user;

  const avatar =
    creator?.avatar ||
    creator?.avatarUrl ||
    creator?.profileImage;

  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("http")) {
    return avatar;
  }

  if (avatar.startsWith("/")) {
    return `${API_URL}${avatar}`;
  }

  return `${API_URL}/${avatar}`;
}

function getCreator(video: Video) {
  const creator = video.creator || video.user;

  return (
    creator?.displayName ||
    creator?.name ||
    creator?.username ||
    "SIX20 Creator"
  );
}

function getUsername(video: Video) {
  const creator = video.creator || video.user;

  return creator?.username || "creator";
}

function formatNumber(value = 0) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return String(value);
}

function normalizeVideos(data: unknown): Video[] {
  if (Array.isArray(data)) {
    return data as Video[];
  }

  if (
    typeof data === "object" &&
    data !== null
  ) {
    const object = data as Record<string, unknown>;

    if (Array.isArray(object.videos)) {
      return object.videos as Video[];
    }

    if (Array.isArray(object.data)) {
      return object.data as Video[];
    }

    if (Array.isArray(object.items)) {
      return object.items as Video[];
    }
  }

  return [];
}

/* =========================================================
   MAIN FYP
========================================================= */

export default function FYPPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [liked, setLiked] = useState<
    Record<string, boolean>
  >({});

  const [likeCounts, setLikeCounts] = useState<
    Record<string, number>
  >({});

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  /* =====================================================
     LOAD VIDEOS
  ===================================================== */

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/videos`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      const list = normalizeVideos(data);

      setVideos(list);
      setActiveIndex(0);

      const initialLikes: Record<
        string,
        boolean
      > = {};

      const initialCounts: Record<
        string,
        number
      > = {};

      list.forEach((video) => {
        const id = String(video.id);

        initialLikes[id] =
          video.liked === true ||
          video.isLiked === true;

        initialCounts[id] =
          Number(video.likes || 0);
      });

      setLiked(initialLikes);
      setLikeCounts(initialCounts);
    } catch (err) {
      console.error(
        "SIX20 FYP error:",
        err
      );

      setError(
        "We couldn't load your FYP right now. Make sure the SIX20 backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  /* =====================================================
     ACTIVE VIDEO OBSERVER
  ===================================================== */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container || videos.length === 0) {
      return;
    }

    const cards =
      Array.from(
        container.querySelectorAll<HTMLElement>(
          "[data-fyp-card]"
        )
      );

    if (!cards.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const index = Number(
              (
                entry.target as HTMLElement
              ).dataset.index
            );

            if (!Number.isNaN(index)) {
              setActiveIndex(index);
            }
          });
        },
        {
          root: container,
          threshold: 0.65,
        }
      );

    cards.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  /* =====================================================
     PLAY ACTIVE VIDEO
  ===================================================== */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    const videoElements =
      container.querySelectorAll<HTMLVideoElement>(
        "video"
      );

    videoElements.forEach(
      (video, index) => {
        video.muted = muted;

        if (index === activeIndex) {
          video
            .play()
            .catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    );
  }, [
    activeIndex,
    muted,
    videos,
  ]);

  /* =====================================================
     LIKE
  ===================================================== */

  async function handleLike(video: Video) {
    const token = getToken();

    const id = String(video.id);

    if (!token) {
      setError(
        "Please log in to like videos."
      );

      return;
    }

    const previous =
      liked[id] === true;

    setLiked((current) => ({
      ...current,
      [id]: !previous,
    }));

    setLikeCounts((current) => ({
      ...current,
      [id]: Math.max(
        0,
        (current[id] ||
          Number(video.likes || 0)) +
          (previous ? -1 : 1)
      ),
    }));

    try {
      const response =
        await fetch(
          `${API_URL}/api/videos/${video.id}/like`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Like request failed"
        );
      }
    } catch (err) {
      console.error(err);

      setLiked((current) => ({
        ...current,
        [id]: previous,
      }));

      setLikeCounts((current) => ({
        ...current,
        [id]: Math.max(
          0,
          (current[id] ||
            Number(video.likes || 0)) +
            (previous ? 1 : -1)
        ),
      }));
    }
  }

  /* =====================================================
     SHARE
  ===================================================== */

  async function handleShare(video: Video) {
    const url =
      `${window.location.origin}/fyp?v=${video.id}`;

    const shareData = {
      title:
        video.title || "SIX20",
      text:
        video.caption ||
        video.description ||
        "Check this out on SIX20.",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(
          shareData
        );
      } else {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "SIX20 video link copied."
        );
      }
    } catch {
      // User cancelled sharing.
    }
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  function scrollToIndex(
    index: number
  ) {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    const card =
      container.querySelector<HTMLElement>(
        `[data-index="${index}"]`
      );

    card?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#0f0b22,#1b1734 55%,#251d49)",
          display: "grid",
          placeItems: "center",
          color: "white",
          fontFamily:
            "Inter,system-ui,sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background:
                "linear-gradient(135deg,#6947f5,#ff7a66)",
              display: "grid",
              placeItems: "center",
              margin:
                "0 auto 18px",
              fontWeight: 950,
              fontSize: 20,
              boxShadow:
                "0 15px 50px rgba(105,71,245,.4)",
            }}
          >
            S20
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              opacity: 0.85,
            }}
          >
            Loading your FYP...
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error &&
    videos.length === 0
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0f0b22",
          color: "white",
          display: "grid",
          placeItems: "center",
          padding: 24,
          fontFamily:
            "Inter,system-ui,sans-serif",
        }}
      >
        <div
          style={{
            width:
              "min(460px,100%)",
            textAlign: "center",
            padding: 32,
            borderRadius: 28,
            background:
              "rgba(255,255,255,.06)",
            border:
              "1px solid rgba(255,255,255,.1)",
          }}
        >
          <div
            style={{
              fontSize: 52,
              marginBottom: 14,
            }}
          >
            🔥
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 27,
              fontWeight: 950,
            }}
          >
            FYP is taking a break
          </h1>

          <p
            style={{
              color:
                "rgba(255,255,255,.65)",
              lineHeight: 1.6,
              margin:
                "12px 0 22px",
            }}
          >
            {error}
          </p>

          <button
            onClick={loadVideos}
            style={{
              border: 0,
              borderRadius: 999,
              padding:
                "13px 20px",
              color: "white",
              background:
                "linear-gradient(135deg,#6947f5,#ff7a66)",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={16}
              style={{
                verticalAlign:
                  "middle",
                marginRight: 7,
              }}
            />

            Try again
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     EMPTY
  ===================================================== */

  if (videos.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#0f0b22,#1b1734)",
          color: "white",
          display: "grid",
          placeItems: "center",
          padding: 24,
          fontFamily:
            "Inter,system-ui,sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 56,
              marginBottom: 14,
            }}
          >
            🎬
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 950,
            }}
          >
            Your FYP starts here
          </h1>

          <p
            style={{
              color:
                "rgba(255,255,255,.65)",
              marginTop: 10,
            }}
          >
            There are no videos
            available yet.
          </p>

          <button
            onClick={loadVideos}
            style={{
              marginTop: 18,
              border: 0,
              borderRadius: 999,
              padding:
                "12px 20px",
              color: "white",
              background:
                "#6947f5",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     FYP
  ===================================================== */

  return (
    <main
      style={{
        height: "100vh",
        width: "100%",
        background: "#000",
        overflow: "hidden",
        position: "relative",
        fontFamily:
          "Inter,system-ui,sans-serif",
      }}
    >
      {/* =================================================
          TOP BAR
      ================================================= */}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          padding:
            "0 20px",
          pointerEvents:
            "none",
          background:
            "linear-gradient(to bottom,rgba(0,0,0,.72),transparent)",
        }}
      >
        <button
          onClick={() =>
            window.history.back()
          }
          style={{
            pointerEvents:
              "auto",
            width: 42,
            height: 42,
            borderRadius:
              "50%",
            border:
              "1px solid rgba(255,255,255,.15)",
            background:
              "rgba(0,0,0,.35)",
            color: "white",
            display: "grid",
            placeItems:
              "center",
            cursor:
              "pointer",
            backdropFilter:
              "blur(12px)",
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          style={{
            color: "white",
            fontWeight: 950,
            fontSize: 21,
            letterSpacing:
              "-.04em",
          }}
        >
          SIX
          <span
            style={{
              color: "#ff7a66",
            }}
          >
            20
          </span>
        </div>

        <div
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: 900,
            background:
              "rgba(105,71,245,.78)",
            borderRadius: 999,
            padding:
              "8px 14px",
            backdropFilter:
              "blur(12px)",
          }}
        >
          FYP
        </div>
      </div>

      {/* =================================================
          VIDEO FEED
      ================================================= */}

      <div
        ref={containerRef}
        style={{
          height: "100vh",
          width: "100%",
          overflowY: "auto",
          scrollSnapType:
            "y mandatory",
          overscrollBehaviorY:
            "contain",
          scrollbarWidth:
            "none",
        }}
      >
        {videos.map(
          (video, index) => {
            const id =
              String(video.id);

            const creator =
              getCreator(video);

            const username =
              getUsername(video);

            const avatar =
              getAvatar(video);

            const videoUrl =
              getVideoUrl(video);

            const isLiked =
              liked[id] === true;

            const count =
              likeCounts[id] ??
              Number(
                video.likes || 0
              );

            return (
              <section
                key={id}
                data-fyp-card
                data-index={index}
                style={{
                  height: "100vh",
                  width: "100%",
                  position:
                    "relative",
                  scrollSnapAlign:
                    "start",
                  background:
                    "#090909",
                }}
              >
                {/* VIDEO */}

                {videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={
                      video.thumbnailUrl ||
                      video.thumbnail
                    }
                    playsInline
                    loop
                    muted={muted}
                    preload={
                      index ===
                      activeIndex
                        ? "auto"
                        : "metadata"
                    }
                    onClick={() =>
                      setMuted(
                        (value) =>
                          !value
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      inset: 0,
                      width:
                        "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",
                      cursor:
                        "pointer",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position:
                        "absolute",
                      inset: 0,
                      display:
                        "grid",
                      placeItems:
                        "center",
                      background:
                        "linear-gradient(135deg,#17122f,#321f42)",
                      color:
                        "white",
                    }}
                  >
                    <Play
                      size={60}
                    />
                  </div>
                )}

                {/* GRADIENT */}

                <div
                  style={{
                    position:
                      "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom,rgba(0,0,0,.3),transparent 25%,transparent 50%,rgba(0,0,0,.85) 100%)",
                    pointerEvents:
                      "none",
                  }}
                />

                {/* MUTE */}

                <button
                  onClick={() =>
                    setMuted(
                      (value) =>
                        !value
                    )
                  }
                  style={{
                    position:
                      "absolute",
                    top: 88,
                    right: 18,
                    zIndex: 10,
                    width: 44,
                    height: 44,
                    borderRadius:
                      "50%",
                    border:
                      "1px solid rgba(255,255,255,.2)",
                    background:
                      "rgba(0,0,0,.4)",
                    color:
                      "white",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    cursor:
                      "pointer",
                    backdropFilter:
                      "blur(10px)",
                  }}
                  aria-label={
                    muted
                      ? "Unmute"
                      : "Mute"
                  }
                >
                  {muted ? (
                    <VolumeX
                      size={19}
                    />
                  ) : (
                    <Volume2
                      size={19}
                    />
                  )}
                </button>

                {/* RIGHT ACTIONS */}

                <div
                  style={{
                    position:
                      "absolute",
                    right: 14,
                    bottom: 105,
                    zIndex: 10,
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    gap: 17,
                  }}
                >
                  <ActionButton
                    active={
                      isLiked
                    }
                    icon={
                      <Heart
                        size={27}
                        fill={
                          isLiked
                            ? "currentColor"
                            : "none"
                        }
                      />
                    }
                    label={formatNumber(
                      count
                    )}
                    onClick={() =>
                      handleLike(
                        video
                      )
                    }
                  />

                  <ActionButton
                    icon={
                      <MessageCircle
                        size={27}
                      />
                    }
                    label={formatNumber(
                      Number(
                        video.comments ||
                          0
                      )
                    )}
                    onClick={() =>
                      alert(
                        "Comments are coming next."
                      )
                    }
                  />

                  <ActionButton
                    icon={
                      <Share2
                        size={27}
                      />
                    }
                    label="Share"
                    onClick={() =>
                      handleShare(
                        video
                      )
                    }
                  />

                  <ActionButton
                    icon={
                      <MoreVertical
                        size={27}
                      />
                    }
                    label=""
                    onClick={() => {}}
                  />
                </div>

                {/* CREATOR / CAPTION */}

                <div
                  style={{
                    position:
                      "absolute",
                    left: 18,
                    right: 85,
                    bottom: 30,
                    zIndex: 10,
                    color:
                      "white",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 11,
                      marginBottom: 12,
                    }}
                  >
                    {/* AVATAR */}

                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius:
                          "50%",
                        overflow:
                          "hidden",
                        border:
                          "2px solid rgba(255,255,255,.8)",
                        background:
                          "linear-gradient(135deg,#6947f5,#ff7a66)",
                        display:
                          "grid",
                        placeItems:
                          "center",
                        flexShrink:
                          0,
                      }}
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={
                            creator
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontWeight:
                              950,
                            fontSize:
                              18,
                          }}
                        >
                          {creator
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* CREATOR */}

                    <div>
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              16,
                          }}
                        >
                          {creator}
                        </strong>

                        <button
                          style={{
                            border:
                              "1px solid rgba(255,255,255,.45)",
                            background:
                              "rgba(255,255,255,.12)",
                            color:
                              "white",
                            borderRadius:
                              999,
                            padding:
                              "4px 9px",
                            fontSize:
                              11,
                            fontWeight:
                              800,
                            cursor:
                              "pointer",
                          }}
                        >
                          <UserPlus
                            size={11}
                            style={{
                              verticalAlign:
                                "middle",
                              marginRight:
                                3,
                            }}
                          />

                          Follow
                        </button>
                      </div>

                      <div
                        style={{
                          opacity:
                            0.68,
                          fontSize:
                            12,
                          marginTop: 2,
                        }}
                      >
                        @{username}
                      </div>
                    </div>
                  </div>

                  {/* CAPTION */}

                  {(video.caption ||
                    video.description ||
                    video.title) && (
                    <div
                      style={{
                        fontSize:
                          15,
                        lineHeight:
                          1.45,
                        fontWeight:
                          600,
                        maxWidth:
                          520,
                        textShadow:
                          "0 2px 10px rgba(0,0,0,.7)",
                      }}
                    >
                      {video.caption ||
                        video.description ||
                        video.title}
                    </div>
                  )}

                  {/* VIEWS */}

                  <div
                    style={{
                      marginTop: 9,
                      fontSize: 12,
                      opacity: 0.65,
                    }}
                  >
                    👁{" "}
                    {formatNumber(
                      Number(
                        video.views ||
                          0
                      )
                    )}{" "}
                    views
                  </div>
                </div>
              </section>
            );
          }
        )}
      </div>

      {/* =================================================
          DESKTOP UP / DOWN CONTROLS
      ================================================= */}

      <div
        className="six20-fyp-desktop-nav"
        style={{
          position:
            "fixed",
          left: 18,
          top: "50%",
          transform:
            "translateY(-50%)",
          zIndex: 40,
          display:
            "flex",
          flexDirection:
            "column",
          gap: 8,
        }}
      >
        <button
          onClick={() =>
            scrollToIndex(
              Math.max(
                0,
                activeIndex - 1
              )
            )
          }
          style={navButtonStyle}
          aria-label="Previous video"
        >
          ↑
        </button>

        <button
          onClick={() =>
            scrollToIndex(
              Math.min(
                videos.length - 1,
                activeIndex + 1
              )
            )
          }
          style={navButtonStyle}
          aria-label="Next video"
        >
          ↓
        </button>
      </div>
    </main>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 0,
        background:
          "transparent",
        color: active
          ? "#ff536d"
          : "white",
        display:
          "flex",
        flexDirection:
          "column",
        alignItems:
          "center",
        gap: 4,
        cursor:
          "pointer",
        filter:
          "drop-shadow(0 3px 8px rgba(0,0,0,.6))",
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius:
            "50%",
          background:
            "rgba(0,0,0,.38)",
          backdropFilter:
            "blur(8px)",
          display:
            "grid",
          placeItems:
            "center",
        }}
      >
        {icon}
      </span>

      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "white",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

/* =========================================================
   NAV BUTTON
========================================================= */

const navButtonStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border:
    "1px solid rgba(255,255,255,.14)",
  background:
    "rgba(0,0,0,.42)",
  color: "white",
  cursor: "pointer",
  fontSize: 20,
  backdropFilter:
    "blur(10px)",
};