"use client";

import { useState } from "react";
import FeatureShell, {
  Card,
  btn,
  ghost,
} from "../../components/FeatureShell";

export default function Page() {
  const [name, setName] = useState("Ayo Creator");
  const [editing, setEditing] = useState(false);

  return (
    <FeatureShell
      title="Profile"
      subtitle="Manage your creator identity, posts and account settings."
    >
      <Card>
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "#1b5738",
              display: "grid",
              placeItems: "center",
              fontSize: 30,
            }}
          >
            ðŸ‡³ðŸ‡¬
          </div>

          <div>
            <h2 style={{ margin: "0 0 4px" }}>{name}</h2>

            <div style={{ color: "#8fa198" }}>
              @ayocreator
            </div>
          </div>
        </div>

        {editing ? (
          <div style={{ marginTop: 18 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #294037",
                background: "#09120e",
                color: "#fff",
              }}
            />

            <button
              style={{ ...btn, marginLeft: 8 }}
              onClick={() => setEditing(false)}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            style={{ ...ghost, marginTop: 18 }}
            onClick={() => setEditing(true)}
          >
            Edit profile
          </button>
        )}
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {[
          ["Followers", "12.4K"],
          ["Following", "184"],
          ["Posts", "37"],
        ].map(([label, value]) => (
          <Card key={label}>
            <div style={{ color: "#8fa198" }}>
              {label}
            </div>

            <strong style={{ fontSize: 24 }}>
              {value}
            </strong>
          </Card>
        ))}
      </div>

      <Card>
        <h2>Creator tools</h2>

        <p style={{ color: "#8fa198" }}>
          Create posts, manage your audience, review rewards
          and prepare your account for verification.
        </p>

        <button
          style={btn}
          onClick={() => alert("Creator dashboard opened")}
        >
          Open creator dashboard
        </button>
      </Card>
    </FeatureShell>
  );
}
