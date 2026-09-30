"use client";

import { useState } from "react";
import FeatureShell, { Card } from "../../components/FeatureShell";

const initialChats = [
  {
    name: "SIX20 Creator",
    message: "Welcome to SIX20! 👋",
    time: "Now",
    unread: true,
  },
  {
    name: "Tayo",
    message: "That live session was 🔥",
    time: "5m",
    unread: true,
  },
  {
    name: "Maya",
    message: "See you on the next live.",
    time: "18m",
    unread: false,
  },
];

export default function Page() {
  const [chats, setChats] = useState(initialChats);

  const markRead = (index: number) => {
    setChats((current) =>
      current.map((chat, i) =>
        i === index ? { ...chat, unread: false } : chat
      )
    );
  };

  return (
    <FeatureShell
      title="Messages"
      subtitle="Connect with creators, friends and the SIX20 community."
    >
      <Card>
        <div style={{ display: "grid", gap: 4 }}>
          {chats.map((chat, index) => (
            <button
              key={`${chat.name}-${index}`}
              type="button"
              onClick={() => markRead(index)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "16px 4px",
                border: 0,
                borderBottom:
                  index === chats.length - 1
                    ? "0"
                    : "1px solid rgba(0,0,0,0.07)",
                background: "transparent",
                color: "#17132F",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  minWidth: 46,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #6C3BFF, #FF7A45)",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                {chat.name.charAt(0)}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <strong>{chat.name}</strong>
                  <span
                    style={{
                      color: "#8A8495",
                      fontSize: 12,
                    }}
                  >
                    {chat.time}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: "#756F80",
                    fontSize: 14,
                  }}
                >
                  {chat.message}
                </div>
              </div>

              {chat.unread && (
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "#6C3BFF",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </Card>
    </FeatureShell>
  );
}
