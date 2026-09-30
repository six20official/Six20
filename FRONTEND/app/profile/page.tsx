"use client";

import { useState } from "react";
import FeatureShell, { Card, btn, ghost } from "../../components/FeatureShell";

export default function Page() {
  const [following, setFollowing] = useState(false);

  return (
    <FeatureShell
      title="Profile"
      subtitle="Your SIX20 identity, activity and community presence."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, #6C3BFF, #FF7A45)",
                color: "#fff",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              S
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                SIX20 Creator
              </h2>

              <p
                style={{
                  margin: "5px 0",
                  color: "#756F80",
                }}
              >
                @six20creator
              </p>

              <p
                style={{
                  margin: 0,
                  color: "#756F80",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Entertainment, live sessions, games and community vibes.
              </p>
            </div>

            <button
              type="button"
              style={following ? ghost : btn}
              onClick={() => setFollowing((current) => !current)}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </Card>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          <Card>
            <strong style={{ fontSize: 24 }}>0</strong>
            <p
              style={{
                margin: "5px 0 0",
                color: "#756F80",
              }}
            >
              Followers
            </p>
          </Card>

          <Card>
            <strong style={{ fontSize: 24 }}>0</strong>
            <p
              style={{
                margin: "5px 0 0",
                color: "#756F80",
              }}
            >
              Following
            </p>
          </Card>

          <Card>
            <strong style={{ fontSize: 24 }}>0</strong>
            <p
              style={{
                margin: "5px 0 0",
                color: "#756F80",
              }}
            >
              Posts
            </p>
          </Card>

          <Card>
            <strong style={{ fontSize: 24 }}>0</strong>
            <p
              style={{
                margin: "5px 0 0",
                color: "#756F80",
              }}
            >
              Games
            </p>
          </Card>
        </div>

        <Card>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            SIX20 Activity
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#F7F4FF",
              }}
            >
              <strong>Go Live</strong>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#756F80",
                  fontSize: 14,
                }}
              >
                Start entertaining your community.
              </p>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#FFF4EF",
              }}
            >
              <strong>Play Games</strong>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#756F80",
                  fontSize: 14,
                }}
              >
                Challenge friends and earn rewards.
              </p>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#F4F8FF",
              }}
            >
              <strong>Discover</strong>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#756F80",
                  fontSize: 14,
                }}
              >
                Find creators and new communities.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </FeatureShell>
  );
}
