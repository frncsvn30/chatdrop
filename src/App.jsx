import { useState, useEffect } from 'react'

// Pages
import HeroPage from './HeroPage';
import ChatRoomPage from './ChatRoom';

const readRoomCodeFromUrl = () => {
  const m = window.location.pathname.match(/^\/r\/([A-Za-z0-9]+)\/?$/);
  return m ? m[1].toUpperCase() : null;
};

function JoinPrompt({ code, onJoin, onCancel }) {
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!alias.trim()) {
      setError("Please enter your alias");
      return;
    }
    onJoin(alias.trim());
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Join Room #{code}
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          You've been invited to a temporary room. Pick a nickname to drop in.
        </p>

        <form onSubmit={submit} className={`mt-5 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors focus-within:ring-2 dark:bg-neutral-900 ${error ? "border-red-400 focus-within:ring-red-200 dark:border-red-500/50" : "border-neutral-200 focus-within:border-neutral-400 focus-within:ring-neutral-200 dark:border-neutral-800"}`}>
          <input
            type="text"
            value={alias}
            autoFocus
            onChange={(e) => { setAlias(e.target.value); if (e.target.value.trim()) setError(""); }}
            placeholder="e.g. Anonymous Ghost"
            className="w-full bg-transparent font-medium text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 dark:text-white"
          />
        </form>
        {error && <p className="mt-1 px-1 text-xs text-red-500 dark:text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 cursor-pointer rounded-xl border border-neutral-200 py-3 font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
            Cancel
          </button>
          <button onClick={submit} className="flex-[2] cursor-pointer rounded-xl bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
            Join Room
          </button>
        </div>
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
    const roomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoomConfig({
      ...config,
      roomCode,
      createdAt: Date.now(),
    });
    window.history.pushState({}, '', `/r/${roomCode}`);
  };

  const handleJoinRoom = (alias) => {
    setRoomConfig({
      alias,
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
      />
    );
  }

  return <HeroPage onStartRoom={handleStartRoom} />;
}

export default App;
