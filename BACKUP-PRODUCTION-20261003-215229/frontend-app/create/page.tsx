"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Film, Music, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [soundTitle, setSoundTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    if (selected.size > 100 * 1024 * 1024) {
      setError("Video must be 100MB or smaller.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function removeVideo() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");
    setMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!file) {
      setError("Select a video before publishing.");
      return;
    }

    const token =
      localStorage.getItem("six20-token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      setError("Please log in before uploading a video.");
      return;
    }

    setUploading(true);

    try {
      // STEP 1: Upload the actual video file
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json().catch(() => null);

      if (!uploadResponse.ok || !uploadData?.success) {
        throw new Error(
          uploadData?.message || "Video upload failed."
        );
      }

      const returnedUrl =
        uploadData?.file?.url ||
        uploadData?.url ||
        uploadData?.fileUrl;

      if (!returnedUrl) {
        throw new Error(
          "Upload succeeded, but SIX20 did not return a video URL."
        );
      }

      const videoUrl = returnedUrl.startsWith("http")
        ? returnedUrl
        : `${API_URL}${returnedUrl}`;

      // STEP 2: Create the video record in Prisma
      const videoResponse = await fetch(`${API_URL}/api/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoUrl,
          caption: caption.trim(),
          soundTitle: soundTitle.trim(),
          isPublic,
        }),
      });

      const videoData = await videoResponse.json().catch(() => null);

      if (!videoResponse.ok || !videoData?.success) {
        throw new Error(
          videoData?.message || "Could not create the SIX20 video."
        );
      }

      setMessage("Video published successfully!");

      setTimeout(() => {
        router.push("/fyp");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error("SIX20 create error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing your video."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090712] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090712]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-center">
            <div className="text-lg font-black tracking-tight">
              SIX<span className="text-[#6947F5]">20</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Create
            </div>
          </div>

          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#FF7A66]">
            Where Entertainment Comes Alive
          </p>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Create something people will remember.
          </h1>

          <p className="mt-3 max-w-2xl text-white/55">
            Upload your video, add a caption and sound, then publish directly
            to the SIX20 FYP.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* VIDEO PREVIEW */}
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#6947F5]/15 p-2.5 text-[#8e78ff]">
                    <Film size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold">Your video</h2>
                    <p className="text-xs text-white/40">
                      MP4, MOV, WebM and other browser-supported formats
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {preview ? (
                  <div className="relative overflow-hidden rounded-[22px] bg-black">
                    <video
                      src={preview}
                      controls
                      playsInline
                      className="mx-auto max-h-[650px] w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white backdrop-blur-md transition hover:bg-black"
                      aria-label="Remove video"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex min-h-[500px] w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-black/20 px-6 text-center transition hover:border-[#6947F5]/60 hover:bg-[#6947F5]/5"
                  >
                    <div className="mb-5 rounded-2xl bg-[#6947F5]/15 p-5 text-[#8e78ff] transition group-hover:scale-105">
                      <Upload size={32} />
                    </div>

                    <h3 className="text-xl font-bold">
                      Upload your video
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                      Choose a video from your computer and preview it before
                      publishing.
                    </p>

                    <span className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition group-hover:bg-[#6947F5] group-hover:text-white">
                      Choose video
                    </span>

                    <span className="mt-4 text-xs text-white/30">
                      Maximum file size: 100MB
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeVideo}
                        className="shrink-0 text-xs font-semibold text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* DETAILS */}
            <section className="h-fit rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-black">Post details</h2>
                <p className="mt-1 text-sm text-white/40">
                  Give your audience some context.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="caption"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Caption
                  </label>

                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={500}
                    rows={5}
                    placeholder="Tell your SIX20 audience what is happening..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#6947F5]"
                  />

                  <div className="mt-1 text-right text-xs text-white/25">
                    {caption.length}/500
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sound"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Sound / music
                  </label>

                  <div className="relative">
                    <Music
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                    />

                    <input
                      id="sound"
                      value={soundTitle}
                      onChange={(event) =>
                        setSoundTitle(event.target.value)
                      }
                      maxLength={120}
                      placeholder="Original sound"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#6947F5]"
                    />
                  </div>
                </div>

                {/* VISIBILITY */}
                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Visibility
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsPublic((value) => !value)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isPublic
                        ? "border-[#6947F5]/50 bg-[#6947F5]/10"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {isPublic ? "Public" : "Private"}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {isPublic
                            ? "Your video can appear on the SIX20 FYP."
                            : "Only you should be able to access this post."}
                        </p>
                      </div>

                      <div
                        className={`h-6 w-11 rounded-full p-1 transition ${
                          isPublic
                            ? "bg-[#6947F5]"
                            : "bg-white/15"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition ${
                            isPublic ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </div>

                {/* STATUS */}
                {message && (
                  <div className="rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300">
                    {error}
                  </div>
                )}

                {/* PUBLISH */}
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6947F5] to-[#8b5cf6] px-5 py-4 font-bold text-white shadow-lg shadow-[#6947F5]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  {uploading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Publish to SIX20
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-white/25">
                  By publishing, you confirm that you have the rights to
                  upload this content.
                </p>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}
