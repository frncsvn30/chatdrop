import { useState, useEffect, useRef } from "react";
import { GLSLHills } from "@/components/ui/glsl-hills";

import {
  ClockIcon,
  LinkIcon,
  ArrowLeftStartOnRectangleIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

function ChatRoomPage({ roomCode = "A8F3D2", roomName, durationSeconds = 300, userAlias = "Anonymous", maxParticipants = 2, onLeave = () => {} }) {
  const [isDark, setIsDark] = useState(true);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const [messages, setMessages] = useState([
    { id: 1, user: "Anonymous Fox", text: `hey, room's live 👋 (expires in ${formatTime(durationSeconds)})`, time: "10:02 AM", isMe: false },
    { id: 2, user: "You", text: "nice, testing this out", time: "10:02 AM", isMe: true },
    { id: 3, user: "Anonymous Fox", text: `self-destructs in ${formatTime(durationSeconds)}, so talk fast`, time: "10:03 AM", isMe: false },
  ]);

  const scrollRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isLowTime = timeLeft <= 60;

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(`https://chatdrop.app/r/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        user: userAlias || "You",
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMe: true,
      },
    ]);
    setInput("");
  };

  const participants = [
    { name: userAlias ? `${userAlias} (You)` : "You", initials: (userAlias || "You").slice(0, 2).toUpperCase(), color: "bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white" },
    { name: "Anonymous Fox", initials: "AF", color: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300" },
    { name: "Quiet Wolf", initials: "QW", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  ].slice(0, maxParticipants);

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* background */}
      <div className="absolute inset-0 z-0">
        <GLSLHills dark={isDark} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 md:px-8 lg:px-12">

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
              {participants.length} people here
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
              {formatTime(timeLeft)}
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
        <div className="flex flex-1 gap-6 pb-6">

          {/* Participants panel */}
          <aside className="hidden w-56 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white/60 p-4 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03] md:flex">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              In this room
            </p>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-100/60 dark:hover:bg-white/5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${p.color}`}>
                    {p.initials}
                  </div>
                  <span className="truncate text-sm font-medium capitalize  text-neutral-800 dark:text-neutral-200">
                    {p.name}
                  </span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </aside>

          {/* Chat panel */}
          <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03]">

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs md:max-w-sm ${m.isMe ? "items-end" : "items-start"} flex flex-col`}>
                    {!m.isMe && (
                      <span className="mb-1 px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {m.user}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        m.isMe
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
              ))}
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