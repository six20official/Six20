"use client";

import { useState } from "react";
import FeatureShell, { Card, btn, ghost } from "../../components/FeatureShell";

const products = [
  {
    name: "SIX20 Creator Hoodie",
    price: "₦25,000",
    icon: "👕",
    description: "Official SIX20 creator merchandise.",
  },
  {
    name: "SIX20 Vibes Cap",
    price: "₦9,500",
    icon: "🧢",
    description: "Wear the SIX20 energy everywhere.",
  },
  {
    name: "SIX20 Afrobeat Poster",
    price: "₦6,000",
    icon: "🎵",
    description: "Premium Afrobeat-inspired wall art.",
  },
  {
    name: "SIX20 Creator Sticker Pack",
    price: "₦3,500",
    icon: "✨",
    description: "Express yourself with SIX20 stickers.",
  },
];

export default function Page() {
  const [cart, setCart] = useState<string[]>([]);

  const addToCart = (name: string) => {
    setCart((current) => [...current, name]);
  };

  return (
    <FeatureShell
      title="Marketplace"
      subtitle="Discover SIX20 creator products, merchandise and community drops."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {products.map((product) => (
          <Card key={product.name}>
            <div
              style={{
                height: 150,
                borderRadius: 18,
                background:
                  "linear-gradient(135deg, #6C3BFF 0%, #FF7A45 100%)",
                display: "grid",
                placeItems: "center",
                fontSize: 58,
                marginBottom: 16,
              }}
            >
              {product.icon}
            </div>

            <h3
              style={{
                fontSize: 19,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              {product.name}
            </h3>

            <p
              style={{
                color: "#756F80",
                fontSize: 14,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {product.description}
            </p>

            <strong
              style={{
                display: "block",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              {product.price}
            </strong>

            <button
              type="button"
              style={btn}
              onClick={() => addToCart(product.name)}
            >
              Add to cart
            </button>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Your Cart ({cart.length})
        </h2>

        {cart.length === 0 ? (
          <p style={{ color: "#756F80" }}>
            Your SIX20 cart is empty.
          </p>
        ) : (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              {cart.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              style={{ ...ghost, marginTop: 16 }}
              onClick={() =>
                alert("SIX20 checkout is ready for payment integration.")
              }
            >
              Proceed to checkout
            </button>
          </>
        )}
      </Card>
    </FeatureShell>
  );
}
