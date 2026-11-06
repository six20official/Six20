"use client";

import {
  ArrowLeft,
  Compass,
  Gamepad2,
  Heart,
  Home,
  MessageCircle,
  MoreVertical,
  Plus,
  Play,
  Radio,
  RefreshCw,
  Share2,
  UserPlus,
  UserCheck,
  UserRound,
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

type VideoComment = {
  id: number;
  videoId: number;
  userId: number;
  text: string;
  createdAt: string;
  user?: {
    id: number;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
};

/* =========================================================
   HELPERS
========================================================= */

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("six20-token") ||
    localStorage.getItem("token")
  );
}

function getVideoUrl(video: Video) {
  return (
    video.videoUrl ||
    video.videoURL ||
    video.mediaUrl ||
    video.url ||
    ""
  );
}

function getAvatar(video: Video) {
  return (
    video.creator?.avatarUrl ||
    video.creator?.avatar ||
    video.creator?.profileImage ||
    video.user?.avatarUrl ||
    video.user?.avatar ||
    video.user?.profileImage ||
    ""
  );
}

function getCreator(video: Video) {
  return (
    video.creator?.displayName ||
    video.creator?.username ||
    video.creator?.name ||
    video.user?.displayName ||
    video.user?.username ||
    video.user?.name ||
    "SIX20 Creator"
  );
}

function getUsername(video: Video) {
  return (
    video.creator?.username ||
    video.user?.username ||
    "creator"
  );
}

function formatNumber(value = 0) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(value);
}

function normalizeVideos(data: unknown): Video[] {
  if (Array.isArray(data)) return data as Video[];

  if (
    data &&
    typeof data === "object"
  ) {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.videos)) {
      return obj.videos as Video[];
    }

    if (Array.isArray(obj.data)) {
      return obj.data as Video[];
    }

    if (Array.isArray(obj.items)) {
      return obj.items as Video[];
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

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] =
    useState<Video | null>(null);
  const [videoComments, setVideoComments] =
    useState<VideoComment[]>([]);
  const [commentsLoading, setCommentsLoading] =
    useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] =
    useState(false);
  const [commentError, setCommentError] = useState("");

  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [clearScreen, setClearScreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [dismissedVideoIds, setDismissedVideoIds] =
    useState<string[]>([]);
  const [toast, setToast] = useState("");

  const [liked, setLiked] = useState<
    Record<string, boolean>
  >({});

  const [likeCounts, setLikeCounts] = useState<
    Record<string, number>
  >({});

  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

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

      const initialLikes: Record<string, boolean> = {};
      const initialCounts: Record<string, number> = {};

      list.forEach((video) => {
        const id = String(video.id);

        initialLikes[id] =
          video.liked === true ||
          video.isLiked === true;

        initialCounts[id] = Number(video.likes || 0);
      });

      setLiked(initialLikes);
      setLikeCounts(initialCounts);
    } catch (err) {
      console.error("SIX20 FYP error:", err);

      setError(
        "We couldn't load your FYP right now. Make sure the SIX20 backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  /* =====================================================
     ACTIVE VIDEO OBSERVER
  ===================================================== */

  useEffect(() => {
    const container = containerRef.current;

    if (!container || videos.length === 0) return;

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>(
        "[data-fyp-card]"
      )
    );

    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const index = Number(
            (entry.target as HTMLElement).dataset.index
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

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [videos, dismissedVideoIds]);

  /* =====================================================
     PLAY ACTIVE VIDEO
  ===================================================== */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoElements =
      container.querySelectorAll<HTMLVideoElement>("video");

    videoElements.forEach((video, index) => {
      video.muted = muted;
      video.playbackRate = playbackRate;

      if (index === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex, muted, playbackRate, videos]);

  /* =====================================================
     TOAST MESSAGE
  ===================================================== */

  function notify(message: string) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2500);
  }

  /* =====================================================
     LIKE VIDEO
  ===================================================== */
  async function handleFollow(video: Video) {
    const token = getToken();

    if (!token) {
      notify("Please log in before following a creator.");
      return;
    }

    const creatorId = Number(video.creator?.id ?? video.user?.id);

    if (!Number.isInteger(creatorId) || creatorId <= 0) {
      notify("Could not identify this creator.");
      return;
    }

    try {
      const savedUser = localStorage.getItem("six20-user");
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      if (Number(currentUser?.id) === creatorId) {
        notify("You cannot follow yourself.");
        return;
      }
    } catch {
      notify("Could not verify your account. Please log in again.");
      return;
    }

    const id = String(creatorId);

    if (followLoading[id]) return;

    setFollowLoading(current => ({ ...current, [id]: true }));

    try {
      const response = await fetch(
        `${API_URL}/api/users/${creatorId}/follow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update follow.");
      }

      setFollowing(current => ({
        ...current,
        [id]: Boolean(data.following),
      }));

      notify(data.following
        ? "You are now following this creator."
        : "You unfollowed this creator.");
    } catch (err) {
      console.error("SIX20 FYP follow error:", err);
      notify(err instanceof Error ? err.message : "Could not update follow.");
    } finally {
      setFollowLoading(current => ({ ...current, [id]: false }));
    }
  }

  async function handleLike(video: Video) {
    const token = getToken();

    if (!token) {
      notify("Please log in to like videos.");
      return;
    }

    const id = String(video.id);
    const wasLiked = liked[id] === true;

    setLiked((current) => ({
      ...current,
      [id]: !wasLiked,
    }));

    setLikeCounts((current) => ({
      ...current,
      [id]: Math.max(
        0,
        (current[id] ?? Number(video.likes || 0)) +
          (wasLiked ? -1 : 1)
      ),
    }));

    try {
      const response = await fetch(
        `${API_URL}/api/videos/${video.id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Like request failed.");
      }

      const data = await response.json();

      if (typeof data.liked === "boolean") {
        setLiked((current) => ({
          ...current,
          [id]: data.liked,
        }));
      }

      if (typeof data.likes === "number") {
        setLikeCounts((current) => ({
          ...current,
          [id]: data.likes,
        }));
      }
    } catch (err) {
      console.error(err);

      setLiked((current) => ({
        ...current,
        [id]: wasLiked,
      }));

      setLikeCounts((current) => ({
        ...current,
        [id]: Math.max(
          0,
          (current[id] ?? Number(video.likes || 0)) +
            (wasLiked ? 1 : -1)
        ),
      }));

      notify("Could not update your like. Try again.");
    }
  }

  /* =====================================================
     SHARE VIDEO
  ===================================================== */

  async function handleShare(video: Video) {
    const url =
      `${window.location.origin}/fyp?v=${video.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || "SIX20",
          text:
            video.caption ||
            video.description ||
            "Watch this on SIX20.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        notify("Video link copied.");
      }
    } catch {
      // User may cancel the share sheet.
    }
  }

  /* =====================================================
     COMMENTS
  ===================================================== */

  async function openComments(video: Video) {
    setSelectedVideo(video);
    setCommentsOpen(true);
    setCommentsLoading(true);
    setCommentError("");
    setCommentText("");
    setVideoComments([]);

    try {
      const response = await fetch(
        `${API_URL}/api/videos/${video.id}/comments`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load comments."
        );
      }

      setVideoComments(
        Array.isArray(data.comments)
          ? data.comments
          : []
      );
    } catch (err) {
      console.error("SIX20 comments error:", err);
      setCommentError(
        "Unable to load comments. Please try again."
      );
    } finally {
      setCommentsLoading(false);
    }
  }

  async function submitComment() {
    if (
      !selectedVideo ||
      !commentText.trim() ||
      commentSubmitting
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      setCommentError(
        "Please log in to join the conversation."
      );
      return;
    }

    setCommentSubmitting(true);
    setCommentError("");

    try {
      const response = await fetch(
        `${API_URL}/api/videos/${selectedVideo.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: commentText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not post comment."
        );
      }

      if (data.comment) {
        setVideoComments((current) => [
          data.comment,
          ...current,
        ]);
      }

      setVideos((current) =>
        current.map((item) =>
          String(item.id) === String(selectedVideo.id)
            ? {
                ...item,
                comments: Number(item.comments || 0) + 1,
              }
            : item
        )
      );

      setCommentText("");
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : "Could not post comment."
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  /* =====================================================
     DISMISS VIDEO
  ===================================================== */

  function hideVideo(video: Video) {
    setDismissedVideoIds((current) => [
      ...current,
      String(video.id),
    ]);

    setShowVideoMenu(false);
    notify("Video hidden from this session.");
  }

  /* =====================================================
     SCROLL
  ===================================================== */

  function scrollToIndex(index: number) {
    const root = containerRef.current;

    const card = root?.querySelector<HTMLElement>(
      `[data-index="${index}"]`
    );

    card?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const visibleVideos = videos.filter(
    (video) =>
      !dismissedVideoIds.includes(String(video.id))
  );

  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (loading) {
    return (
      <main className="six20-state-screen">
        <div className="six20-loader-mark">
          S<span>20</span>
        </div>

        <div className="six20-loader" />

        <p>Finding your next favorite...</p>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  /* =====================================================
     ERROR SCREEN
  ===================================================== */

  if (error && videos.length === 0) {
    return (
      <main className="six20-state-screen">
        <div className="six20-state-card">
          <div className="six20-empty-icon">âœ¦</div>

          <h1>We hit a small pause.</h1>

          <p>{error}</p>

          <button
            className="six20-primary-button"
            onClick={() => void loadVideos()}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  /* =====================================================
     EMPTY SCREEN
  ===================================================== */

  if (visibleVideos.length === 0) {
    return (
      <main className="six20-state-screen">
        <div className="six20-state-card">
          <div className="six20-empty-icon">âœ¦</div>

          <h1>Your FYP starts here.</h1>

          <p>
            There are no videos to show right now.
            Be the first to create something.
          </p>

          <a
            className="six20-primary-button"
            href="/create"
          >
            <Plus size={17} />
            Create a video
          </a>

          <button
            className="six20-secondary-button"
            onClick={() => {
              setDismissedVideoIds([]);
              void loadVideos();
            }}
          >
            Refresh feed
          </button>
        </div>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  /* =====================================================
     MAIN INTERFACE
  ===================================================== */

  return (
    <main className="six20-fyp">
      <header className="six20-topbar">
        <button
          className="six20-glass-button"
          onClick={() => window.location.assign("/home")}
          aria-label="Go back"
        >
          <ArrowLeft size={19} />
        </button>

        <a className="six20-wordmark" href="/fyp">
          SIX<span>20</span>
        </a>

        <div className="six20-feed-tabs">
          <span className="is-selected">For You</span>

          <span
            onClick={() =>
              window.location.assign("/discover")
            }
          >
            Following
          </span>
        </div>

        <button
          className="six20-glass-button"
          onClick={() =>
            window.location.assign("/discover")
          }
          aria-label="Discover"
        >
          <Compass size={19} />
        </button>
      </header>

      <div className="six20-feed" ref={containerRef}>
        {visibleVideos.map((video, index) => {
          const id = String(video.id);
          const creator = getCreator(video);
          const avatar = getAvatar(video);
          const url = getVideoUrl(video);
          const isLiked = liked[id] === true;
          const count =
            likeCounts[id] ?? Number(video.likes || 0);

          return (
            <section
              className="six20-video-card"
              key={id}
              data-fyp-card
              data-index={index}
            >
              {url ? (
                <video
                  src={url}
                  poster={
                    video.thumbnailUrl ||
                    video.thumbnail ||
                    undefined
                  }
                  playsInline
                  loop
                  muted={muted}
                  preload={
                    index === activeIndex
                      ? "auto"
                      : "metadata"
                  }
                  onClick={() =>
                    setClearScreen((value) => !value)
                  }
                  onDoubleClick={() => {
                    if (!isLiked) {
                      void handleLike(video);
                    }
                  }}
                />
              ) : (
                <div className="six20-video-placeholder">
                  <Play size={42} />
                  <p>Video unavailable</p>
                </div>
              )}

              <div className="six20-video-shade" />

              <div className="six20-video-top">
                <span className="six20-live-label">
                  <span />
                  SIX20
                </span>

                <div className="six20-top-actions">
                  <button
                    className="six20-glass-button"
                    onClick={() =>
                      setMuted((value) => !value)
                    }
                    aria-label={
                      muted ? "Unmute" : "Mute"
                    }
                  >
                    {muted ? (
                      <VolumeX size={19} />
                    ) : (
                      <Volume2 size={19} />
                    )}
                  </button>

                  <button
                    className="six20-glass-button"
                    onClick={() =>
                      setPlaybackRate((value) =>
                        value === 1 ? 1.5 : value === 1.5 ? 2 : 1
                      )
                    }
                    aria-label="Change playback speed"
                  >
                    {playbackRate}x
                  </button>
                </div>
              </div>

              {!clearScreen && (
                <>
                  <div className="six20-video-info">
                    <div className="six20-creator-row">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={creator}
                          className="six20-avatar"
                        />
                      ) : (
                        <div className="six20-avatar six20-avatar-fallback">
                          {creator.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="six20-creator-details">
                        <strong>{creator}</strong>
                        <span>
                          @{getUsername(video)}
                        </span>
                      </div>

                      <button
                        className="six20-follow-button"
                        disabled={followLoading[String(video.creator?.id ?? video.user?.id)] === true}
                        onClick={() => handleFollow(video)}
                      >
                        {following[String(video.creator?.id ?? video.user?.id)] ? (
                          <UserCheck size={14} />
                        ) : (
                          <UserPlus size={14} />
                        )}
                        {followLoading[String(video.creator?.id ?? video.user?.id)]
                          ? "Please wait..."
                          : following[String(video.creator?.id ?? video.user?.id)]
                            ? "Following"
                            : "Follow"}
                      </button>
                    </div>

                    {(video.caption ||
                      video.description) && (
                      <p className="six20-caption">
                        {video.caption ||
                          video.description}
                      </p>
                    )}

                    {video.title && (
                      <p className="six20-video-title">
                        {video.title}
                      </p>
                    )}
                  </div>

                  <aside className="six20-action-rail">
                    <ActionButton
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
                      label={formatNumber(count)}
                      active={isLiked}
                      onClick={() =>
                        void handleLike(video)
                      }
                    />

                    <ActionButton
                      icon={
                        <MessageCircle size={26} />
                      }
                      label={formatNumber(
                        Number(video.comments || 0)
                      )}
                      onClick={() =>
                        void openComments(video)
                      }
                    />

                    <ActionButton
                      icon={<Share2 size={25} />}
                      label="Share"
                      onClick={() =>
                        void handleShare(video)
                      }
                    />

                    <ActionButton
                      icon={<MoreVertical size={25} />}
                      label="More"
                      onClick={() =>
                        setShowVideoMenu(true)
                      }
                    />
                  </aside>
                </>
              )}

              <div className="six20-video-progress">
                <span />
              </div>
            </section>
          );
        })}
      </div>

      {/* BOTTOM NAVIGATION */}

      <nav className="six20-bottom-nav">
        <FYPNavItem
          icon={<Home size={21} />}
          label="Home"
          onClick={() =>
            window.location.assign("/home")
          }
        />

        <FYPNavItem
          icon={<Compass size={21} />}
          label="Discover"
          onClick={() =>
            window.location.assign("/discover")
          }
        />

        <button
          className="six20-create-button"
          onClick={() =>
            window.location.assign("/create")
          }
          aria-label="Create"
        >
          <Plus size={25} />
        </button>

        <FYPNavItem
          icon={<Radio size={21} />}
          label="LIVE"
          onClick={() =>
            window.location.assign("/live")
          }
        />

        <FYPNavItem
          icon={<UserRound size={21} />}
          label="Profile"
          onClick={() =>
            window.location.assign("/profile")
          }
        />
      </nav>

      {/* VIDEO OPTIONS */}

      {showVideoMenu && (
        <div
          className="six20-modal-backdrop"
          onClick={() => setShowVideoMenu(false)}
        >
          <div
            className="six20-action-sheet"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="six20-sheet-handle" />

            <h3>Video options</h3>

            <button
              onClick={() => {
                const current = visibleVideos[activeIndex];

                if (current) {
                  void handleShare(current);
                }

                setShowVideoMenu(false);
              }}
            >
              <Share2 size={19} />
              Share video
            </button>

            <button
              onClick={() => {
                const current = visibleVideos[activeIndex];

                if (current) {
                  hideVideo(current);
                }
              }}
            >
              <Gamepad2 size={19} />
              Not interested
            </button>

            <button
              className="six20-sheet-cancel"
              onClick={() => setShowVideoMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* COMMENTS PANEL */}

      {commentsOpen && selectedVideo && (
        <div
          className="six20-modal-backdrop six20-comments-backdrop"
          onClick={() => setCommentsOpen(false)}
        >
          <section
            className="six20-comments-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="six20-comments-header">
              <div className="six20-sheet-handle" />

              <h3>
                Comments
                <span>{videoComments.length}</span>
              </h3>

              <button
                className="six20-close-button"
                onClick={() =>
                  setCommentsOpen(false)
                }
                aria-label="Close comments"
              >
                Ã—
              </button>
            </div>

            <div className="six20-comments-list">
              {commentsLoading ? (
                <div className="six20-comments-loading">
                  <div className="six20-loader" />
                  Loading comments...
                </div>
              ) : videoComments.length === 0 ? (
                <div className="six20-no-comments">
                  <MessageCircle size={32} />
                  <strong>
                    Start the conversation
                  </strong>
                  <p>
                    Be the first to comment on this video.
                  </p>
                </div>
              ) : (
                videoComments.map((comment) => (
                  <article
                    className="six20-comment"
                    key={comment.id}
                  >
                    <div className="six20-comment-avatar">
                      {(
                        comment.user?.username ||
                        comment.user?.displayName ||
                        "S"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="six20-comment-content">
                      <strong>
                        {comment.user?.username ||
                          comment.user?.displayName ||
                          "SIX20 User"}
                      </strong>

                      <p>{comment.text}</p>

                      <time>
                        {comment.createdAt
                          ? new Date(
                              comment.createdAt
                            ).toLocaleDateString()
                          : ""}
                      </time>
                    </div>
                  </article>
                ))
              )}
            </div>

            {commentError && (
              <p className="six20-comment-error">
                {commentError}
              </p>
            )}

            <form
              className="six20-comment-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitComment();
              }}
            >
              <input
                value={commentText}
                onChange={(event) =>
                  setCommentText(event.target.value)
                }
                placeholder="Add a comment..."
                maxLength={1000}
              />

              <button
                type="submit"
                disabled={
                  !commentText.trim() ||
                  commentSubmitting
                }
                aria-label="Send comment"
              >
                âž¤
              </button>
            </form>
          </section>
        </div>
      )}

      {toast && (
        <div className="six20-toast">
          {toast}
        </div>
      )}

      <style jsx global>{styles}</style>
    </main>
  );
}

/* =========================================================
   NAV ITEM
========================================================= */

function FYPNavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`six20-nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`six20-action-button ${
        active ? "is-active" : ""
      }`}
      onClick={onClick}
    >
      <span className="six20-action-icon">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   GLOBAL STYLES
========================================================= */

const styles = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #080a12;
  color: #ffffff;
  font-family: Arial, Helvetica, sans-serif;
}

.six20-fyp {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #080a12;
  color: #ffffff;
}

.six20-topbar {
  position: absolute;
  z-index: 30;
  top: 0;
  left: 0;
  right: 0;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,.72),
    transparent
  );
}

.six20-wordmark {
  color: #fff;
  font-size: 25px;
  font-weight: 900;
  letter-spacing: -1.5px;
  text-decoration: none;
}

.six20-wordmark span,
.six20-loader-mark span {
  color: #f4bd54;
}

.six20-glass-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  background: rgba(255,255,255,.10);
  color: #fff;
  cursor: pointer;
}

.six20-feed-tabs {
  display: flex;
  gap: 22px;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
}

.six20-feed-tabs span {
  opacity: .65;
  cursor: pointer;
}

.six20-feed-tabs .is-selected {
  opacity: 1;
  position: relative;
}

.six20-feed-tabs .is-selected::after {
  content: "";
  position: absolute;
  bottom: -9px;
  left: 25%;
  width: 50%;
  height: 3px;
  border-radius: 5px;
  background: #f4bd54;
}

.six20-feed {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.six20-feed::-webkit-scrollbar {
  display: none;
}

.six20-video-card {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
  background: #11131c;
}

.six20-video-card video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #11131c;
}

.six20-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: rgba(255,255,255,.65);
  gap: 12px;
}

.six20-video-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      rgba(0,0,0,.38),
      transparent 23%,
      transparent 48%,
      rgba(0,0,0,.15) 65%,
      rgba(0,0,0,.82) 100%
    );
}

.six20-video-top {
  position: absolute;
  top: 76px;
  left: 18px;
  right: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.six20-top-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.six20-live-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 20px;
  background: rgba(0,0,0,.25);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.six20-live-label span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f4bd54;
  box-shadow: 0 0 12px #f4bd54;
}

.six20-video-info {
  position: absolute;
  left: 18px;
  right: 85px;
  bottom: 105px;
}

.six20-creator-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.six20-avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f4bd54;
}

.six20-avatar-fallback {
  display: grid;
  place-items: center;
  background: #262b3b;
  color: #f4bd54;
  font-size: 17px;
  font-weight: 900;
}

.six20-creator-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.six20-creator-details strong {
  font-size: 14px;
}

.six20-creator-details span {
  font-size: 11px;
  color: rgba(255,255,255,.7);
}

.six20-follow-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 11px;
  border: 1px solid #f4bd54;
  border-radius: 20px;
  background: rgba(244,189,84,.12);
  color: #f4bd54;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.six20-caption {
  margin: 0 0 8px;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.45;
  text-shadow: 0 2px 8px rgba(0,0,0,.7);
}

.six20-video-title {
  margin: 0;
  font-size: 12px;
  color: rgba(255,255,255,.75);
}

.six20-action-rail {
  position: absolute;
  right: 14px;
  bottom: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 17px;
}

.six20-action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  text-shadow: 0 2px 8px rgba(0,0,0,.7);
}

.six20-action-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: rgba(0,0,0,.23);
  backdrop-filter: blur(8px);
}

.six20-action-button.is-active {
  color: #ff5576;
}

.six20-video-progress {
  position: absolute;
  bottom: 76px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255,255,255,.15);
}

.six20-video-progress span {
  display: block;
  width: 0;
  height: 100%;
  background: #f4bd54;
}

.six20-bottom-nav {
  position: absolute;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px env(safe-area-inset-bottom);
  background: rgba(8,10,18,.92);
  border-top: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(16px);
}

.six20-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.55);
  font-size: 10px;
  cursor: pointer;
}

.six20-nav-item.active {
  color: #f4bd54;
}

.six20-create-button {
  display: grid;
  place-items: center;
  width: 43px;
  height: 35px;
  border: 0;
  border-radius: 11px;
  background: linear-gradient(135deg,#f4bd54,#e68d36);
  color: #11131c;
  cursor: pointer;
}

.six20-modal-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(5px);
}

.six20-action-sheet {
  width: 100%;
  max-width: 520px;
  padding: 14px 20px 28px;
  border-radius: 22px 22px 0 0;
  background: #171a25;
  box-shadow: 0 -10px 50px rgba(0,0,0,.3);
}

.six20-sheet-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto 18px;
  border-radius: 5px;
  background: rgba(255,255,255,.28);
}

.six20-action-sheet h3 {
  margin: 0 0 15px;
  font-size: 17px;
}

.six20-action-sheet button {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 15px 4px;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: transparent;
  color: #fff;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
}

.six20-action-sheet .six20-sheet-cancel {
  justify-content: center;
  margin-top: 8px;
  border: 0;
  color: #f4bd54;
  font-weight: 800;
}

.six20-comments-backdrop {
  align-items: flex-end;
}

.six20-comments-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  height: min(75vh, 680px);
  border-radius: 22px 22px 0 0;
  background: #171a25;
  overflow: hidden;
}

.six20-comments-header {
  position: relative;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  text-align: center;
}

.six20-comments-header .six20-sheet-handle {
  margin-bottom: 13px;
}

.six20-comments-header h3 {
  margin: 0;
  font-size: 16px;
}

.six20-comments-header h3 span {
  margin-left: 7px;
  color: #f4bd54;
}

.six20-close-button {
  position: absolute;
  top: 27px;
  right: 17px;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  color: #fff;
  font-size: 23px;
  cursor: pointer;
}

.six20-comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.six20-comments-loading,
.six20-no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: rgba(255,255,255,.65);
  text-align: center;
  font-size: 13px;
}

.six20-no-comments strong {
  color: #fff;
  font-size: 15px;
}

.six20-no-comments p {
  margin: 0;
}

.six20-comment {
  display: flex;
  gap: 11px;
  margin-bottom: 20px;
}

.six20-comment-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #30364a;
  color: #f4bd54;
  font-weight: 900;
}

.six20-comment-content {
  min-width: 0;
}

.six20-comment-content strong {
  font-size: 12px;
}

.six20-comment-content p {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.six20-comment-content time {
  font-size: 10px;
  color: rgba(255,255,255,.45);
}

.six20-comment-form {
  display: flex;
  gap: 10px;
  padding: 12px 15px;
  border-top: 1px solid rgba(255,255,255,.08);
}

.six20-comment-form input {
  flex: 1;
  min-width: 0;
  padding: 12px 15px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 25px;
  outline: none;
  background: #242938;
  color: #fff;
  font-size: 13px;
}

.six20-comment-form button {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border: 0;
  border-radius: 50%;
  background: #f4bd54;
  color: #171a25;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.six20-comment-form button:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.six20-comment-error {
  margin: 0;
  padding: 8px 16px;
  color: #ff8294;
  font-size: 12px;
}

.six20-toast {
  position: fixed;
  z-index: 200;
  left: 50%;
  bottom: 85px;
  transform: translateX(-50%);
  padding: 12px 18px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 30px;
  background: #252b3b;
  color: #fff;
  font-size: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,.3);
  white-space: nowrap;
}

.six20-state-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 100vh;
  padding: 25px;
  background: #080a12;
  color: #fff;
  text-align: center;
}

.six20-loader-mark {
  font-size: 42px;
  font-weight: 1000;
  letter-spacing: -3px;
}

.six20-loader {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255,255,255,.15);
  border-top-color: #f4bd54;
  border-radius: 50%;
  animation: six20-spin .8s linear infinite;
}

@keyframes six20-spin {
  to {
    transform: rotate(360deg);
  }
}

.six20-state-screen p {
  color: rgba(255,255,255,.65);
  font-size: 13px;
}

.six20-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 360px;
}

.six20-state-card h1 {
  margin: 0;
  font-size: 25px;
}

.six20-state-card p {
  line-height: 1.6;
}

.six20-empty-icon {
  display: grid;
  place-items: center;
  width: 65px;
  height: 65px;
  border: 1px solid rgba(244,189,84,.4);
  border-radius: 22px;
  background: rgba(244,189,84,.1);
  color: #f4bd54;
  font-size: 32px;
}

.six20-primary-button,
.six20-secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 43px;
  padding: 0 19px;
  border: 0;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.six20-primary-button {
  background: #f4bd54;
  color: #171a25;
}

.six20-secondary-button {
  border: 1px solid rgba(255,255,255,.15);
  background: transparent;
  color: #fff;
}

@media (min-width: 800px) {
  .six20-fyp {
    background: #080a12;
  }

  .six20-video-card {
    width: min(100%, 500px);
    height: 100%;
    margin: 0 auto;
    border-left: 1px solid rgba(255,255,255,.06);
    border-right: 1px solid rgba(255,255,255,.06);
  }

  .six20-topbar {
    left: 50%;
    width: min(100%, 500px);
    transform: translateX(-50%);
  }

  .six20-bottom-nav {
    left: 50%;
    width: min(100%, 500px);
    transform: translateX(-50%);
  }
}

@media (max-width: 380px) {
  .six20-wordmark {
    font-size: 21px;
  }

  .six20-feed-tabs {
    gap: 12px;
    font-size: 12px;
  }

  .six20-video-info {
    right: 75px;
  }

  .six20-action-rail {
    right: 8px;
  }
}
`;
