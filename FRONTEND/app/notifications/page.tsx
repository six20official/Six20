"use client";

import { useState } from "react";
import FeatureShell, { Card } from "../../components/FeatureShell";

const initialNotifications = [
  {
    title: "Welcome to SIX20",
    message: "Your SIX20 journey starts here. Discover, connect and have fun.",
    time: "Now",
    unread: true,
  },
  {
    title: "New live session",
    message: "A creator you follow just started a live session.",
    time: "10m",
    unread: true,
  },
  {
    title: "Game challenge",
    message: "You have a new SIX20 game challenge waiting for you.",
    time: "30m",
    unread: false,
  },
  {
    title: "Marketplace",
    message: "New creator drops are available in the SIX20 Marketplace.",
    time: "1h",
    unread: false,
  },
];

export default function Page() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const markRead = (index: number) => {
    setNotifications((current) =>
      current.map((notification, i) =>
        i === index
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <FeatureShell
      title="Notifications"
      subtitle="Stay updated with everything happening across SIX20."
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <strong>
          {unreadCount} unread
        </strong>

        <button
          type="button"
          onClick={markAllRead}
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#fff",
            color: "#17132F",
            padding: "10px 14px",
            borderRadius: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Mark all as read
        </button>
      </div>

      <Card>
        <div style={{ display: "grid", gap: 4 }}>
          {notifications.map((notification, index) => (
            <button
              key={`${notification.title}-${index}`}
              type="button"
              onClick={() => markRead(index)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                width: "100%",
                padding: "16px 4px",
                border: 0,
                borderBottom:
                  index === notifications.length - 1
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
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg, #6C3BFF, #FF7A45)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                20
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <strong>{notification.title}</strong>

                  <span
                    style={{
                      color: "#8A8495",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {notification.time}
                  </span>
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#756F80",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {notification.message}
                </p>
              </div>

              {notification.unread && (
                <span
                  style={{
                    width: 9,
                    height: 9,
                    minWidth: 9,
                    marginTop: 7,
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
