"use client";

import { useState } from "react";
import FeatureShell, { Card, btn } from "../../components/FeatureShell";

const questions = [
  ["What is Nigeria's largest city by population?", "Lagos"],
  ["Which instrument is strongly associated with talking drums?", "Drum"],
  ["What is jollof rice?", "Rice dish"],
];

const games = [
  {
    name: "SIX20 Quiz",
    description: "Daily questions, leaderboards and rewards.",
  },
  {
    name: "SIX20 Trivia",
    description: "Test your knowledge and challenge your friends.",
  },
  {
    name: "Word Challenge",
    description: "Daily word challenges and community competition.",
  },
];

export default function Page() {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState("");

  const submit = () => {
    const correct = questions[question][1];

    if (answer.trim().toLowerCase() === correct.toLowerCase()) {
      setScore((current) => current + 100);
    }

    setAnswer("");
    setQuestion((current) => (current + 1) % questions.length);
  };

  return (
    <FeatureShell
      title="Games"
      subtitle="Play quick community games, challenge friends and track your high scores."
    >
      <Card>
        <div style={{ color: "#756F80", marginBottom: 8 }}>
          Score: {score}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
          {questions[question][0]}
        </h2>

        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
          placeholder="Your answer"
          style={{
            padding: 14,
            width: "100%",
            maxWidth: 500,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            background: "#fff",
            color: "#17132F",
            outline: "none",
          }}
        />

        <br />

        <button
          type="button"
          style={{ ...btn, marginTop: 12 }}
          onClick={submit}
        >
          Submit answer
        </button>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {games.map((game) => (
          <Card key={game.name}>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>
              {game.name}
            </h3>

            <p
              style={{
                color: "#756F80",
                margin: "8px 0 16px",
              }}
            >
              {game.description}
            </p>

            <button
              type="button"
              style={btn}
              onClick={() => alert(`${game.name} opened`)}
            >
              Play
            </button>
          </Card>
        ))}
      </div>
    </FeatureShell>
  );
}
