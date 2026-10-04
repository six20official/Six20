"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  phone?: string | null;
  isVerified?: boolean;
  isCreator?: boolean;
  isSeller?: boolean;
  isAffiliate?: boolean;
  creatorLevel?: number;
  _count?: {
    videos?: number;
    followers?: number;
    following?: number;
  };
};

type ProfileResponse = {
  success: boolean;
  user: User;
};

type FollowResponse = {
  success: boolean;
  following: boolean;
  message?: string;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "18px 10px",
        background: "#17142b",
        border: "1px solid #2b2745",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 13,
          color: "#9d98b8",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#17142b",
        border: "1px solid #2b2745",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#9d98b8",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem("six20-token");

        if (!token) {
          setMessage("Please log in to view your profile.");
          return;
        }

        const me = (await apiFetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })) as ProfileResponse;

        if (!me.success || !me.user) {
          throw new Error("Unable to load profile.");
        }

        setCurrentUserId(me.user.id);

        let profileUser = me.user;

        try {
          const publicProfile = (await apiFetch(
            `/api/users/${me.user.id}`
          )) as ProfileResponse;

          if (publicProfile.success && publicProfile.user) {
            profileUser = {
              ...me.user,
              ...publicProfile.user,
            };
          }
        } catch {
          // Keep authenticated user data if public profile loading fails.
        }

        setUser(profileUser);
        setDisplayName(profileUser.displayName || "");
        setAvatarUrl(profileUser.avatarUrl || "");
        setBio(profileUser.bio || "");

        localStorage.setItem(
          "six20-user",
          JSON.stringify(profileUser)
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function toggleFollow() {
    if (!user) return;

    try {
      setFollowLoading(true);
      setMessage("");

      const token = localStorage.getItem("six20-token");

      if (!token) {
        setMessage("Please log in again.");
        return;
      }

      const data = (await apiFetch(`/api/users/${user.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })) as FollowResponse;

      if (!data.success) {
        throw new Error(data.message || "Unable to update follow status.");
      }

      setIsFollowing(data.following);

      setUser((previous) => {
        if (!previous) return previous;

        const currentFollowers = previous._count?.followers ?? 0;

        return {
          ...previous,
          _count: {
            ...previous._count,
            followers: data.following
              ? currentFollowers + 1
              : Math.max(0, currentFollowers - 1),
          },
        };
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update follow status."
      );
    } finally {
      setFollowLoading(false);
    }
  }

  async function uploadAvatar(file: File) {
    try {
      setUploadingAvatar(true);
      setMessage("");

      const token = localStorage.getItem("six20-token");

      if (!token) {
        setMessage("Please log in again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.file?.url) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Profile photo upload failed."
        );
      }

      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000";

      const fullUrl = `${apiBase}${data.file.url}`;

      setAvatarUrl(fullUrl);
      setMessage("Photo uploaded. Click Save changes to keep it.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload profile photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setMessage("");

      const token = localStorage.getItem("six20-token");

      if (!token) {
        setMessage("Please log in again.");
        return;
      }

      const data = (await apiFetch("/api/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || null,
          bio: bio.trim() || null,
        }),
      })) as ProfileResponse;

      if (!data.success || !data.user) {
        throw new Error("Profile update failed.");
      }

      let updatedUser = data.user;

      try {
        const publicProfile = (await apiFetch(
          `/api/users/${data.user.id}`
        )) as ProfileResponse;

        if (publicProfile.success && publicProfile.user) {
          updatedUser = {
            ...data.user,
            ...publicProfile.user,
          };
        }
      } catch {
        // Keep update response if public profile request fails.
      }

      setUser(updatedUser);
      setDisplayName(updatedUser.displayName || "");
      setAvatarUrl(updatedUser.avatarUrl || "");
      setBio(updatedUser.bio || "");

      localStorage.setItem(
        "six20-user",
        JSON.stringify(updatedUser)
      );

      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("six20-token");
    localStorage.removeItem("six20-user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0d0b18",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading your SIX20 profile...
      </main>
    );
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0d0b18",
          color: "#ffffff",
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: "80px auto",
            background: "#17142b",
            border: "1px solid #2b2745",
            borderRadius: 20,
            padding: 30,
          }}
        >
          <h1 style={{ marginTop: 0 }}>SIX20 Profile</h1>

          <p style={{ color: "#aaa5c2" }}>
            {message || "You need to log in to continue."}
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              border: 0,
              borderRadius: 12,
              padding: "12px 20px",
              background: "#6947F5",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go to SIX20
          </button>
        </div>
      </main>
    );
  }

  const followers = user._count?.followers ?? 0;
  const following = user._count?.following ?? 0;
  const videos = user._count?.videos ?? 0;
  const ownProfile = currentUserId === user.id;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0b18",
        color: "#ffffff",
        padding: "30px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 25,
          }}
        >
          <div>
            <div
              style={{
                color: "#6947F5",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 1,
              }}
            >
              SIX20
            </div>

            <h1
              style={{
                margin: "6px 0 0",
                fontSize: 32,
              }}
            >
              My Profile
            </h1>
          </div>

          <button
            onClick={logout}
            style={{
              border: "1px solid #3b355c",
              background: "transparent",
              color: "#ffffff",
              borderRadius: 12,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <section
          style={{
            background: "#17142b",
            border: "1px solid #2b2745",
            borderRadius: 22,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "#2a2450",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                (user.displayName || user.username || "S")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 25,
                }}
              >
                {user.displayName}
              </h2>

              <p
                style={{
                  margin: "7px 0",
                  color: "#aaa5c2",
                }}
              >
                @{user.username}
              </p>

              <p
                style={{
                  margin: "0 0 8px",
                  color: "#77718f",
                  fontSize: 14,
                }}
              >
                {user.email}
              </p>

              {user.bio && (
                <p
                  style={{
                    margin: 0,
                    color: "#d4d0e5",
                    lineHeight: 1.5,
                  }}
                >
                  {user.bio}
                </p>
              )}
            </div>

            {!ownProfile && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                style={{
                  border: 0,
                  borderRadius: 12,
                  padding: "12px 22px",
                  background: isFollowing
                    ? "#2b2745"
                    : "#6947F5",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: followLoading
                    ? "not-allowed"
                    : "pointer",
                  minWidth: 120,
                }}
              >
                {followLoading
                  ? "Updating..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginTop: 25,
            }}
          >
            <StatCard label="Videos" value={videos} />
            <StatCard label="Followers" value={followers} />
            <StatCard label="Following" value={following} />
          </div>
        </section>

        <section
          style={{
            background: "#17142b",
            border: "1px solid #2b2745",
            borderRadius: 22,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit profile</h2>

          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <label>
              <div
                style={{
                  fontSize: 13,
                  color: "#aaa5c2",
                  marginBottom: 8,
                }}
              >
                Display name
              </div>

              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid #373152",
                  background: "#0f0d1b",
                  color: "#ffffff",
                  outline: "none",
                }}
              />
            </label>

            <label>
              <div
                style={{
                  fontSize: 13,
                  color: "#aaa5c2",
                  marginBottom: 8,
                }}
              >
                Bio
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell the SIX20 community about yourself..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid #373152",
                  background: "#0f0d1b",
                  color: "#ffffff",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            </label>

            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#aaa5c2",
                  marginBottom: 8,
                }}
              >
                Profile photo
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#2a2450",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 26,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (displayName || user.username || "S")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: uploadingAvatar
                      ? "#40317e"
                      : "#6947F5",
                    color: "#ffffff",
                    fontWeight: 800,
                    cursor: uploadingAvatar
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {uploadingAvatar
                    ? "Uploading..."
                    : "Choose photo"}

                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        uploadAvatar(file);
                      }

                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "#77718f",
                  fontSize: 12,
                }}
              >
                JPG, PNG, WEBP or other supported image formats.
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                border: 0,
                borderRadius: 12,
                padding: "13px 20px",
                background: saving ? "#40317e" : "#6947F5",
                color: "#ffffff",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                width: "fit-content",
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            {message && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "#211d38",
                  color: "#d8d3ed",
                  fontSize: 14,
                }}
              >
                {message}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 style={{ marginBottom: 15 }}>Account status</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            <StatusCard
              title="Verification"
              value={user.isVerified ? "Verified" : "Not verified"}
            />

            <StatusCard
              title="Creator"
              value={
                user.isCreator
                  ? "Creator account"
                  : "Not a creator"
              }
            />

            <StatusCard
              title="Seller"
              value={
                user.isSeller
                  ? "Seller account"
                  : "Not a seller"
              }
            />

            <StatusCard
              title="Affiliate"
              value={
                user.isAffiliate
                  ? "Affiliate account"
                  : "Not an affiliate"
              }
            />

            <StatusCard
              title="Creator level"
              value={String(user.creatorLevel ?? 0)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

