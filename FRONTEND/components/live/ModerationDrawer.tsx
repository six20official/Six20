"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Shield, Users, X } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Viewer = { user: { id: number; username: string; displayName: string; avatarUrl?: string | null }; joinedAt: string; role: string; muted: boolean };
type Settings = { chatEnabled: boolean; reactionsEnabled: boolean; giftsEnabled: boolean; slowModeSeconds: number };
const headers = () => ({ Authorization: `Bearer ${typeof window === "undefined" ? "" : localStorage.getItem("six20-token") || ""}` });

export default function ModerationDrawer({ liveId, onClose }: { liveId: number; onClose: () => void }) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [banned, setBanned] = useState<Viewer["user"][]>([]);
  const [settings, setSettings] = useState<Settings>({ chatEnabled: true, reactionsEnabled: true, giftsEnabled: true, slowModeSeconds: 0 });
  const [tab, setTab] = useState<"users" | "banned" | "controls">("users");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    const [usersResponse, settingsResponse] = await Promise.all([
      apiFetch(`/api/live/${liveId}/moderation/users`, { headers: headers() }),
      apiFetch(`/api/live/${liveId}/moderation/settings`, { headers: headers() }),
    ]);
    setViewers(usersResponse.viewers || []);
    setBanned(usersResponse.bannedUsers || []);
    setSettings(settingsResponse.settings);
  }, [liveId]);

  useEffect(() => { refresh().catch((e) => setError(e instanceof Error ? e.message : "Could not load moderation data.")); }, [refresh]);

  async function act(action: string, body: Record<string, unknown>) {
    setWorking(true); setError("");
    try { await apiFetch(`/api/live/${liveId}/moderation/${action}`, { method: "POST", headers: headers(), body: JSON.stringify(body) }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Moderation action failed."); }
    finally { setWorking(false); }
  }

  async function toggle(action: "chat" | "reactions" | "gifts") {
    const key = `${action}Enabled` as keyof Settings;
    await act(action, { enabled: !settings[key] });
  }

  const userRow = (user: Viewer["user"], actions: ReactNode) => <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-white/[.04] bg-white/[.04] p-3">
    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-600 font-black">{user.username.slice(0, 1).toUpperCase()}</div>}
    <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{user.displayName}</div><div className="text-xs text-white/50">@{user.username} · Viewer</div></div>
    <Link href={`/profile?userId=${user.id}`} className="text-xs text-violet-200">Profile</Link>
    <div className="flex flex-wrap justify-end gap-1">{actions}</div>
  </div>;

  const actionButton = (label: string, action: string, userId: number, color = "text-white/70") => <button disabled={working} type="button" onClick={() => void act(action, { userId })} className={`rounded-lg bg-white/5 px-2 py-1 text-[11px] font-bold disabled:opacity-40 ${color}`}>{label}</button>;

  return <div className="fixed inset-0 z-[80] flex justify-end bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="LIVE moderation">
    <button type="button" onClick={onClose} aria-label="Close moderation" className="absolute inset-0 cursor-default" />
    <section className="relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#100c20] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 p-5"><div className="flex items-center gap-3"><Shield className="text-fuchsia-300" /><div><h2 className="font-black">MODERATION</h2><p className="text-xs text-white/50">Creator controls · {viewers.length} live viewers</p></div></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-white/10"><X size={18} /></button></header>
      <nav className="grid grid-cols-3 gap-2 p-4">{(["users", "banned", "controls"] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${tab === item ? "bg-violet-600" : "bg-white/5 text-white/60"}`}>{item === "users" ? "Live users" : item === "banned" ? "Banned users" : "Controls"}</button>)}</nav>
      {error && <p className="mx-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
        {tab === "users" && (viewers.length ? viewers.map(({ user, muted }) => userRow(user, <>{muted && <span className="self-center px-1 text-[10px] text-amber-200">MUTED</span>}{actionButton("Mute", "mute", user.id, "text-amber-200")}{actionButton("Kick", "remove", user.id)}{actionButton("Ban", "ban", user.id, "text-rose-200")}</>)) : <p className="flex items-center gap-2 p-4 text-sm text-white/50"><Users size={16} />No audience members are connected.</p>)}
        {tab === "banned" && (banned.length ? banned.map((user) => userRow(user, actionButton("Unban", "unban", user.id, "text-emerald-200"))) : <p className="p-4 text-sm text-white/50">No users are banned from this LIVE.</p>)}
        {tab === "controls" && <div className="space-y-3">{(["chat", "reactions", "gifts"] as const).map((action) => <div key={action} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="font-bold capitalize">{action}</div><button type="button" disabled={working} onClick={() => void toggle(action)} className={`rounded-full px-3 py-1 text-xs font-black ${settings[`${action}Enabled` as keyof Settings] ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>{settings[`${action}Enabled` as keyof Settings] ? "ON" : "OFF"}</button></div>)}
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><label htmlFor="live-slow-mode" className="mb-2 block text-sm font-bold">Chat slow mode</label><select id="live-slow-mode" value={settings.slowModeSeconds} onChange={(e) => void act("slow-mode", { seconds: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-[#1c1730] p-3 text-sm"><option value={0}>Off</option><option value={5}>5 seconds</option><option value={10}>10 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></div>
        </div>}
      </div>
    </section>
  </div>;
}
