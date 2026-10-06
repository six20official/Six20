"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Swords, Gamepad2, X, Dice5, Vote } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Opponent = { id: number; title: string; creatorId: number; creator?: { username?: string; displayName?: string } };
type Props = { liveId: number; isCreator: boolean; opponents: Opponent[]; onClose: () => void; event: Record<string, any> | null };
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("six20-token") || ""}` });
const box = "rounded-2xl border border-white/10 bg-white/[.04] p-3";
const formatNaira = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format((Number(kobo) || 0) / 100);

export default function LivePlayDrawer({ liveId, isCreator, opponents, onClose, event }: Props) {
  const [tab, setTab] = useState<"play" | "battle">("play");
  const [playData, setPlayData] = useState<any>({ games: [], polls: [] });
  const [battle, setBattle] = useState<any>(null);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [opponent, setOpponent] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const latestGame = useMemo(() => playData.games?.find((game: any) => game.kind === "ludo"), [playData.games]);
  const latestPoll = useMemo(() => playData.polls?.[0], [playData.polls]);
  const refresh = useCallback(async () => {
    try {
      const [play, battleResult, historyResult] = await Promise.all([
        apiFetch(`/api/live/${liveId}/play`, { headers: auth() }),
        apiFetch(`/api/live/${liveId}/battle`, { headers: auth() }),
        apiFetch(`/api/live/${liveId}/battle/history`, { headers: auth() }),
      ]);
      setPlayData(play); setBattle(battleResult.battle); setBattleHistory(historyResult.history || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load LIVE play."); }
  }, [liveId]);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 8_000); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => {
    if (!event) return;
    if (event.type === "open-battle") setTab("battle");
    if (["live.battle.invite", "live.battle.accept", "live.battle.start", "live.battle.update", "live.battle.end", "live.game.lobby", "live.game.join", "live.game.leave", "live.game.state", "live.game.action", "live.game.end", "live.poll.create", "live.poll.vote", "live.poll.update", "live.poll.end"].includes(event.type)) void refresh();
  }, [event, refresh]);
  useEffect(() => {
    const update = () => setSecondsLeft(battle?.endsAt ? Math.max(0, Math.ceil((new Date(battle.endsAt).getTime() - Date.now()) / 1000)) : 0);
    update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer);
  }, [battle?.endsAt]);

  async function act(path: string, body?: unknown) {
    setBusy(true); setError("");
    try { await apiFetch(path, { method: "POST", headers: auth(), body: JSON.stringify(body || {}) }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(false); }
  }

  const players = latestGame?.state?.players || [];
  const pollOptions = Array.isArray(latestPoll?.options) ? latestPoll.options as string[] : [];
  const counts = latestPoll?.counts || pollOptions.map(() => 0);

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="SIX20 LIVE Battle and PLAY">
    <div className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#100d20] p-4 shadow-2xl sm:rounded-[28px] sm:p-6">
      <header className="mb-4 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[.2em] text-fuchsia-200">SIX20 PLAY</div><h2 className="text-xl font-black">Play together, live</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-white/5" aria-label="Close"><X /></button></header>
      <nav className="mb-4 grid grid-cols-2 gap-2"><button onClick={() => setTab("play")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold ${tab === "play" ? "bg-violet-600" : "bg-white/5"}`}><Gamepad2 size={17} /> PLAY</button><button onClick={() => setTab("battle")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold ${tab === "battle" ? "bg-fuchsia-600" : "bg-white/5"}`}><Swords size={17} /> BATTLE</button></nav>
      {error && <div className="mb-3 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>}
      {tab === "battle" ? <section className={box}>
        <div className="mb-3 flex items-center gap-2 font-black"><Swords size={18} className="text-fuchsia-200" /> CREATOR VS CREATOR</div>
        {battle ? <div className="space-y-3"><div className="rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 p-4"><div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-white/50"><span>{battle.status}</span>{battle.status === "live" && <span>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><div><div className="text-xs text-white/55">TEAM A · {battle.sessionA?.creator?.username || "Creator A"}</div><div className="text-3xl font-black">{battle.scoreA}</div><div className="mt-1 text-xs text-amber-100">Gift support {formatNaira(battle.giftTotalAKobo)}</div></div><div className="font-black text-white/40">VS</div><div><div className="text-xs text-white/55">TEAM B · {battle.sessionB?.creator?.username || "Creator B"}</div><div className="text-3xl font-black">{battle.scoreB}</div><div className="mt-1 text-xs text-amber-100">Gift support {formatNaira(battle.giftTotalBKobo)}</div></div></div>{battle.status === "ended" && <div className="mt-3 text-center text-lg font-black text-amber-200">{battle.winnerCreatorId ? `Creator ${battle.winnerCreatorId} wins!` : "Battle draw"}</div>}</div>
          {battle.status === "invited" && isCreator && battle.sessionBId === liveId && <div className="flex gap-2"><button disabled={busy} onClick={() => void act(`/api/live/battles/${battle.id}/respond`, { accept: true })} className="min-h-11 flex-1 rounded-xl bg-emerald-600 font-bold">Accept battle</button><button disabled={busy} onClick={() => void act(`/api/live/battles/${battle.id}/respond`, { accept: false })} className="min-h-11 flex-1 rounded-xl bg-white/10 font-bold">Decline</button></div>}
          {battle.status === "accepted" && isCreator && <button disabled={busy} onClick={() => void act(`/api/live/battles/${battle.id}/start`)} className="min-h-11 w-full rounded-xl bg-fuchsia-600 font-black">Start countdown</button>}
          {battle.status === "live" && <p className="text-center text-sm text-white/60">Gift value in whole naira adds points. Each reaction adds one point.</p>}
        </div> : isCreator ? <div className="space-y-3"><p className="text-sm text-white/60">Invite another creator who is LIVE now.</p><select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-[#19152b] px-3"><option value="">Choose a creator LIVE…</option>{opponents.filter((item) => item.id !== liveId).map((item) => <option key={item.id} value={item.id}>{item.creator?.displayName || item.creator?.username || item.title} · LIVE {item.id}</option>)}</select><button disabled={busy || !opponent} onClick={() => void act(`/api/live/${liveId}/battle/invite`, { opponentSessionId: Number(opponent), durationSeconds: 180 })} className="min-h-11 w-full rounded-xl bg-fuchsia-600 font-black">Send battle invite</button></div> : <p className="text-sm text-white/55">A creator can invite another live creator to battle.</p>}
        {battleHistory.length > 0 && <div className="mt-3 border-t border-white/10 pt-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-white/50">Recent battle history</div>{battleHistory.slice(0, 3).map((item) => <div key={item.id} className="flex justify-between py-1 text-xs text-white/65"><span>Battle #{item.id} · {item.status}</span><span>{item.scoreA} – {item.scoreB}</span></div>)}</div>}
      </section> : <div className="space-y-3">
        <section className={box}><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-black"><Dice5 size={18} className="text-violet-200" /> LUDO</div><span className="text-xs text-white/45">2–4 players</span></div>
          {latestGame ? <div className="space-y-3"><div className="text-xs text-white/60">Lobby/game #{latestGame.id} · {latestGame.status}</div><div className="grid grid-cols-2 gap-2">{players.map((player: any, i: number) => <div key={player.userId} className="rounded-xl bg-white/5 p-2 text-xs">Player {i + 1} · {player.ready ? "Ready" : "Waiting"}{latestGame.status === "playing" && <div className="mt-1">Pieces: {player.pieces.join(" · ")}</div>}</div>)}</div>
            {latestGame.status === "lobby" && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void act(`/api/live/play/${latestGame.id}/join`)} className="min-h-10 flex-1 rounded-xl bg-white/10 px-3 text-sm font-bold">Join lobby</button><button disabled={busy} onClick={() => void act(`/api/live/play/${latestGame.id}/ready`, { ready: true })} className="min-h-10 flex-1 rounded-xl bg-violet-600 px-3 text-sm font-bold">Ready / Start</button><button disabled={busy} onClick={() => void act(`/api/live/play/${latestGame.id}/leave`)} className="min-h-10 rounded-xl bg-white/5 px-3 text-sm">Leave</button></div>}
            {latestGame.status === "playing" && <div className="space-y-2"><div className="text-sm">Turn: Player {(latestGame.state.turnIndex || 0) + 1}{latestGame.state.dice ? ` · Dice ${latestGame.state.dice}` : ""}</div><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void act(`/api/live/play/${latestGame.id}/action`, { action: "roll" })} className="min-h-11 flex-1 rounded-xl bg-violet-600 font-black">Roll server dice</button>{latestGame.state.dice && [0, 1, 2, 3].map((piece) => <button key={piece} disabled={busy} onClick={() => void act(`/api/live/play/${latestGame.id}/action`, { action: "move", pieceIndex: piece })} className="min-h-11 rounded-xl bg-indigo-600 px-3 text-sm font-bold">Move piece {piece + 1}</button>)}</div><p className="text-xs text-white/45">Dice and legal moves are validated by the server.</p></div>}
          </div> : isCreator && <button disabled={busy} onClick={() => void act(`/api/live/${liveId}/play/ludo`)} className="min-h-11 w-full rounded-xl bg-violet-600 font-black">Open Ludo lobby</button>}
        </section>
        {isCreator && <section className={box}><div className="mb-3 flex items-center gap-2 font-black"><Vote size={18} className="text-amber-200" /> AUDIENCE POLL</div><input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={180} placeholder="Poll question" className="mb-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"/><div className="space-y-2">{options.map((option, index) => <input key={index} value={option} onChange={(e) => setOptions((old) => old.map((value, i) => i === index ? e.target.value : value))} maxLength={60} placeholder={`Option ${index + 1}`} className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3" />)}</div><div className="mt-2 flex gap-2"><button disabled={options.length >= 6} onClick={() => setOptions((old) => [...old, ""])} className="min-h-10 flex-1 rounded-xl bg-white/5 text-sm">Add option</button><button disabled={busy} onClick={() => void act(`/api/live/${liveId}/polls`, { question, options, durationSeconds: 60 })} className="min-h-10 flex-1 rounded-xl bg-amber-300 font-black text-[#171226]">Create 60s poll</button></div></section>}
        {latestPoll && <section className={box}><div className="mb-2 font-black">{latestPoll.question}</div><div className="space-y-2">{pollOptions.map((option, index) => <button key={`${latestPoll.id}-${index}`} disabled={busy || latestPoll.status !== "open" || isCreator} onClick={() => void act(`/api/live/polls/${latestPoll.id}/vote`, { optionIndex: index })} className="flex min-h-10 w-full items-center justify-between rounded-xl bg-white/5 px-3 text-left text-sm disabled:opacity-65"><span>{option}</span><span className="text-violet-200">{counts[index] || 0}</span></button>)}</div>{isCreator && latestPoll.status === "open" && <button onClick={() => void act(`/api/live/polls/${latestPoll.id}/end`)} className="mt-2 min-h-10 w-full rounded-xl bg-white/10 text-sm font-bold">End poll</button>}<div className="mt-2 text-xs text-white/40">{latestPoll.status} · {latestPoll.totalVotes || 0} votes</div></section>}
        <div className="rounded-xl border border-white/5 bg-white/[.02] p-3 text-xs text-white/40">Trivia and Challenge are not enabled in this build yet.</div>
      </div>}
      <button onClick={onClose} className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/5 font-bold">Close</button>
    </div>
  </div>;
}
