"use client";

import { useEffect, useState } from "react";

type SIX20IntroProps = {
  onComplete?: () => void;
};

export default function SIX20Intro({ onComplete }: SIX20IntroProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="six20-intro">
      <div className="six20-intro-bg" />

      <div className="six20-intro-glow purple" />
      <div className="six20-intro-glow green" />
      <div className="six20-intro-glow gold" />
      <div className="six20-intro-glow coral" />

      <div className="six20-intro-rings">
        <div />
        <div />
        <div />
      </div>

      <div className="six20-intro-content">
        <div className="six20-intro-logo">
          <span>SIX</span>
          <strong>20</strong>
        </div>

        <div className="six20-intro-line" />

        <div className="six20-intro-title">
          WHERE ENTERTAINMENT
        </div>

        <div className="six20-intro-subtitle">
          COMES ALIVE
        </div>

        <div className="six20-intro-services">
          <span>LIVE</span>
          <span>PLAY</span>
          <span>MUSIC</span>
          <span>CHAT</span>
          <span>MARKET</span>
          <span>REWARDS</span>
        </div>

        <div className="six20-intro-loading">
          <div />
        </div>
      </div>
    </div>
  );
}