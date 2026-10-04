"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageCircle,
  Radio,
  Search,
  UserPlus,
  UserCheck,
  Play,
  RefreshCw,
} from "lucide-react";

import FeatureShell, {
  Card,
  btn,
} from "../../components/FeatureShell";
import { apiFetch } from "../../lib/api";

type VideoUser = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

type Video = {
  id: number;
  videoUrl: string;
  caption?: string | null;
  soundTitle?: string | null;
  createdAt: string;
  user: VideoUser;
  _count?: {
    likes: number;
    comments: number;
  };
};

type Comment = {
  id: number;
  text: string;
  createdAt: string;
  user: VideoUser;
};

type VideoState = Video & {
  liked: boolean;
  likeCount: number;
  following: boolean;
  commentsOpen: boolean;
  comments: Comment[];
  commentsLoading: boolean;
  commentText: string;
};

const tokenKeys = [
  "six20-token",
  "token",
  "accessToken",
];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);

    if (token) {
      return token;
    }
  }

  return "";
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

const discoveryLinks = [
  {
    title: "SIX20 Live",
    text: "Watch creators and communities live.",
    tag: "LIVE",
    href: "/live",
  },
  {
    title: "Play",
    text: "Challenge friends with games and quizzes.",
    tag: "PLAY",
    href: "/games",
  },
  {
    title: "Music",
    text: "Discover sounds, artists and entertainment.",
    tag: "MUSIC",
    href: "/discover",
  },
  {
    title: "Events",
    text: "Find events and experiences around you.",
    tag: "EVENTS",
    href: "/discover",
  },
  {
    title: "Market",
    text: "Discover products, offers and creator picks.",
    tag: "MARKET",
    href: "/marketplace",
  },
  {
    title: "Creators",
    text: "Find creators and communities to follow.",
    tag: "CREATORS",
    href: "/discover",
  },
];

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DiscoverPage() {
  const [videos, setVideos] = useState<VideoState[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadVideos(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await apiFetch("/api/videos?limit=50");

      const loadedVideos: Video[] = Array.isArray(data?.videos)
        ? data.videos
        : [];

      setVideos(
        loadedVideos.map((video) => ({
          ...video,
          liked: false,
          likeCount: video._count?.likes ?? 0,
          following: false,
          commentsOpen: false,
          comments: [],
          commentsLoading: false,
          commentText: "",
        }))
      );
    } catch (err) {
      console.error("SIX20 Discover error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load SIX20 content."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return videos;
    }

    return videos.filter((video) => {
      const caption = video.caption?.toLowerCase() || "";
      const username = video.user.username.toLowerCase();
      const displayName =
        video.user.displayName?.toLowerCase() || "";
      const sound = video.soundTitle?.toLowerCase() || "";

      return (
        caption.includes(search) ||
        username.includes(search) ||
        displayName.includes(search) ||
        sound.includes(search)
      );
    });
  }, [videos, query]);

  async function toggleLike(videoId: number) {
    const token = getToken();

    if (!token) {
      setActionError("Please log in before liking a video.");
      return;
    }

    setActionError("");

    const current = videos.find((video) => video.id === videoId);

    if (!current) {
      return;
    }

    try {
      const data = await apiFetch(
        `/api/videos/${videoId}/like`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                liked:
                  data?.liked ??
                  !video.liked,
                likeCount:
                  data?.liked
                    ? video.likeCount + 1
                    : Math.max(0, video.likeCount - 1),
              }
            : video
        )
      );
    } catch (err) {
      console.error("SIX20 like error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not update like."
      );
    }
  }

  async function toggleFollow(videoId: number) {
    const token = getToken();

    if (!token) {
      setActionError("Please log in before following a creator.");
      return;
    }

    const current = videos.find((video) => video.id === videoId);

    if (!current) {
      return;
    }

    setActionError("");

    try {
      const data = await apiFetch(
        `/api/users/${current.user.id}/follow`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.user.id === current.user.id
            ? {
                ...video,
                following:
                  data?.following ??
                  !video.following,
              }
            : video
        )
      );
    } catch (err) {
      console.error("SIX20 follow error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not update follow."
      );
    }
  }

  async function toggleComments(videoId: number) {
    const current = videos.find((video) => video.id === videoId);

    if (!current) {
      return;
    }

    if (current.commentsOpen) {
      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                commentsOpen: false,
              }
            : video
        )
      );

      return;
    }

    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              commentsOpen: true,
              commentsLoading: true,
            }
          : video
      )
    );

    try {
      const data = await apiFetch(
        `/api/videos/${videoId}/comments`
      );

      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                comments: Array.isArray(data?.comments)
                  ? data.comments
                  : [],
                commentsLoading: false,
              }
            : video
        )
      );
    } catch (err) {
      console.error("SIX20 comments error:", err);

      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                commentsLoading: false,
              }
            : video
        )
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not load comments."
      );
    }
  }

  function updateCommentText(
    videoId: number,
    value: string
  ) {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              commentText: value,
            }
          : video
      )
    );
  }

  async function submitComment(videoId: number) {
    const token = getToken();

    if (!token) {
      setActionError("Please log in before commenting.");
      return;
    }

    const current = videos.find((video) => video.id === videoId);

    if (!current || !current.commentText.trim()) {
      return;
    }

    setActionError("");

    try {
      const data = await apiFetch(
        `/api/videos/${videoId}/comments`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            text: current.commentText.trim(),
          }),
        }
      );

      if (!data?.comment) {
        throw new Error("Comment was not returned by SIX20.");
      }

      setVideos((currentVideos) =>
        currentVideos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                comments: [
                  data.comment,
                  ...video.comments,
                ],
                commentText: "",
              }
            : video
        )
      );
    } catch (err) {
      console.error("SIX20 comment error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not post comment."
      );
    }
  }

  return (
    <FeatureShell
      title="Discover"
      subtitle="Explore real entertainment, creators and communities across SIX20."
    >
      {/* SEARCH */}
      <Card>
        <div className="flex items-center gap-3">
          <Search
            size={20}
            className="shrink-0 text-[#6C3BFF]"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators, captions or sounds..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#9A94A5]"
          />

          <button
            type="button"
            onClick={() => loadVideos(true)}
            disabled={refreshing}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-white transition hover:shadow-md disabled:opacity-50"
            title="Refresh Discover"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </Card>

      {/* QUICK DISCOVERY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginTop: 18,
        }}
      >
        {discoveryLinks.map((item) => (
          <Card key={item.title}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.65,
                marginBottom: 10,
                fontWeight: 700,
              }}
            >
              {item.tag}
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 21,
              }}
            >
              {item.title}
            </h2>

            <p
              style={{
                opacity: 0.7,
                lineHeight: 1.5,
                minHeight: 48,
              }}
            >
              {item.text}
            </p>

            <Link
              href={item.href}
              style={btn}
            >
              Explore
            </Link>
          </Card>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-700">
          {actionError}
        </div>
      )}

      {/* REAL CONTENT */}
      <div className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C3BFF]">
              Real SIX20 content
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Latest videos
            </h2>
          </div>

          <span className="text-sm text-[#756F80]">
            {filteredVideos.length}{" "}
            {filteredVideos.length === 1
              ? "video"
              : "videos"}
          </span>
        </div>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#6C3BFF]/20 border-t-[#6C3BFF]" />

                <p className="text-sm font-semibold">
                  Loading SIX20 content...
                </p>

                <p className="mt-1 text-xs text-[#756F80]">
                  Connecting to the SIX20 database.
                </p>
              </div>
            </div>
          </Card>
        ) : filteredVideos.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#6C3BFF]/10 text-[#6C3BFF]">
                <Play size={27} />
              </div>

              <h3 className="text-xl font-black">
                {query
                  ? "No matching content"
                  : "No videos yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756F80]">
                {query
                  ? `Nothing in SIX20 matches "${query}".`
                  : "No public videos have been published yet. Upload the first real SIX20 video."}
              </p>

              {!query && (
                <Link
                  href="/create"
                  style={{
                    ...btn,
                    marginTop: 20,
                  }}
                >
                  Create the first video
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden !p-0"
              >
                {/* VIDEO */}
                <div className="bg-black">
                  <video
                    src={video.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[620px] w-full object-contain"
                  />
                </div>

                {/* CREATOR */}
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {video.user.avatarUrl ? (
                      <img
                        src={video.user.avatarUrl}
                        alt={video.user.displayName}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#17132F] text-sm font-black text-white">
                        {(
                          video.user.displayName ||
                          video.user.username ||
                          "S"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {video.user.displayName ||
                          video.user.username}
                      </p>

                      <p className="truncate text-xs text-[#756F80]">
                        @{video.user.username}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleFollow(video.id)
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        video.following
                          ? "bg-black/[0.06] text-[#17132F]"
                          : "bg-[#6C3BFF] text-white"
                      }`}
                    >
                      {video.following ? (
                        <UserCheck size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}

                      {video.following
                        ? "Following"
                        : "Follow"}
                    </button>
                  </div>

                  {/* CAPTION */}
                  {video.caption && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#373142]">
                      {video.caption}
                    </p>
                  )}

                  {/* SOUND */}
                  {video.soundTitle && (
                    <div className="mt-3 inline-flex rounded-full bg-[#6C3BFF]/10 px-3 py-1.5 text-xs font-semibold text-[#6C3BFF]">
                      ♪ {video.soundTitle}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="mt-5 flex items-center gap-2 border-t border-black/[0.06] pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        toggleLike(video.id)
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                        video.liked
                          ? "bg-red-50 text-red-600"
                          : "bg-black/[0.04] text-[#17132F]"
                      }`}
                    >
                      <Heart
                        size={17}
                        fill={
                          video.liked
                            ? "currentColor"
                            : "none"
                        }
                      />

                      {video.likeCount}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleComments(video.id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 py-2 text-sm font-bold text-[#17132F]"
                    >
                      <MessageCircle size={17} />

                      {video._count?.comments ?? 0}
                    </button>

                    <span className="ml-auto text-xs text-[#9A94A5]">
                      {formatDate(video.createdAt)}
                    </span>
                  </div>

                  {/* COMMENTS */}
                  {video.commentsOpen && (
                    <div className="mt-5 rounded-2xl bg-[#F8F6F1] p-4">
                      <h3 className="mb-3 text-sm font-black">
                        Comments
                      </h3>

                      {video.commentsLoading ? (
                        <p className="text-xs text-[#756F80]">
                          Loading comments...
                        </p>
                      ) : video.comments.length === 0 ? (
                        <p className="text-xs text-[#756F80]">
                          No comments yet. Start the conversation.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {video.comments.map(
                            (comment) => (
                              <div
                                key={comment.id}
                                className="rounded-xl bg-white p-3"
                              >
                                <div className="flex items-center gap-2">
                                  {comment.user.avatarUrl ? (
                                    <img
                                      src={
                                        comment.user.avatarUrl
                                      }
                                      alt={
                                        comment.user.displayName
                                      }
                                      className="h-7 w-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-7 w-7 place-items-center rounded-full bg-[#17132F] text-[10px] font-bold text-white">
                                      {comment.user.username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  <span className="text-xs font-bold">
                                    {comment.user.displayName ||
                                      comment.user.username}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-5 text-[#373142]">
                                  {comment.text}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <input
                          value={video.commentText}
                          onChange={(event) =>
                            updateCommentText(
                              video.id,
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey
                            ) {
                              event.preventDefault();
                              submitComment(video.id);
                            }
                          }}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-[#6C3BFF]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            submitComment(video.id)
                          }
                          style={{
                            ...btn,
                            padding: "10px 14px",
                          }}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* LIVE CTA */}
      <div className="mt-10 overflow-hidden rounded-[28px] bg-[#17132F] p-6 text-white md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <Radio size={14} />
              SIX20 LIVE
            </div>

            <h2 className="text-2xl font-black">
              Something happening live?
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
              Join creators and communities in real time.
            </p>
          </div>

          <Link
            href="/live"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#17132F] transition hover:scale-[1.02]"
          >
            Explore LIVE
          </Link>
        </div>
      </div>
    </FeatureShell>
  );
}