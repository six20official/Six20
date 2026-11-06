"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SIX20Intro from "../components/SIX20Intro";

/**
 * SIX20 launch route. The cinematic brand intro is the only opening screen.
 * When it finishes, guests and signed-in members both land directly on FYP.
 * The previous discovery/marketing home is preserved at /home.
 */
export default function LaunchPage() {
  const router = useRouter();
  const [introFinished, setIntroFinished] = useState(false);

  const finishIntro = useCallback(() => {
    setIntroFinished(true);
  }, []);

  useEffect(() => {
    if (introFinished) {
      router.replace("/fyp");
    }
  }, [introFinished, router]);

  return (
    <main
      aria-label="SIX20 is opening"
      style={{
        minHeight: "100svh",
        background: "#100c21",
        color: "#fff",
      }}
    >
      <SIX20Intro onComplete={finishIntro} />
      <span
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Opening SIX20 entertainment.
      </span>
    </main>
  );
}
