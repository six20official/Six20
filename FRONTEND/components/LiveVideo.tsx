"use client";

import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";

type LiveVideoProps = {
  liveId: number;
  isHost: boolean;
  active: boolean;
  token: string | null;
};

export default function LiveVideo({
  liveId,
  isHost,
  active,
  token,
}: LiveVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active || !token) {
      return;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        setStatus("Connecting...");
        setError("");

        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!url) {
          throw new Error("LiveKit URL is not configured");
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: RemoteTrack,
            _publication: RemoteTrackPublication,
            _participant: RemoteParticipant,
          ) => {
            if (cancelled) return;

            if (track.kind === Track.Kind.Video && videoRef.current) {
              track.attach(videoRef.current);
            }

            if (
              track.kind === Track.Kind.Audio &&
              audioContainerRef.current
            ) {
              const element = track.attach();
              element.autoplay = true;
              audioContainerRef.current.appendChild(element);
            }
          },
        );

        room.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack) => {
            track.detach();
          },
        );

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) {
            setStatus("Disconnected");
          }
        });

        await room.connect(url, token);

        if (cancelled) {
          await room.disconnect();
          return;
        }

        setStatus(isHost ? "You are LIVE" : "Watching LIVE");

        if (isHost) {
          await room.localParticipant.enableCameraAndMicrophone();

          const cameraPublication =
            room.localParticipant.getTrackPublication(
              Track.Source.Camera,
            );

          if (
            cameraPublication?.track &&
            videoRef.current
          ) {
            cameraPublication.track.attach(videoRef.current);
          }
        }
      } catch (err) {
        console.error("LiveKit connection error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to LIVE video",
          );
          setStatus("Video unavailable");
        }
      }
    };

    connect();

    return () => {
      cancelled = true;

      const room = roomRef.current;

      if (room) {
        room.localParticipant
          .trackPublications
          .forEach((publication) => {
            publication.track?.detach();
          });

        room.disconnect();
        roomRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (audioContainerRef.current) {
        audioContainerRef.current.innerHTML = "";
      }
    };
  }, [active, token, isHost, liveId]);

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isHost}
        className="h-full w-full object-contain"
      />

      <div
        ref={audioContainerRef}
        className="hidden"
      />

      {!error && status !== "Watching LIVE" && status !== "You are LIVE" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-white">
          <div>
            <div className="text-sm font-semibold">
              {status}
            </div>

            {isHost && (
              <div className="mt-2 text-xs text-white/70">
                Camera and microphone access may be required.
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-red-950/90 p-4 text-sm text-white">
          {error}
        </div>
      )}

      <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
        {isHost ? "LIVE • HOST" : "LIVE"}
      </div>
    </div>
  );
}