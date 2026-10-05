"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import {
  ConnectionState,
  Track,
  RoomEvent,
} from "livekit-client";
import {
  Camera,
  CameraOff,
  Maximize2,
  Mic,
  MicOff,
  MonitorUp,
  RefreshCw,
  Users,
  Wifi,
} from "lucide-react";
import { apiFetch } from "../../lib/api";

type LiveKitStageProps = {
  liveId: number;
  isCreator?: boolean;
  onLeave?: () => void;
  onChatMessage?: (message: any) => void;
  onGiftEvent?: (gift: any) => void;
  onChatModeration?: (event: any) => void;
};

type TokenResponse = {
  success: boolean;
  serverUrl?: string;
  token?: string;
  roomName?: string;
  role?: "creator" | "viewer";
  message?: string;
};

function getAuthHeaders(): Record<
  string,
  string
> {
  if (typeof window === "undefined") {
    return {};
  }

  const token =
    localStorage.getItem("six20-token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function CreatorControls({
  onFullscreen,
}: {
  onFullscreen: () => void;
}) {
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
  } = useLocalParticipant();

  async function toggleMicrophone() {
    try {
      await localParticipant.setMicrophoneEnabled(
        !isMicrophoneEnabled,
      );
    } catch (error) {
      console.error(
        "SIX20 microphone error:",
        error,
      );
    }
  }

  async function toggleCamera() {
    try {
      await localParticipant.setCameraEnabled(
        !isCameraEnabled,
      );
    } catch (error) {
      console.error(
        "SIX20 camera error:",
        error,
      );
    }
  }

  async function toggleScreenShare() {
    try {
      await localParticipant.setScreenShareEnabled(
        !localParticipant.isScreenShareEnabled,
      );
    } catch (error) {
      console.error(
        "SIX20 screen share error:",
        error,
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMicrophone}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur hover:bg-black/70"
        aria-label={
          isMicrophoneEnabled
            ? "Mute microphone"
            : "Unmute microphone"
        }
        title={
          isMicrophoneEnabled
            ? "Mute microphone"
            : "Unmute microphone"
        }
      >
        {isMicrophoneEnabled ? (
          <Mic size={17} />
        ) : (
          <MicOff size={17} />
        )}
      </button>

      <button
        type="button"
        onClick={toggleCamera}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur hover:bg-black/70"
        aria-label={
          isCameraEnabled
            ? "Turn camera off"
            : "Turn camera on"
        }
        title={
          isCameraEnabled
            ? "Turn camera off"
            : "Turn camera on"
        }
      >
        {isCameraEnabled ? (
          <Camera size={17} />
        ) : (
          <CameraOff size={17} />
        )}
      </button>

      <button
        type="button"
        onClick={toggleScreenShare}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur hover:bg-black/70"
        aria-label="Share screen"
        title="Share screen"
      >
        <MonitorUp size={17} />
      </button>

      <button
        type="button"
        onClick={onFullscreen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur hover:bg-black/70"
        aria-label="Enter fullscreen"
        title="Fullscreen"
      >
        <Maximize2 size={17} />
      </button>
    </div>
  );
}

function LiveVideoSurface({
  isCreator,
  onFullscreen,
  onChatMessage,
  onGiftEvent,
  onChatModeration,
}: {
  isCreator: boolean;
  onFullscreen: () => void;
  onChatMessage?: (message: any) => void;
  onGiftEvent?: (gift: any) => void;
  onChatModeration?: (event: any) => void;
}) {
  const room = useRoomContext();
  const [effects, setEffects] = useState<Array<{ id: string; emoji: string; kind: string; text?: string }>>([]);
  useEffect(() => {
    const receive = (payload: Uint8Array) => {
      try {
        const event = JSON.parse(new TextDecoder().decode(payload));
        if (event.type === "chat.message") onChatMessage?.(event.message);
        if (event.type === "chat.moderation") onChatModeration?.(event);
        if (event.type === "live.gift") {
          onGiftEvent?.(event);
          setEffects((items) => [...items, { id: event.id, emoji: "🎁", kind: "gift", text: `@${event.senderUsername} sent ${event.quantity} ${event.giftName} · ₦${event.totalNaira}` }].slice(-6));
          window.setTimeout(() => setEffects((items) => items.filter((item) => item.id !== event.id)), 5000);
        }
        if (event.type === "live.reaction") {
          setEffects((items) => [...items, { id: event.id, emoji: event.emoji, kind: "reaction" }].slice(-12));
          window.setTimeout(() => setEffects((items) => items.filter((item) => item.id !== event.id)), 3500);
        }
      } catch { /* Ignore malformed room data. */ }
    };
    room.on(RoomEvent.DataReceived, receive);
    return () => { room.off(RoomEvent.DataReceived, receive); };
  }, [room, onChatMessage, onGiftEvent, onChatModeration]);
  const localParticipant =
    useLocalParticipant();

  const participants =
    useParticipants();

  const connectionState =
    useConnectionState();

  const cameraTracks = useTracks([
    Track.Source.Camera,
  ]);

  const screenTracks = useTracks([
    Track.Source.ScreenShare,
  ]);

  const localId =
    localParticipant.localParticipant.identity;

  const localCamera = cameraTracks.find(
    (ref) =>
      ref.participant.identity === localId,
  ) as TrackReference | undefined;

  const remoteCamera = cameraTracks.find(
    (ref) =>
      ref.participant.identity !== localId,
  ) as TrackReference | undefined;

  const mainCamera =
    isCreator && localCamera
      ? localCamera
      : remoteCamera ?? localCamera;

  const remoteScreen =
    screenTracks.find(
      (ref) =>
        ref.participant.identity !== localId,
    ) as TrackReference | undefined;

  const localScreen =
    screenTracks.find(
      (ref) =>
        ref.participant.identity === localId,
    ) as TrackReference | undefined;

  const screenTrack =
    remoteScreen ?? localScreen;

  const connectionText =
    connectionState ===
    ConnectionState.Connected
      ? "Connected"
      : connectionState ===
          ConnectionState.Reconnecting
        ? "Reconnecting"
        : connectionState ===
            ConnectionState.Disconnected
          ? "Disconnected"
          : "Connecting";

  const connectedAudience = Math.max(
    0,
    participants.length - 1,
  );

  return (
    <div className="relative aspect-video overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-live="polite">
        {effects.map((effect) => <div key={effect.id} className={`absolute bottom-16 ${effect.kind === "gift" ? "left-1/2 -translate-x-1/2 rounded-2xl border border-amber-300/40 bg-black/70 px-5 py-3 text-center text-amber-100 shadow-2xl" : "left-[72%] text-4xl"} animate-[six20-float_3.5s_ease-out_forwards]`}>
          <span className="text-4xl">{effect.emoji}</span>{effect.text && <div className="mt-1 text-sm font-black">{effect.text}</div>}
        </div>)}
      </div>
      {mainCamera ? (
        <VideoTrack
          trackRef={mainCamera}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.35),transparent_35%),linear-gradient(135deg,#190b2e,#10102d,#05050d)]">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-2xl font-black backdrop-blur">
              S20
            </div>

            <div className="text-lg font-black">
              {isCreator
                ? "Starting your camera..."
                : "Waiting for the creator"}
            </div>

            <div className="mt-2 text-sm text-white/45">
              {isCreator
                ? "Allow camera and microphone access."
                : "The creator video will appear here."}
            </div>
          </div>
        </div>
      )}

      {screenTrack && (
        <div className="absolute bottom-20 right-4 z-20 aspect-video w-1/3 min-w-[150px] overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">
          <VideoTrack
            trackRef={screenTrack}
            className="h-full w-full object-contain"
          />

          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black">
            {remoteScreen
              ? "REMOTE SCREEN"
              : "SCREEN"}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-[11px] font-black">
            <span className="animate-pulse">
              ●
            </span>
            LIVE
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur">
            <Wifi size={12} />
            {connectionText}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-bold backdrop-blur">
          <Users size={13} />
          {connectedAudience} connected
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-16">
        <div>
          <div className="text-xs text-white/55">
            {connectionText}
          </div>

          <div className="mt-1 text-sm font-black">
            {isCreator
              ? "You are broadcasting"
              : "SIX20 LIVE"}
          </div>
        </div>

        {isCreator ? (
          <CreatorControls
            onFullscreen={onFullscreen}
          />
        ) : (
          <button
            type="button"
            onClick={onFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur hover:bg-black/70"
            aria-label="Enter fullscreen"
            title="Fullscreen"
          >
            <Maximize2 size={17} />
          </button>
        )}
      </div>

      {connectionState ===
        ConnectionState.Reconnecting && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-center shadow-2xl">
            <RefreshCw
              size={20}
              className="mx-auto mb-2 animate-spin"
            />

            <div className="font-black">
              Reconnecting LIVE...
            </div>

            <div className="mt-1 text-xs text-white/50">
              Your stream should recover automatically.
            </div>
          </div>
        </div>
      )}

      <RoomAudioRenderer />

      <StartAudio label="Tap to enable LIVE audio" />
    </div>
  );
}

export default function LiveKitStage({
  liveId,
  isCreator = false,
  onLeave,
  onChatMessage,
  onGiftEvent,
  onChatModeration,
}: LiveKitStageProps) {
  const [token, setToken] =
    useState<string | null>(null);

  const [serverUrl, setServerUrl] =
    useState<string | null>(null);

  const [role, setRole] = useState<
    "creator" | "viewer" | null
  >(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const stageRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connectToLive() {
      try {
        setLoading(true);
        setError(null);

        const data =
          (await apiFetch(
            `/api/live/${liveId}/token`,
            {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
                "Content-Type":
                  "application/json",
              },
            },
          )) as TokenResponse;

        if (!data.success) {
          throw new Error(
            data.message ||
              "Unable to connect to SIX20 LIVE.",
          );
        }

        if (
          !data.token ||
          !data.serverUrl ||
          !data.role
        ) {
          throw new Error(
            "LiveKit connection data is incomplete.",
          );
        }

        if (cancelled) {
          return;
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
        setRole(data.role);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to SIX20 LIVE.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    connectToLive();

    return () => {
      cancelled = true;
    };
  }, [liveId]);

  function fullscreen() {
    const element = stageRef.current;

    if (!element) return;

    if (!document.fullscreenElement) {
      element
        .requestFullscreen?.()
        .catch(() => {});

      return;
    }

    document
      .exitFullscreen?.()
      .catch(() => {});
  }

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black p-6 text-white">
        <div className="max-w-md text-center">
          <div className="mb-4 text-3xl">
            ⚠️
          </div>

          <h3 className="text-lg font-black">
            LIVE connection failed
          </h3>

          <p className="mt-2 text-sm text-white/55">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (
    loading ||
    !token ||
    !serverUrl ||
    !role
  ) {
    return (
      <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.28),transparent_35%),linear-gradient(135deg,#190b2e,#10102d,#05050d)] p-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-violet-400" />

          <div className="font-black">
            Connecting to SIX20 LIVE...
          </div>

          <div className="mt-2 text-xs text-white/45">
            Preparing a secure realtime video connection
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="bg-black"
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={role === "creator"}
        video={role === "creator"}
        className="w-full"
        onError={(roomError) => {
          console.error(
            "SIX20 LiveKit room error:",
            roomError,
          );

          setError(
            "The realtime LIVE connection encountered an error.",
          );
        }}
        onDisconnected={() => {
          if (!isCreator) {
            onLeave?.();
          }
        }}
        onMediaDeviceFailure={(failure) => {
          if (!failure) return;

          setError(
            "Camera or microphone access failed. Check your browser permissions and try again.",
          );
        }}
      >
        <LiveVideoSurface
          isCreator={
            role === "creator" ||
            isCreator
          }
          onFullscreen={fullscreen}
          onChatMessage={onChatMessage}
          onGiftEvent={onGiftEvent}
          onChatModeration={onChatModeration}
        />
      </LiveKitRoom>
    </div>
  );
}
