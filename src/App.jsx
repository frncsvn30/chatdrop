import { useState, useEffect } from 'react'

// Pages
import HeroPage from './HeroPage';
import ChatRoomPage from './ChatRoom';
import { GLSLHills } from "@/components/ui/glsl-hills";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const readRoomCodeFromUrl = () => {
  const m = window.location.pathname.match(/^\/r\/([A-Za-z0-9]{4,6})\/?$/);
  return m ? m[1].toUpperCase() : null;
};

function JoinPrompt({ code, onJoin, onCancel, error }) {
  const [isDark, setIsDark] = useState(true);
  const [alias, setAlias] = useState("");
  const [localError, setLocalError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const submit = async (e) => {
    e.preventDefault();
    if (!alias.trim()) {
      setLocalError("Please enter your alias");
      return;
    }
    setLocalError("");
    setVerifying(true);
    await onJoin(alias.trim());
    setVerifying(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GLSLHills dark={isDark} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_40%,#ffffff_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_40%,#0d0d0d_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Join Room #{code}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Pick a nickname to drop into this temporary room.
          </p>

          <form onSubmit={submit} className={`mt-5 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors focus-within:ring-2 dark:bg-neutral-900 ${(localError || error) ? "border-red-400 focus-within:ring-red-200 dark:border-red-500/50" : "border-neutral-200 focus-within:border-neutral-400 focus-within:ring-neutral-200 dark:border-neutral-800"}`}>
            <input
              type="text"
              value={alias}
              autoFocus
              disabled={verifying}
              onChange={(e) => { setAlias(e.target.value); if (e.target.value.trim()) setLocalError(""); }}
              placeholder="e.g. Anonymous Ghost"
              className="w-full bg-transparent font-medium text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 dark:text-white disabled:opacity-50"
            />
          </form>
          {(localError || error) && <p className="mt-1 px-1 text-xs text-red-500 dark:text-red-400">{localError || error}</p>}
          {verifying && <p className="mt-1 px-1 text-xs text-neutral-500 dark:text-neutral-400">Verifying room...</p>}

          <div className="mt-6 flex gap-3">
            <button onClick={onCancel} disabled={verifying} className="flex-1 cursor-pointer rounded-xl border border-neutral-200 py-3 font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={submit} disabled={verifying} className="flex-[2] cursor-pointer rounded-xl bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 disabled:opacity-50">
              {verifying ? "Verifying..." : "Join Room"}
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle dark mode"
          className="group absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/60 backdrop-blur-sm transition-all hover:border-neutral-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`h-[18px] w-[18px] text-neutral-700 transition-all duration-300 dark:text-neutral-200 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} style={{ position: isDark ? "absolute" : "static" }}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`h-[18px] w-[18px] text-neutral-200 transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"}`}>
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [roomConfig, setRoomConfig] = useState(null);
  const [joinCode, setJoinCode] = useState(() => readRoomCodeFromUrl());

  // Keep state in sync with browser back/forward navigation
  useEffect(() => {
    const onPop = () => {
      setRoomConfig(null);
      setJoinCode(readRoomCodeFromUrl());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleStartRoom = (config) => {
    const roomCode = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
    setRoomConfig({
      ...config,
      roomCode,
      createdAt: Date.now(),
    });
    window.history.pushState({}, '', `/r/${roomCode}`);
  };

  const verifyRoomExists = async (code) => {
    if (!isSupabaseConfigured) return true;
    return new Promise((resolve) => {
      const channel = supabase.channel(`room:${code}`);
      let timeout;
      channel
        .on("broadcast", { event: "room-info" }, () => {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve(true);
        })
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;
          channel.send({ type: "broadcast", event: "request-info", payload: {} });
          timeout = setTimeout(() => {
            supabase.removeChannel(channel);
            resolve(false);
          }, 3000);
        });
    });
  };

  const handleJoinSession = (code) => {
    window.history.pushState({}, '', `/r/${code}`);
    setJoinCode(code.toUpperCase());
  };

  const [joinError, setJoinError] = useState("");

  const handleJoinRoom = async (alias) => {
    if (!alias.trim()) {
      setJoinError("Please enter your alias");
      return;
    }
    setJoinError("");
    const exists = await verifyRoomExists(joinCode);
    if (!exists) {
      setJoinError("Room not found");
      return;
    }
    setRoomConfig({
      alias: alias.trim(),
      roomName: `Room #${joinCode}`,
      durationSeconds: 300,
      maxParticipants: 2,
      roomCode: joinCode,
      createdAt: null,
    });
    setJoinCode(null);
  };

  const handleLeaveRoom = () => {
    setRoomConfig(null);
    setJoinCode(null);
    window.history.pushState({}, '', '/');
  };

  if (roomConfig) {
    return (
      <ChatRoomPage
        roomCode={roomConfig.roomCode}
        roomName={roomConfig.roomName}
        durationSeconds={roomConfig.durationSeconds}
        userAlias={roomConfig.alias}
        maxParticipants={roomConfig.maxParticipants}
        createdAt={roomConfig.createdAt}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (joinCode) {
    return (
      <JoinPrompt
        code={joinCode}
        onJoin={handleJoinRoom}
        onCancel={handleLeaveRoom}
        error={joinError}
      />
    );
  }

  return <HeroPage onStartRoom={handleStartRoom} onJoinSession={handleJoinSession} />;
}

export default App;
