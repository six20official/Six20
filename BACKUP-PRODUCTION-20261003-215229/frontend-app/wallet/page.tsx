"use client";

import { useState } from "react";
import FeatureShell, { Card, btn, ghost } from "../../components/FeatureShell";

export default function Page() {
  const [coins, setCoins] = useState(2500);
  const [message, setMessage] = useState("");

  const addCoins = () => {
    setCoins((current) => current + 500);
    setMessage("500 SIX20 Coins added to your demo balance.");
  };

  const withdraw = () => {
    setMessage(
      "Withdrawal will be available after wallet and payment integration."
    );
  };

  return (
    <FeatureShell
      title="Wallet"
      subtitle="Manage your SIX20 Coins, rewards and creator earnings."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <Card>
          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 14,
            }}
          >
            SIX20 Coin Balance
          </p>

          <h2
            style={{
              margin: "8px 0 4px",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {coins.toLocaleString()}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 13,
            }}
          >
            Demo balance
          </p>
        </Card>

        <Card>
          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 14,
            }}
          >
            Creator Earnings
          </p>

          <h2
            style={{
              margin: "8px 0 4px",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            ₦0
          </h2>

          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 13,
            }}
          >
            Available earnings
          </p>
        </Card>

        <Card>
          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 14,
            }}
          >
            Affiliate Rewards
          </p>

          <h2
            style={{
              margin: "8px 0 4px",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            ₦0
          </h2>

          <p
            style={{
              margin: 0,
              color: "#756F80",
              fontSize: 13,
            }}
          >
            Referral earnings
          </p>
        </Card>
      </div>

      <Card className="mt-5">
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 22,
            fontWeight: 900,
          }}
        >
          Wallet Actions
        </h2>

        <p
          style={{
            margin: "0 0 16px",
            color: "#756F80",
            fontSize: 14,
          }}
        >
          Test the SIX20 wallet experience before connecting
          real payments and payouts.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            style={btn}
            onClick={addCoins}
          >
            Add 500 Coins
          </button>

          <button
            type="button"
            style={ghost}
            onClick={withdraw}
          >
            Withdraw
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              background: "#F7F4FF",
              color: "#17132F",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}
      </Card>

      <Card className="mt-5">
        <h2
          style={{
            margin: "0 0 14px",
            fontSize: 22,
            fontWeight: 900,
          }}
        >
          SIX20 Rewards
        </h2>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#FFF4EF",
            }}
          >
            <strong>Live rewards</strong>
            <p
              style={{
                margin: "4px 0 0",
                color: "#756F80",
                fontSize: 14,
              }}
            >
              Earn through eligible live activities and
              community engagement.
            </p>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#F4F8FF",
            }}
          >
            <strong>Affiliate rewards</strong>
            <p
              style={{
                margin: "4px 0 0",
                color: "#756F80",
                fontSize: 14,
              }}
            >
              Build your network and earn from eligible
              referrals.
            </p>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#F7F4FF",
            }}
          >
            <strong>Game rewards</strong>
            <p
              style={{
                margin: "4px 0 0",
                color: "#756F80",
                fontSize: 14,
              }}
            >
              Participate in SIX20 games and community
              challenges.
            </p>
          </div>
        </div>
      </Card>
    </FeatureShell>
  );
}
