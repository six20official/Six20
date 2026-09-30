"use client";

import { useMemo, useState } from "react";
import FeatureShell, {
  Card,
  btn,
} from "../../components/FeatureShell";

const items = [
  {
    title: "SIX20 Live",
    text: "Watch creators and communities live.",
    tag: "LIVE",
  },
  {
    title: "Play",
    text: "Challenge friends with games and quizzes.",
    tag: "PLAY",
  },
  {
    title: "Music",
    text: "Discover sounds, artists and entertainment.",
    tag: "MUSIC",
  },
  {
    title: "Events",
    text: "Find events and experiences around you.",
    tag: "EVENTS",
  },
  {
    title: "Market",
    text: "Discover products, offers and creator picks.",
    tag: "MARKET",
  },
  {
    title: "Creators",
    text: "Find creators and communities to follow.",
    tag: "CREATORS",
  },
];

export default function Page() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.text.toLowerCase().includes(search) ||
        item.tag.toLowerCase().includes(search)
    );
  }, [q]);

  return (
    <FeatureShell
      title="Discover"
      subtitle="Explore everything happening across SIX20."
    >
      <Card>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search SIX20..."
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.05)",
            color: "white",
            outline: "none",
          }}
        />
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 18,
        }}
      >
        {filtered.map((item) => (
          <Card key={item.title}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.65,
                marginBottom: 10,
              }}
            >
              {item.tag}
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 22,
              }}
            >
              {item.title}
            </h2>

            <p
              style={{
                opacity: 0.7,
                lineHeight: 1.5,
              }}
            >
              {item.text}
            </p>

            <button
              style={btn}
              type="button"
              onClick={() => {}}
            >
              Explore
            </button>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <p style={{ margin: 0, opacity: 0.7 }}>
            No SIX20 content found for &quot;{q}&quot;.
          </p>
        </Card>
      )}
    </FeatureShell>
  );
}