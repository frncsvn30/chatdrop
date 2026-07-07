import { useState, useEffect, useRef } from "react";
import { GLSLHills } from "@/components/ui/glsl-hills";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import {
  ClockIcon,
  LinkIcon,
  ArrowLeftStartOnRectangleIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const AVATAR_COLORS = [
  "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
];

const colorFor = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

function ChatRoomPage({
  roomCode = "A8F3D2",
  roomName,
  durationSeconds = 300,
  userAlias = "Anonymous",
  maxParticipants = 2,
  createdAt: createdAtProp = null,
  onLeave = () => {},
}) {
  const [isDark, setIsDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");

  const senderId = useState(() => crypto.randomUUID())[0];
  const channelRef = useRef(null);
  const createdAtRef = useRef(createdAtProp);
  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  const prevParticipantsRef = useRef(new Set());
  const prevAliasesRef = useRef(new Map());
  const firstSyncRef = useRef(true);

  const aliasRef = useRef(userAlias);
  useEffect(() => {
    aliasRef.current = userAlias;
  }, [userAlias]);

  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const [participants, setParticipants] = useState([]);
  const [createdAt, setCreatedAt] = useState(createdAtProp);
  const [closed, setClosed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Channel subscription: broadcast (messages) + presence (who's here)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: senderId } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload]);
      })
      .on("broadcast", { event: "backfill" }, ({ payload }) => {
        if (payload.to !== senderId) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = prev.slice();
          for (const m of payload.messages) {
            if (!seen.has(m.id)) merged.push(m);
          }
          return merged;
        });
      })
      .on("broadcast", { event: "room-info" }, ({ payload }) => {
        if (!createdAtRef.current) {
          createdAtRef.current = payload.createdAt;
          setCreatedAt(payload.createdAt);
        }
      })
      .on("broadcast", { event: "request-info" }, () => {
        if (createdAtRef.current) {
          channel.send({ type: "broadcast", event: "room-info", payload: { createdAt: createdAtRef.current } });
        }
      })
      .on("broadcast", { event: "room-closed" }, () => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setClosed(true);
        onLeaveRef.current();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const people = Object.values(state).flat();
        setParticipants(people);

        const next = new Map(people.map((p) => [p.senderId, p.alias || "Anonymous"]));
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const sys = [];

        const newcomerIds = [];

        if (firstSyncRef.current) {
          firstSyncRef.current = false;
        } else {
          for (const [id, alias] of next) {
            if (!prevParticipantsRef.current.has(id) && id !== senderId) {
              sys.push({ id: crypto.randomUUID(), system: true, text: `${alias} joined the chat`, time });
              newcomerIds.push(id);
            }
          }
          for (const id of prevParticipantsRef.current) {
            if (!next.has(id) && id !== senderId) {
              const alias = prevAliasesRef.current.get(id) || "Someone";
              sys.push({ id: crypto.randomUUID(), system: true, text: `${alias} left the chat`, time });
            }
          }
        }

        // Offer chat history to late joiners (ephemeral — no database needed).
        // Only the longest-present member sends, to avoid duplicate backfills.
        if (newcomerIds.length && messagesRef.current.length) {
          const existing = people.filter((p) => !newcomerIds.includes(p.senderId));
          const oldest = existing.reduce(
            (a, b) => (a.joinedAt <= b.joinedAt ? a : b),
            existing[0]
          );
          if (oldest && oldest.senderId === senderId) {
            for (const id of newcomerIds) {
              channel.send({
                type: "broadcast",
                event: "backfill",
                payload: { to: id, messages: messagesRef.current },
              });
            }
          }
        }

        prevParticipantsRef.current = new Set(next.keys());
        prevAliasesRef.current = next;
        if (sys.length) setMessages((prev) => [...prev, ...sys]);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({ senderId, alias: aliasRef.current, joinedAt: Date.now() });
        if (createdAtRef.current) {
          channel.send({ type: "broadcast", event: "room-info", payload: { createdAt: createdAtRef.current } });
        } else {
          channel.send({ type: "broadcast", event: "request-info", payload: {} });
          // Fallback: if no one shares the room's createdAt, start our own clock
          setTimeout(() => {
            if (!createdAtRef.current) setCreatedAt(Date.now());
          }, 3000);
        }
      });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      firstSyncRef.current = true;
      prevParticipantsRef.current = new Set();
      prevAliasesRef.current = new Map();
    };
  }, [roomCode, senderId]);

  // Real, shared expiry — derived from the room's createdAt, not a local timer
  useEffect(() => {
    if (closed || !createdAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((createdAt + durationSeconds * 1000 - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        if (channelRef.current) {
          channelRef.current.send({ type: "broadcast", event: "room-closed", payload: {} });
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setClosed(true);
        onLeaveRef.current();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, durationSeconds, closed]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isLowTime = timeLeft <= 60;

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/r/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !channelRef.current) return;
    const msg = {
      id: crypto.randomUUID(),
      senderId,
      user: userAlias || "Anonymous",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    channelRef.current.send({ type: "broadcast", event: "message", payload: msg });
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="relative z-10 max-w-md rounded-2xl border border-neutral-200 bg-white/60 p-6 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Supabase not configured</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Add <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">VITE_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">VITE_SUPABASE_ANON_KEY</code> to your{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">.env</code> file, then restart the dev server.
          </p>
          <button
            onClick={onLeave}
            className="mt-5 cursor-pointer rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const peopleHere = participants.length || (createdAt ? 1 : 0);

  return (
    <div className="relative h-screen overflow-hidden">

      {/* background */}
      <div className="absolute inset-0 z-0">
        <GLSLHills dark={isDark} />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-6 md:px-8 lg:px-12">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-neutral-200 dark:border-white/10 dark:bg-white/5">
              <UserGroupIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
            </div>
            <div>
              <p className="text-sm font-semibold capitalize text-neutral-900 dark:text-white">
                {roomName || `Room #${roomCode}`}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {peopleHere}/{maxParticipants} here
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors ${
                isLowTime
                  ? "border-red-300 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                  : "border-neutral-200 bg-white/60 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              {createdAt ? formatTime(timeLeft) : "Connecting…"}
            </div>

            {/* Invite */}
            <button
              onClick={handleCopyInvite}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white/60 px-4 py-2 text-sm font-medium text-neutral-700 backdrop-blur-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Invite"}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle dark mode"
              className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/60 backdrop-blur-sm transition-all hover:border-neutral-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                className={`h-[18px] w-[18px] text-neutral-700 transition-all duration-300 dark:text-neutral-200 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
                style={{ position: isDark ? "absolute" : "static" }}
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                className={`h-[18px] w-[18px] text-neutral-200 transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"}`}
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </button>

            {/* Leave room */}
            <button
              onClick={onLeave}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
              Leave
            </button>
          </div>
        </header>

        {/* Main content: participants + chat */}
        <div className="flex min-h-0 flex-1 gap-6 pb-6">

          {/* Participants panel */}
          <aside className="hidden w-56 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white/60 p-4 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03] md:flex">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              In this room
            </p>
            <div className="flex flex-col gap-2">
              {participants.length === 0 && (
                <p className="px-2 py-2 text-sm text-neutral-400 dark:text-neutral-500">Waiting for others…</p>
              )}
              {participants.map((p) => {
                const isMe = p.senderId === senderId;
                const name = p.alias || "Anonymous";
                return (
                  <div key={p.senderId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-100/60 dark:hover:bg-white/5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isMe ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : colorFor(p.senderId)}`}>
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-medium capitalize text-neutral-800 dark:text-neutral-200">
                      {isMe ? `${name} (You)` : name}
                    </span>
                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Chat panel */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03]">

            {/* Messages */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-6">
              {messages.length === 0 && (
                <p className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                  No messages yet — say hello 👋
                </p>
              )}
              {messages.map((m, i) => {
                if (m.system) {
                  return (
                    <div key={m.id} className="mt-4 flex justify-center">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
                        {m.text}
                        <span className="ml-2 text-[10px] text-neutral-400 dark:text-neutral-500">{m.time}</span>
                      </span>
                    </div>
                  );
                }
                const isMe = m.senderId === senderId;
                const prev = messages[i - 1];
                const grouped = prev && !prev.system && !m.system && prev.senderId === m.senderId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${grouped ? "mt-1" : "mt-4"}`}>
                    <div className={`max-w-xs md:max-w-sm ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {!isMe && !grouped && (
                        <span className="mb-1 px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          {m.user}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-100"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 px-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                        {m.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-neutral-200 p-4 dark:border-white/10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-800"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoomPage;
