"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Loader2,
  Lock,
  Music2,
  Upload,
  X,
  Globe2,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

type UploadResponse = {
  success?: boolean;
  file?: {
    filename?: string;
    originalName?: string;
    mimetype?: string;
    size?: number;
    url?: string;
  };
  message?: string;
};

type VideoResponse = {
  success?: boolean;
  video?: {
    id: number | string;
    videoUrl: string;
  };
  message?: string;
};

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("six20-token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function buildMediaUrl(url?: string) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function CreatePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [caption, setCaption] =
    useState("");

  const [soundTitle, setSoundTitle] =
    useState("");

  const [isPublic, setIsPublic] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectFile(selectedFile: File) {
    setError("");

    if (!selectedFile.type.startsWith("video/")) {
      setError(
        "Please select a valid video file."
      );
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError(
        "Video must be 100MB or smaller."
      );
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target.files?.[0];

    if (selected) {
      selectFile(selected);
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(false);

    const dropped =
      event.dataTransfer.files?.[0];

    if (dropped) {
      selectFile(dropped);
    }
  }

  function removeFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handlePublish() {
    setError("");
    setSuccess(false);

    const token = getToken();

    if (!token) {
      setError(
        "Please log in to SIX20 before publishing a video."
      );
      return;
    }

    if (!file) {
      setError(
        "Please select a video first."
      );
      return;
    }

    try {
      setUploading(true);

      /*
       * STEP 1
       * Upload the actual video file.
       */

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const uploadResponse =
        await fetch(
          `${API_URL}/api/upload`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            body: formData,
          }
        );

      const uploadData =
        (await uploadResponse.json()) as UploadResponse;

      if (
        !uploadResponse.ok ||
        !uploadData.success ||
        !uploadData.file?.url
      ) {
        throw new Error(
          uploadData.message ||
            "Video upload failed."
        );
      }

      /*
       * Backend returns something like:
       * /uploads/my-video.mp4
       *
       * Convert it to:
       * http://localhost:4000/uploads/my-video.mp4
       */

      const videoUrl =
        buildMediaUrl(
          uploadData.file.url
        );

      /*
       * STEP 2
       * Create the video database record.
       */

      const videoResponse =
        await fetch(
          `${API_URL}/api/videos`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              videoUrl,
              caption:
                caption.trim(),
              soundTitle:
                soundTitle.trim(),
              isPublic,
            }),
          }
        );

      const videoData =
        (await videoResponse.json()) as VideoResponse;

      if (
        !videoResponse.ok ||
        !videoData.success
      ) {
        throw new Error(
          videoData.message ||
            "Video could not be published."
        );
      }

      setSuccess(true);

      /*
       * Give the user a moment to see
       * the successful publish state.
       */

      setTimeout(() => {
        router.push("/fyp");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0f0b22,#1b1734 55%,#251d49)",
        color: "white",
        fontFamily:
          "Inter,system-ui,sans-serif",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background:
            "rgba(15,11,34,.82)",
          borderBottom:
            "1px solid rgba(255,255,255,.08)",
          backdropFilter:
            "blur(18px)",
        }}
      >
        <button
          onClick={() =>
            router.back()
          }
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border:
              "1px solid rgba(255,255,255,.12)",
            background:
              "rgba(255,255,255,.06)",
            color: "white",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          style={{
            fontSize: 21,
            fontWeight: 950,
            letterSpacing: "-.04em",
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
            fontSize: 13,
            fontWeight: 850,
            color:
              "rgba(255,255,255,.65)",
          }}
        >
          Create
        </div>
      </header>

      <div
        style={{
          width:
            "min(1100px,100%)",
          margin: "0 auto",
          padding:
            "34px 20px 70px",
        }}
      >
        {/* TITLE */}

        <div
          style={{
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding:
                "7px 12px",
              borderRadius: 999,
              background:
                "rgba(105,71,245,.16)",
              border:
                "1px solid rgba(105,71,245,.28)",
              color: "#cfc5ff",
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            <Film size={14} />
            CREATE ON SIX20
          </div>

          <h1
            style={{
              margin:
                "14px 0 8px",
              fontSize:
                "clamp(30px,5vw,48px)",
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing:
                "-.045em",
            }}
          >
            Share your world.
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 620,
              color:
                "rgba(255,255,255,.62)",
              lineHeight: 1.6,
              fontSize: 15,
            }}
          >
            Upload a video, add your
            caption and sound, then
            send it straight into the
            SIX20 entertainment universe.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 15,
              borderRadius: 16,
              background:
                "rgba(255,83,109,.1)",
              border:
                "1px solid rgba(255,83,109,.3)",
              color: "#ff9aaa",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              borderRadius: 16,
              background:
                "rgba(57,210,132,.1)",
              border:
                "1px solid rgba(57,210,132,.3)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#8af0b7",
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={20} />
            Video published successfully.
            Opening your FYP...
          </div>
        )}

        {/* MAIN GRID */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.15fr) minmax(320px,.85fr)",
            gap: 24,
          }}
        >
          {/* LEFT — UPLOAD */}

          <section
            style={{
              borderRadius: 28,
              padding: 18,
              background:
                "rgba(255,255,255,.055)",
              border:
                "1px solid rgba(255,255,255,.09)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.25)",
            }}
          >
            {!previewUrl ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() =>
                  setDragActive(false)
                }
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                style={{
                  minHeight: 520,
                  borderRadius: 22,
                  border:
                    dragActive
                      ? "2px solid #6947f5"
                      : "2px dashed rgba(255,255,255,.16)",
                  background:
                    dragActive
                      ? "rgba(105,71,245,.12)"
                      : "rgba(0,0,0,.18)",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  padding: 30,
                  cursor: "pointer",
                  transition:
                    "all .2s ease",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 24,
                      margin:
                        "0 auto 20px",
                      background:
                        "linear-gradient(135deg,#6947f5,#ff7a66)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow:
                        "0 18px 55px rgba(105,71,245,.3)",
                    }}
                  >
                    <Upload size={30} />
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 900,
                    }}
                  >
                    Upload your video
                  </h2>

                  <p
                    style={{
                      margin:
                        "10px auto 20px",
                      maxWidth: 390,
                      color:
                        "rgba(255,255,255,.58)",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    Drag and drop your video
                    here or click to browse
                    your computer.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      "MP4",
                      "WEBM",
                      "MOV",
                      "Max 100MB",
                    ].map((item) => (
                      <span
                        key={item}
                        style={{
                          padding:
                            "7px 10px",
                          borderRadius: 999,
                          background:
                            "rgba(255,255,255,.06)",
                          border:
                            "1px solid rgba(255,255,255,.08)",
                          color:
                            "rgba(255,255,255,.65)",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    position: "relative",
                    height: 560,
                    borderRadius: 22,
                    overflow: "hidden",
                    background: "#000",
                  }}
                >
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />

                  <button
                    onClick={removeFile}
                    style={{
                      position:
                        "absolute",
                      top: 14,
                      right: 14,
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border:
                        "1px solid rgba(255,255,255,.15)",
                      background:
                        "rgba(0,0,0,.55)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      backdropFilter:
                        "blur(10px)",
                    }}
                    aria-label="Remove video"
                  >
                    <X size={19} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 14,
                    padding: "10px 12px",
                    borderRadius: 14,
                    background:
                      "rgba(255,255,255,.045)",
                  }}
                >
                  <Film size={17} />

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {file?.name}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        opacity: .55,
                        marginTop: 2,
                      }}
                    >
                      {file
                        ? `${(
                            file.size /
                            (1024 * 1024)
                          ).toFixed(1)} MB`
                        : ""}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    style={{
                      border: 0,
                      background:
                        "transparent",
                      color:
                        "#bfb4ff",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{
                display: "none",
              }}
            />
          </section>

          {/* RIGHT — DETAILS */}

          <section
            style={{
              borderRadius: 28,
              padding: 24,
              background:
                "rgba(255,255,255,.055)",
              border:
                "1px solid rgba(255,255,255,.09)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.25)",
              alignSelf: "start",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 22px",
                fontSize: 21,
                fontWeight: 900,
              }}
            >
              Video details
            </h2>

            {/* CAPTION */}

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 850,
                marginBottom: 8,
                color:
                  "rgba(255,255,255,.72)",
              }}
            >
              Caption
            </label>

            <textarea
              value={caption}
              onChange={(event) =>
                setCaption(
                  event.target.value
                )
              }
              placeholder="Tell people what your video is about..."
              maxLength={500}
              rows={5}
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
                resize: "vertical",
                borderRadius: 16,
                border:
                  "1px solid rgba(255,255,255,.1)",
                background:
                  "rgba(0,0,0,.22)",
                color: "white",
                outline: "none",
                padding: 14,
                fontFamily:
                  "inherit",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            />

            <div
              style={{
                textAlign: "right",
                fontSize: 10,
                opacity: .45,
                marginTop: 5,
              }}
            >
              {caption.length}/500
            </div>

            {/* SOUND */}

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 850,
                margin:
                  "20px 0 8px",
                color:
                  "rgba(255,255,255,.72)",
              }}
            >
              Sound / music
            </label>

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <Music2
                size={17}
                style={{
                  position:
                    "absolute",
                  left: 13,
                  top: 13,
                  opacity: .55,
                }}
              />

              <input
                value={soundTitle}
                onChange={(event) =>
                  setSoundTitle(
                    event.target.value
                  )
                }
                placeholder="e.g. Afrobeats Mix"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  borderRadius: 15,
                  border:
                    "1px solid rgba(255,255,255,.1)",
                  background:
                    "rgba(0,0,0,.22)",
                  color: "white",
                  outline: "none",
                  padding:
                    "12px 14px 12px 40px",
                  fontFamily:
                    "inherit",
                  fontSize: 14,
                }}
              />
            </div>

            {/* VISIBILITY */}

            <div
              style={{
                marginTop: 22,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  marginBottom: 10,
                  color:
                    "rgba(255,255,255,.72)",
                }}
              >
                Visibility
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsPublic(true)
                }
                style={{
                  width: "100%",
                  border:
                    isPublic
                      ? "1px solid rgba(105,71,245,.55)"
                      : "1px solid rgba(255,255,255,.08)",
                  background:
                    isPublic
                      ? "rgba(105,71,245,.13)"
                      : "rgba(255,255,255,.035)",
                  color: "white",
                  borderRadius: 16,
                  padding: 14,
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                <Globe2 size={20} />

                <div>
                  <div
                    style={{
                      fontWeight: 850,
                      fontSize: 13,
                    }}
                  >
                    Public
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      opacity: .55,
                      marginTop: 2,
                    }}
                  >
                    Anyone can discover
                    your video.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsPublic(false)
                }
                style={{
                  width: "100%",
                  border:
                    !isPublic
                      ? "1px solid rgba(105,71,245,.55)"
                      : "1px solid rgba(255,255,255,.08)",
                  background:
                    !isPublic
                      ? "rgba(105,71,245,.13)"
                      : "rgba(255,255,255,.035)",
                  color: "white",
                  borderRadius: 16,
                  padding: 14,
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <Lock size={20} />

                <div>
                  <div
                    style={{
                      fontWeight: 850,
                      fontSize: 13,
                    }}
                  >
                    Private
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      opacity: .55,
                      marginTop: 2,
                    }}
                  >
                    Keep this video
                    private.
                  </div>
                </div>
              </button>
            </div>

            {/* PUBLISH */}

            <button
              onClick={handlePublish}
              disabled={
                uploading ||
                !file ||
                success
              }
              style={{
                width: "100%",
                marginTop: 26,
                border: 0,
                borderRadius: 17,
                padding: "15px 18px",
                color: "white",
                background:
                  uploading ||
                  !file ||
                  success
                    ? "rgba(255,255,255,.12)"
                    : "linear-gradient(135deg,#6947f5,#ff7a66)",
                fontWeight: 900,
                fontSize: 14,
                cursor:
                  uploading ||
                  !file ||
                  success
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 9,
                boxShadow:
                  uploading ||
                  !file
                    ? "none"
                    : "0 15px 45px rgba(105,71,245,.3)",
              }}
            >
              {uploading ? (
                <>
                  <Loader2
                    size={18}
                    className="six20-spin"
                  />
                  Publishing...
                </>
              ) : success ? (
                <>
                  <CheckCircle2
                    size={18}
                  />
                  Published
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Publish to SIX20
                </>
              )}
            </button>

            <div
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 11,
                lineHeight: 1.5,
                color:
                  "rgba(255,255,255,.42)",
              }}
            >
              Your video will appear in
              the SIX20 FYP when it is
              published publicly.
            </div>
          </section>
        </div>

        {/* BOTTOM INFO */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          <InfoCard
            icon={<Film size={18} />}
            title="Video"
            text="Upload up to 100MB."
          />

          <InfoCard
            icon={<ImageIcon size={18} />}
            title="Preview"
            text="Review your video before publishing."
          />

          <InfoCard
            icon={<Music2 size={18} />}
            title="Sound"
            text="Give your sound a title."
          />
        </div>
      </div>

      <style jsx>{`
        .six20-spin {
          animation: six20spin 1s linear infinite;
        }

        @keyframes six20spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 820px) {
          main > div > div:nth-of-type(2) {
            grid-template-columns: 1fr !important;
          }

          section video {
            max-height: 70vh;
          }
        }

        @media (max-width: 560px) {
          header {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          main > div {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          section {
            border-radius: 22px !important;
          }

          section > div:first-child {
            min-height: 430px !important;
          }

          main > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: 15,
        borderRadius: 18,
        background:
          "rgba(255,255,255,.045)",
        border:
          "1px solid rgba(255,255,255,.07)",
        display: "flex",
        alignItems: "center",
        gap: 11,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background:
            "rgba(105,71,245,.14)",
          display: "grid",
          placeItems: "center",
          color: "#c9c0ff",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 11,
            opacity: .5,
            marginTop: 2,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}