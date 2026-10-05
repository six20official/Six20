"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Copy,
  Gift,
  Heart,
  LogIn,
  LogOut,
  MessageCircle,
  Radio,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import LiveKitStage from "../../components/live/LiveKitStage";

type User = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

type Live = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  creatorId: number;
  viewerCount: number;
  likes?: number;
  creator?: User;
};

type Chat = {
  id: number;
  text: string;
  createdAt: string;
  user: User;
  isPinned?: boolean;
};

type GiftEvent = {
  id?: string;
  giftName: string;
  giftIcon?: string | null;
  quantity: number;
  senderUsername: string;
  creatorUsername: string;
  totalNaira: number;
  creatorEarnNaira?: number;
  timestamp: string;
};

type Gift = {
  id: number;
  name: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  priceKobo: number;
  priceNaira: number;
  isActive: boolean;
};

const auth = () => ({
  Authorization: `Bearer ${
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("six20-token") || ""
  }`,
});

const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);

function mergeLive(
  previous: Live | null,
  incoming: Live,
): Live {
  return {
    ...previous,
    ...incoming,
    creator: incoming.creator ?? previous?.creator,
    likes: incoming.likes ?? previous?.likes ?? 0,
  };
}

function creatorLabel(live: Live) {
  return live.creator
    ? `${live.creator.displayName} · @${live.creator.username}`
    : `Creator #${live.creatorId}`;
}

export default function LivePage() {
  const [lives, setLives] = useState<Live[]>([]);
  const [live, setLive] = useState<Live | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<number | null>(null);

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [giftEvents, setGiftEvents] = useState<GiftEvent[]>([]);
  const [giftCursor, setGiftCursor] = useState("");

  const [joined, setJoined] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState("");
  const [chatText, setChatText] = useState("");
  const [giftId, setGiftId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [giftKey, setGiftKey] = useState("");

  const chatEndRef =
    useRef<HTMLDivElement | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("six20-token")
      : null;

  const isHost = Boolean(
    user &&
      live &&
      live.creatorId === user.id,
  );

  const canUseChat =
    joined ||
    Boolean(
      live &&
        user &&
        live.creatorId === user.id,
    );

  const shareUrl =
    typeof window !== "undefined" && live
      ? `${window.location.origin}/live?live=${live.id}`
      : "";

  const selectedGift = useMemo(
    () =>
      gifts.find(
        (gift) => String(gift.id) === giftId,
      ) ?? null,
    [gifts, giftId],
  );

  const loadLives = useCallback(async () => {
    const response = await apiFetch("/api/live");

    setLives(
      (response.lives || []).map(
        (item: Live) => ({
          ...item,
          likes: item.likes ?? 0,
        }),
      ),
    );
  }, []);

  const loadLive = useCallback(
    async (id: number) => {
      const response = await apiFetch(
        `/api/live/${id}`,
      );

      const nextLive = response.live as Live;

      setLive((current) =>
        mergeLive(current, nextLive),
      );

      return nextLive;
    },
    [],
  );

  const loadChat = useCallback(
    async (id: number) => {
      const response = await apiFetch(
        `/api/live/${id}/chat`,
        {
          headers: auth(),
        },
      );

      setMessages(response.messages || []);
    },
    [],
  );

  const loadWallet = useCallback(async () => {
    if (!token) return;

    const response = await apiFetch(
      "/api/wallet",
      {
        headers: auth(),
      },
    );

    setWallet(
      response.wallet?.availableKobo ?? null,
    );
  }, [token]);

  useEffect(() => {
    loadLives().catch((error) => {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not load LIVE.",
      );
    });

    apiFetch("/api/gifts")
      .then((response) => {
        setGifts(
          (response.gifts || []).filter(
            (gift: Gift) =>
              gift.isActive &&
              gift.priceKobo > 0,
          ),
        );
      })
      .catch(() => {
        setNotice("Could not load gifts.");
      });

    if (!token) return;

    apiFetch("/api/auth/me", {
      headers: auth(),
    })
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        setNotice(
          "Please sign in again to use LIVE features.",
        );
      });

    loadWallet().catch(() => {
      setNotice(
        "Could not load your NGN wallet.",
      );
    });
  }, [
    loadLives,
    loadWallet,
    token,
  ]);

  useEffect(() => {
    if (!live) return;

    const id = live.id;

    const poll = window.setInterval(() => {
      loadLive(id).catch(() => {});
      loadLives().catch(() => {});

      if (token) {
        const query = giftCursor
          ? `?since=${encodeURIComponent(
              giftCursor,
            )}`
          : "";

        apiFetch(
          `/api/live/${id}/gifts${query}`,
          {
            headers: auth(),
          },
        )
          .then((response) => {
            if (!response.events?.length) {
              return;
            }

            setGiftEvents((current) =>
              [
                ...response.events,
                ...current,
              ].slice(0, 8),
            );

            setGiftCursor(
              response.events[
                response.events.length - 1
              ].timestamp,
            );
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      window.clearInterval(poll);
    };
  }, [
    giftCursor,
    live?.id,
    loadChat,
    loadLive,
    loadLives,
    token,
  ]);

  const acceptRealtimeChat = useCallback((message: Chat) => {
    if (!message?.id) return;
    setMessages((current) => current.some((item) => item.id === message.id)
      ? current
      : [...current, message].slice(-100));
  }, []);

  const acceptRealtimeGift = useCallback((event: GiftEvent) => {
    setGiftEvents((current) => current.some((item) => (event.id && item.id === event.id) || (item.timestamp === event.timestamp && item.senderUsername === event.senderUsername))
      ? current
      : [{ ...event, timestamp: event.timestamp || new Date().toISOString() }, ...current].slice(0, 8));
    if (isHost) setNotice(`Gift earnings: ${naira((event.creatorEarnNaira ?? 0) * 100)} from @${event.senderUsername}.`);
  }, [isHost]);

  const acceptChatModeration = useCallback((event: { action: string; messageId?: number }) => {
    if (event.action === "delete-message") setMessages((items) => items.filter((item) => item.id !== event.messageId));
    if (event.action === "pin-message") setMessages((items) => items.map((item) => ({ ...item, isPinned: item.id === event.messageId })));
  }, []);

  useEffect(() => {
    if (!joined || !live || !token) {
      return;
    }

    let alive = true;

    const heartbeat = () => {
      apiFetch(
        `/api/live/${live.id}/heartbeat`,
        {
          method: "POST",
          headers: auth(),
        },
      )
        .then((response) => {
          if (!alive) return;

          setLive((current) =>
            current
              ? {
                  ...current,
                  viewerCount:
                    response.viewerCount ??
                    current.viewerCount,
                }
              : current,
          );
        })
        .catch(() => {});
    };

    heartbeat();

    const timer = window.setInterval(
      heartbeat,
      15000,
    );

    return () => {
      alive = false;
      window.clearInterval(timer);

      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:4000"
        }/api/live/${live.id}/leave`,
        {
          method: "POST",
          headers: {
            ...auth(),
            "Content-Type":
              "application/json",
          },
          keepalive: true,
        },
      ).catch(() => {});
    };
  }, [joined, live?.id, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  useEffect(() => {
    const query =
      typeof window !== "undefined"
        ? new URLSearchParams(
            window.location.search,
          )
        : null;

    const selectedId = Number(
      query?.get("live"),
    );

    if (!selectedId) return;

    const selected = lives.find(
      (item) => item.id === selectedId,
    );

    if (selected) {
      chooseLive(selected);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives.length]);

  async function chooseLive(item: Live) {
    setNotice("");
    setMessages([]);
    setGiftEvents([]);
    setGiftCursor("");
    setLiked(false);
    setCopied(false);
    setJoined(false);

    try {
      const nextLive =
        await loadLive(item.id);

      if (token) {
        await loadChat(item.id);
      }

      setLive((current) =>
        mergeLive(current, nextLive),
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not open LIVE.",
      );
    }
  }

  async function startLive(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!token) {
      setNotice(
        "Sign in to start a LIVE.",
      );
      return;
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setNotice(
        "Give your LIVE a title first.",
      );
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const created = await apiFetch(
        "/api/live",
        {
          method: "POST",
          headers: auth(),
          body: JSON.stringify({
            title: cleanTitle,
          }),
        },
      );

      const started = await apiFetch(
        `/api/live/${created.live.id}/start`,
        {
          method: "POST",
          headers: auth(),
        },
      );

      setTitle("");

      await loadLives();

      setLive(started.live as Live);
      setJoined(false);

      setNotice(
        "You are LIVE. Camera and microphone are ready.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not start LIVE.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!token || !live) {
      setNotice(
        "Sign in to join this LIVE.",
      );
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const response = await apiFetch(
        `/api/live/${live.id}/join`,
        {
          method: "POST",
          headers: auth(),
        },
      );

      setLive((current) =>
        current
          ? mergeLive(
              current,
              response.live as Live,
            )
          : (response.live as Live),
      );

      setJoined(true);

      await loadChat(live.id);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not join LIVE.",
      );
    } finally {
      setBusy(false);
    }
  }

  function leaveLive() {
    setJoined(false);
    setNotice("You left the LIVE.");
  }

  async function sendChat(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !token ||
      !live ||
      !chatText.trim()
    ) {
      return;
    }

    const text = chatText.trim();

    try {
      const response = await apiFetch(
        `/api/live/${live.id}/chat`,
        {
          method: "POST",
          headers: auth(),
          body: JSON.stringify({
            text,
          }),
        },
      );

      if (response.message) {
        setMessages((current) => [
          ...current
            .filter(
              (message) =>
                message.id !==
                response.message.id,
            )
            .slice(-99),
          response.message,
        ]);
      }

      setChatText("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Message could not be sent.",
      );
    }
  }

  async function moderate(action: string, payload: Record<string, number>) {
    if (!live || !isHost) return;
    try {
      await apiFetch(`/api/live/${live.id}/moderation/${action}`, { method: "POST", headers: auth(), body: JSON.stringify(payload) });
      if (action === "delete-message") setMessages((items) => items.filter((item) => item.id !== payload.messageId));
      if (action === "pin-message") setMessages((items) => items.map((item) => ({ ...item, isPinned: item.id === payload.messageId })));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Moderation action failed."); }
  }

  async function likeLive() {
    if (!token || !live || likeBusy) {
      if (!token) {
        setNotice(
          "Sign in to like this LIVE.",
        );
      }
      return;
    }

    setLikeBusy(true);
    setLiked(true);

    const optimisticLikes =
      (live.likes ?? 0) + 1;

    setLive((current) =>
      current
        ? {
            ...current,
            likes: optimisticLikes,
          }
        : current,
    );

    try {
      const response = await apiFetch(
        `/api/live/${live.id}/like`,
        {
          method: "POST",
          headers: auth(),
        },
      );

      if (
        typeof response.likes === "number"
      ) {
        setLive((current) =>
          current
            ? {
                ...current,
                likes: response.likes,
              }
            : current,
        );
      }
    } catch (error) {
      setLiked(false);

      setLive((current) =>
        current
          ? {
              ...current,
              likes: Math.max(
                0,
                (current.likes ?? 1) - 1,
              ),
            }
          : current,
      );

      setNotice(
        error instanceof Error
          ? error.message
          : "Could not like LIVE.",
      );
    } finally {
      setLikeBusy(false);
    }
  }

  async function shareLive() {
    if (!live || !shareUrl) {
      return;
    }

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: `SIX20 LIVE — ${live.title}`,
          text: `Watch ${creatorLabel(
            live,
          )} on SIX20 LIVE.`,
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl,
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        2000,
      );

      setNotice("LIVE link copied.");
    } catch {
      // User cancelled the native share dialog.
    }
  }

  async function copyLiveLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(
        shareUrl,
      );

      setCopied(true);
      setNotice("LIVE link copied.");

      window.setTimeout(
        () => setCopied(false),
        2000,
      );
    } catch {
      setNotice(
        "Could not copy the LIVE link.",
      );
    }
  }

  async function sendGift() {
    if (!token || !live || !giftId) {
      if (!token) {
        setNotice(
          "Sign in to send a gift.",
        );
      }
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const key =
        giftKey || crypto.randomUUID();

      const response = await apiFetch(
        "/api/gifts/send",
        {
          method: "POST",
          headers: {
            ...auth(),
            "Idempotency-Key": key,
          },
          body: JSON.stringify({
            receiverId: live.creatorId,
            liveSessionId: live.id,
            giftId: Number(giftId),
            quantity,
          }),
        },
      );

      setGiftKey("");

      await loadWallet();

      setNotice(
        `Sent ${quantity} ${
          response.gift.name
        } for ${naira(
          response.totalNaira * 100,
        )}. ${naira(
          response.creatorEarnNaira * 100,
        )} goes to the creator.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gift could not be sent.";

      setNotice(
        message
          .toLowerCase()
          .includes("insufficient")
          ? "Insufficient wallet balance. Add Money to continue."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function endLive() {
    if (!live || !isHost) return;

    setBusy(true);
    setNotice("");

    try {
      await apiFetch(
        `/api/live/${live.id}/end`,
        {
          method: "POST",
          headers: auth(),
        },
      );

      setJoined(false);
      setLive(null);

      await loadLives();

      setNotice("LIVE ended.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not end LIVE.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090714] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090714]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 font-black">
              S20
            </span>

            <div>
              <div className="text-lg font-black">
                SIX20 LIVE
              </div>

              <div className="text-[11px] text-white/50">
                Where Entertainment Comes Alive
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/wallet"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold sm:flex"
            >
              <WalletCards size={16} />

              {wallet === null
                ? "Wallet"
                : naira(wallet)}
            </Link>

            <Link
              href="/wallet"
              className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#17132f]"
            >
              Add Money
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_370px]">
        <section className="min-w-0">
          {!user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <Radio size={18} />

              Sign in to start a LIVE, join creators,
              chat, like and send gifts.
            </div>
          )}

          {user && (
            <form
              onSubmit={startLive}
              className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  maxLength={120}
                  placeholder="What are you going LIVE about?"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400"
                />

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-600 to-indigo-600 px-6 py-3 font-black shadow-lg shadow-violet-900/30 disabled:opacity-50"
                >
                  {busy
                    ? "Starting..."
                    : "Go LIVE"}
                </button>
              </div>
            </form>
          )}

          {live ? (
            <article className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
      <LiveKitStage
                liveId={live.id}
                isCreator={isHost}
                onLeave={
                  !isHost
                    ? leaveLive
                    : undefined
                }
                onChatMessage={acceptRealtimeChat}
                onGiftEvent={acceptRealtimeGift}
                onChatModeration={acceptChatModeration}
              />

              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                        <span className="animate-pulse">
                          ●
                        </span>
                        LIVE
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/65">
                        <Users size={13} />
                        {live.viewerCount} watching
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/65">
                        <Heart size={13} />
                        {live.likes ?? 0}
                      </span>
                    </div>

                    <h1 className="break-words text-2xl font-black sm:text-3xl">
                      {live.title}
                    </h1>

                    <p className="mt-2 text-sm text-white/65">
                      {creatorLabel(live)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={likeLive}
                      disabled={likeBusy}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                        liked
                          ? "bg-pink-500 text-white"
                          : "border border-white/10 bg-white/5 text-white"
                      }`}
                    >
                      <Heart
                        size={17}
                        fill={
                          liked
                            ? "currentColor"
                            : "none"
                        }
                      />
                      Like
                    </button>

                    {joined && !isHost && <button type="button" onClick={() => apiFetch(`/api/live/${live.id}/reactions`, { method: "POST", headers: auth(), body: JSON.stringify({ emoji: "❤️" }) }).catch((error) => setNotice(error instanceof Error ? error.message : "Reaction could not be sent."))} className="inline-flex items-center gap-2 rounded-xl border border-pink-300/20 bg-pink-500/10 px-4 py-2 text-sm font-black text-pink-200">
                      <Heart size={17} fill="currentColor" /> React
                    </button>}

                    <button
                      type="button"
                      onClick={shareLive}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black"
                    >
                      <Share2 size={17} />
                      Share
                    </button>

                    <button
                      type="button"
                      onClick={copyLiveLink}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black"
                    >
                      <Copy size={16} />
                      {copied
                        ? "Copied"
                        : "Link"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!joined && !isHost && (
                    <button
                      type="button"
                      disabled={busy || !user}
                      onClick={join}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-black disabled:opacity-50"
                    >
                      <LogIn size={17} />

                      {busy
                        ? "Joining..."
                        : "Join LIVE"}
                    </button>
                  )}

                  {joined && !isHost && (
                    <button
                      type="button"
                      onClick={leaveLive}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-black"
                    >
                      <LogOut size={17} />
                      Leave LIVE
                    </button>
                  )}

                  {isHost && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={endLive}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black disabled:opacity-50"
                    >
                      <LogOut size={17} />

                      {busy
                        ? "Ending..."
                        : "End LIVE"}
                    </button>
                  )}
                </div>

                {joined && !isHost && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Audience presence active
                  </div>
                )}

                {joined &&
                  !isHost &&
                  gifts.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Gift
                          size={17}
                          className="text-amber-300"
                        />

                        <h2 className="font-black">
                          Send a Naira gift
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {gifts
                          .slice(0, 8)
                          .map((gift) => {
                            const selected =
                              String(
                                gift.id,
                              ) === giftId;

                            return (
                              <button
                                type="button"
                                key={gift.id}
                                onClick={() => {
                                  setGiftId(
                                    String(
                                      gift.id,
                                    ),
                                  );
                                  setGiftKey("");
                                }}
                                className={`rounded-2xl border p-3 text-left transition ${
                                  selected
                                    ? "border-amber-300 bg-amber-300/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                              >
                                <div className="text-lg">
                                  {gift.imageUrl ||
                                  gift.thumbnailUrl
                                    ? "🎁"
                                    : "✨"}
                                </div>

                                <div className="mt-1 text-sm font-black">
                                  {gift.name}
                                </div>

                                <div className="text-xs text-white/50">
                                  {naira(
                                    gift.priceKobo,
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </div>

                      {selectedGift && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-3">
                          <span className="text-sm">
                            {selectedGift.name}
                          </span>

                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={quantity}
                            onChange={(event) => {
                              const next =
                                Number(
                                  event.target.value,
                                );

                              setQuantity(
                                Math.max(
                                  1,
                                  Math.min(
                                    100,
                                    Number.isFinite(
                                      next,
                                    )
                                      ? next
                                      : 1,
                                  ),
                                ),
                              );

                              setGiftKey("");
                            }}
                            className="w-20 rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
                          />

                          <button
                            type="button"
                            disabled={busy}
                            onClick={sendGift}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-black text-black disabled:opacity-50"
                          >
                            <Sparkles size={16} />
                            Send gift
                          </button>

                          <span className="ml-auto text-xs text-white/55">
                            Balance{" "}
                            {wallet === null
                              ? "—"
                              : naira(wallet)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {giftEvents.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-400/10 to-fuchsia-500/10 p-3 text-sm">
                    {giftEvents
                      .slice(0, 3)
                      .map(
                        (
                          event,
                          index,
                        ) => (
                          <div
                            key={`${event.timestamp}-${index}`}
                            className="flex items-center gap-2"
                          >
                            <span className="text-lg">
                              🎁
                            </span>

                            <span>
                              <b>
                                @
                                {
                                  event.senderUsername
                                }
                              </b>{" "}
                              sent{" "}
                              {event.quantity}{" "}
                              {event.giftName}
                            </span>

                            <span className="ml-auto text-amber-200">
                              {naira(
                                event.totalNaira *
                                  100,
                              )}
                            </span>
                          </div>
                        ),
                      )}
                  </div>
                )}
              </div>
            </article>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.25),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(79,70,229,0.2),transparent_35%)] p-10 text-center">
              <div>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 text-2xl font-black shadow-2xl shadow-violet-900/50">
                  S20
                </div>

                <h1 className="text-4xl font-black">
                  Where Entertainment Comes Alive
                </h1>

                <p className="mx-auto mt-3 max-w-xl text-white/60">
                  Select a creator below or start
                  your own LIVE. Real video, realtime
                  presence, chat, reactions and
                  Naira gifting.
                </p>
              </div>
            </div>
          )}

          {notice && (
            <div className="mt-4 rounded-2xl border border-amber-200/10 bg-amber-200/10 p-3 text-sm text-amber-100">
              {notice}

              {notice.includes(
                "Add Money",
              ) && (
                <Link
                  href="/wallet"
                  className="ml-2 font-black text-amber-300 underline"
                >
                  Add Money →
                </Link>
              )}
            </div>
          )}

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Happening now
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Discover creators live right now.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadLives().catch(() => {})
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {lives.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {lives.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      chooseLive(item)
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-red-300">
                        <span className="animate-pulse">
                          ●
                        </span>
                        LIVE
                      </span>

                      <span className="text-xs text-white/50">
                        {item.viewerCount} watching
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm text-white/50">
                      {creatorLabel(item)}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                      <span className="inline-flex items-center gap-1">
                        <Heart size={13} />
                        {item.likes ?? 0}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={13} />
                        LIVE chat
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
                No creators are live right now.
              </div>
            )}
          </section>
        </section>

        <aside className="flex min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-black">
                  <MessageCircle size={18} />
                  LIVE chat
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Audience conversation
                </p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/55">
                <Users size={13} />
                {live?.viewerCount ?? 0}
              </span>
            </div>
          </div>

          {!canUseChat && (
            <div className="m-4 rounded-2xl border border-violet-300/10 bg-violet-300/5 p-4 text-sm text-white/55">
              <div className="mb-2 flex items-center gap-2 font-bold text-white/80">
                <Camera size={16} />
                Join to unlock chat
              </div>

              Sign in and join this LIVE to
              participate.
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {canUseChat &&
              messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl bg-white/[0.03] p-3"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-amber-300">
                      @{message.user.username}
                    </span>

                    {message.user.id ===
                      live?.creatorId && (
                      <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-black text-fuchsia-200">
                        HOST
                      </span>
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm text-white/75">
                    {message.text}
                  </p>
                  {message.isPinned && <span className="mt-2 inline-block rounded-full bg-amber-300/15 px-2 py-1 text-[10px] font-black text-amber-200">PINNED</span>}
                  {isHost && <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => moderate("pin-message", { messageId: message.id })} className="text-[10px] font-bold text-amber-200">Pin</button>
                    <button type="button" onClick={() => moderate("delete-message", { messageId: message.id })} className="text-[10px] font-bold text-rose-300">Delete</button>
                    {message.user.id !== live?.creatorId && <><button type="button" onClick={() => moderate("mute", { userId: message.user.id })} className="text-[10px] font-bold text-white/50">Mute</button><button type="button" onClick={() => moderate("block", { userId: message.user.id })} className="text-[10px] font-bold text-white/50">Block</button></>}
                  </div>}
                </div>
              ))}

            <div ref={chatEndRef} />
          </div>

          {canUseChat && (
            <form
              onSubmit={sendChat}
              className="border-t border-white/10 p-3"
            >
              <div className="flex gap-2 rounded-2xl bg-white/5 p-2">
                <input
                  value={chatText}
                  onChange={(event) =>
                    setChatText(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  placeholder="Say something..."
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/30"
                />

                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-black disabled:opacity-30"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
