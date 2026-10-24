import { useState, useEffect } from "react";

// ui components
import { GLSLHills } from "@/components/ui/glsl-hills";

// icons
import {
    UserIcon,
    ArrowRightIcon,
    HashtagIcon,
    ClockIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const durations = [
    { label: "5m", long: "5 minutes", seconds: 300 },
    { label: "10m", long: "10 minutes", seconds: 600 },
    { label: "15m", long: "15 minutes", seconds: 900 },
    { label: "30m", long: "30 minutes", seconds: 1800 },
    { label: "1h", long: "1 hour", seconds: 3600 },
];

const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:00`;

const joinTips = [
    "Enter the 4-digit code, or paste the full invite link",
    "You'll pick an alias before you enter",
    "Everything is deleted when the room closes",
];

const labelClass = "text-sm font-medium text-neutral-800 dark:text-neutral-200";

const fieldBase =
    "flex h-12 items-center gap-3 rounded-lg border bg-white px-4 transition-colors focus-within:ring-4 dark:bg-white/[0.04]";

const fieldOk =
    "border-neutral-300 focus-within:border-neutral-900 focus-within:ring-neutral-900/10 dark:border-white/10 dark:focus-within:border-white/50 dark:focus-within:ring-white/10";

const fieldBad =
    "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/15 dark:border-red-500/60";

const primaryBtn =
    "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200";

function HeroPage({ onStartRoom, onJoinSession }) {
    const [isDark, setIsDark] = useState(true);
    const [mode, setMode] = useState("create"); // "create" | "join"

    const [roomName, setRoomName] = useState("");
    const [roomNameError, setRoomNameError] = useState("");
    const [duration, setDuration] = useState(durations[0]);
    const [maxParticipants, setMaxParticipants] = useState(2);

    const [alias, setAlias] = useState("");
    const [aliasError, setAliasError] = useState("");
    const [showAliasModal, setShowAliasModal] = useState(false);

    const [joinCode, setJoinCode] = useState("");
    const [joinCodeError, setJoinCodeError] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    // Escape closes modal + lock body scroll while open
    useEffect(() => {
        if (!showAliasModal) return;
        const onKey = (e) => {
            if (e.key === "Escape") handleModalClose();
        };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [showAliasModal]);

    const handleStartRoomClick = () => {
        if (!roomName.trim()) {
            setRoomNameError("Please enter a room name");
            return;
        }
        setShowAliasModal(true);
    };

    const handleModalStartRoom = () => {
        if (!alias.trim()) {
            setAliasError("Please enter your alias");
            return;
        }
        onStartRoom({
            alias: alias.trim(),
            roomName: roomName.trim(),
            durationSeconds: duration.seconds,
            maxParticipants,
        });
        setShowAliasModal(false);
        setAlias("");
        setAliasError("");
    };

    function handleModalClose() {
        setShowAliasModal(false);
        setAliasError("");
    }

    const extractRoomCode = (value) => {
        const trimmed = value.trim();
        const urlMatch = trimmed.match(/\/([A-Za-z0-9]{4,6})(?:\/|$)/);
        if (urlMatch) return urlMatch[1].toUpperCase();
        const clean = trimmed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        return clean.length === 4 ? clean : null;
    };

    // Resolves to { status: "ok" | "full" | "not_found" }.
    // The room itself is the source of truth for maxParticipants/participantCount —
    // this component's own `maxParticipants` state is only used when
    // *creating* a room and is irrelevant when joining one.
    const verifyRoomExists = async (code) => {
        if (!isSupabaseConfigured) return { status: "ok" };
        return new Promise((resolve) => {
            const channel = supabase.channel(`room:${code}`);
            let timeout;
            channel
                .on("broadcast", { event: "room-info" }, ({ payload }) => {
                    clearTimeout(timeout);
                    supabase.removeChannel(channel);
                    const { maxParticipants: roomMax, participantCount } = payload || {};
                    if (
                        typeof roomMax === "number" &&
                        typeof participantCount === "number" &&
                        participantCount >= roomMax
                    ) {
                        resolve({ status: "full" });
                    } else {
                        resolve({ status: "ok" });
                    }
                })
                .subscribe(async (status) => {
                    if (status !== "SUBSCRIBED") return;
                    channel.send({ type: "broadcast", event: "request-info", payload: {} });
                    timeout = setTimeout(() => {
                        supabase.removeChannel(channel);
                        resolve({ status: "not_found" });
                    }, 3000);
                });
        });
    };

    const handleJoinSession = async () => {
        const code = extractRoomCode(joinCode);
        if (!code) {
            setJoinCodeError("Enter a valid 4-digit code or invite link");
            return;
        }
        setJoinCodeError("");
        setVerifying(true);
        const result = await verifyRoomExists(code);
        setVerifying(false);
        if (result.status === "not_found") {
            setJoinCodeError("Room not found");
            return;
        }
        if (result.status === "full") {
            setJoinCodeError("Room is full");
            return;
        }
        onJoinSession?.(code);
    };

    const previewName = roomName.trim() || "Design Hangout";

    return (
        <div className="relative min-h-[100dvh] overflow-x-hidden bg-white text-neutral-900 dark:bg-[#0b0b0b] dark:text-white">
            {/* background — hills at a middle strength; the top is faded for the header/headline */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-70">
                    <GLSLHills dark={isDark} />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#ffffff_0%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,#0b0b0b_0%,transparent_40%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-6 sm:px-12 lg:px-16">
                {/* header */}
                <header className="flex items-center justify-between py-8 sm:py-10">
                    <div className="flex items-center gap-2.5">
                        <span className="text-md font-semibold tracking-tight">Chatdrop</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 sm:inline-flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            No sign-up required
                        </span>

                        <button
                            onClick={() => setIsDark(!isDark)}
                            aria-label="Toggle dark mode"
                            className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neutral-300 bg-white/70 text-neutral-700 backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`absolute transition-all duration-300 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                                    }`}
                            >
                                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                            </svg>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`absolute transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                                    }`}
                            >
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="m4.93 4.93 1.41 1.41" />
                                <path d="m17.66 17.66 1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="m6.34 17.66-1.41 1.41" />
                                <path d="m19.07 4.93-1.41 1.41" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* main — split layout */}
                <main className="grid flex-1 items-center gap-12 py-8 lg:grid-cols-2 lg:gap-20 lg:py-12">
                    {/* left: message + live preview */}
                    <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <p className="mb-5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            Temporary chat rooms
                        </p>

                        <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                            Chat now.
                            <br />
                            <span className="text-neutral-400 dark:text-neutral-500">Vanish later.</span>
                        </h1>

                        <p className="mt-6 max-w-sm text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-base">
                            Spin up a private room in seconds. No accounts, no history. Everything is deleted when the timer ends.
                        </p>

                        {/* meta row */}
                        <dl className="mt-8 hidden w-full max-w-md grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200 dark:divide-white/10 dark:border-white/10 sm:grid">
                            {[
                                { k: "Accounts", v: "None" },
                                { k: "Duration", v: "5 min – 1 hr" },
                                { k: "People", v: "2 – 20" },
                            ].map((item) => (
                                <div key={item.k} className="px-4 py-3 text-left first:pl-0">
                                    <dt className="text-xs text-neutral-500 dark:text-neutral-400">{item.k}</dt>
                                    <dd className="mt-0.5 text-sm font-semibold tabular-nums">{item.v}</dd>
                                </div>
                            ))}
                        </dl>

                        {/* live room preview — reflects the form */}
                        <div
                            aria-hidden
                            className="mt-8 hidden w-full max-w-md rounded-xl border border-neutral-200 bg-white/70 text-left backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/60 lg:block"
                        >
                            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-white/10">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                                    <span className="truncate text-sm font-medium">{previewName}</span>
                                </div>
                                <span className="shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                                    {formatClock(duration.seconds)} left
                                </span>
                            </div>

                            <div className="space-y-2.5 px-4 py-4">
                                <div className="flex">
                                    <div className="max-w-[80%] rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                                        <span className="mr-1.5 font-medium text-neutral-900 dark:text-white">Ghost</span>
                                        anyone here?
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white dark:bg-white dark:text-neutral-900">
                                        just dropped in
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2.5 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                                <span>1 of {maxParticipants} online</span>
                                <span>Deleted when the timer ends</span>
                            </div>
                        </div>
                    </section>

                    {/* right: form card */}
                    <section className="w-full lg:justify-self-end">
                        <div className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white text-left shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-black/40 lg:mr-0">
                            {/* tab switcher */}
                            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                                <div
                                    role="tablist"
                                    className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-white/[0.06]"
                                >
                                    {[
                                        { id: "create", label: "Create room" },
                                        { id: "join", label: "Join room" },
                                    ].map((tab) => {
                                        const active = mode === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => setMode(tab.id)}
                                                className={`h-10 cursor-pointer rounded-md text-sm font-medium transition-all ${active
                                                        ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                                                        : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* create panel */}
                            {mode === "create" && (
                                <div role="tabpanel" className="flex min-h-[27rem] flex-col p-5 sm:p-6">
                                    <div>
                                        <label htmlFor="room-name" className={`${labelClass} mb-2 block`}>
                                            Room name
                                        </label>
                                        <div className={`${fieldBase} ${roomNameError ? fieldBad : fieldOk}`}>
                                            <UserIcon
                                                className={`h-[18px] w-[18px] shrink-0 ${roomNameError ? "text-red-500" : "text-neutral-400 dark:text-neutral-500"
                                                    }`}
                                            />
                                            <input
                                                id="room-name"
                                                type="text"
                                                value={roomName}
                                                onChange={(e) => {
                                                    setRoomName(e.target.value);
                                                    if (e.target.value.trim()) setRoomNameError("");
                                                }}
                                                onKeyDown={(e) => e.key === "Enter" && handleStartRoomClick()}
                                                placeholder="e.g. Design Hangout"
                                                maxLength={40}
                                                className="w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
                                            />
                                        </div>
                                        {roomNameError && (
                                            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{roomNameError}</p>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        <span className={`${labelClass} mb-2 block`}>How long should it stay open?</span>
                                        <div role="radiogroup" aria-label="Room duration" className="grid grid-cols-5 gap-2">
                                            {durations.map((d) => {
                                                const active = d.seconds === duration.seconds;
                                                return (
                                                    <button
                                                        key={d.seconds}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={active}
                                                        onClick={() => setDuration(d)}
                                                        className={`h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors ${active
                                                                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                                                : "border-neutral-300 text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 dark:border-white/10 dark:text-neutral-300 dark:hover:border-white/30 dark:hover:text-white"
                                                            }`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className="mb-3 flex items-center justify-between">
                                            <label htmlFor="max-participants" className={labelClass}>
                                                Max participants
                                            </label>
                                            <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-md bg-neutral-100 px-2 text-sm font-semibold tabular-nums dark:bg-white/[0.08]">
                                                {maxParticipants}
                                            </span>
                                        </div>
                                        <input
                                            id="max-participants"
                                            type="range"
                                            min="2"
                                            max="20"
                                            step="1"
                                            value={maxParticipants}
                                            onChange={(e) => setMaxParticipants(Number(e.target.value))}
                                            className="h-1.5 w-full cursor-pointer accent-neutral-900 dark:accent-white"
                                        />
                                        <div className="mt-2 flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                                            <span>2</span>
                                            <span>20</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-neutral-100 px-3.5 py-2.5 text-xs text-neutral-600 dark:bg-white/[0.05] dark:text-neutral-400">
                                            <ClockIcon className="h-4 w-4 shrink-0" />
                                            <span>
                                                Closes after {duration.long}, up to {maxParticipants} people. Can&rsquo;t be changed later.
                                            </span>
                                        </div>
                                        <button onClick={handleStartRoomClick} className={primaryBtn}>
                                            Start room
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* join panel */}
                            {mode === "join" && (
                                <div role="tabpanel" className="flex min-h-[27rem] flex-col p-5 sm:p-6">
                                    <div>
                                        <label htmlFor="join-code" className={`${labelClass} mb-2 block`}>
                                            Room code or invite link
                                        </label>
                                        <div className={`${fieldBase} ${joinCodeError ? fieldBad : fieldOk}`}>
                                            <HashtagIcon
                                                className={`h-[18px] w-[18px] shrink-0 ${joinCodeError ? "text-red-500" : "text-neutral-400 dark:text-neutral-500"
                                                    }`}
                                            />
                                            <input
                                                id="join-code"
                                                type="text"
                                                value={joinCode}
                                                onChange={(e) => {
                                                    setJoinCode(e.target.value);
                                                    if (e.target.value.trim()) setJoinCodeError("");
                                                }}
                                                onKeyDown={(e) => e.key === "Enter" && !verifying && handleJoinSession()}
                                                placeholder="1234 or paste a link"
                                                disabled={verifying}
                                                autoCapitalize="characters"
                                                autoComplete="off"
                                                spellCheck={false}
                                                className="w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50 dark:text-white dark:placeholder:text-neutral-500"
                                            />
                                        </div>
                                        {joinCodeError && (
                                            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{joinCodeError}</p>
                                        )}
                                        {verifying && (
                                            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Checking the room…</p>
                                        )}
                                    </div>

                                    <ul className="mt-6 space-y-3">
                                        {joinTips.map((tip) => (
                                            <li key={tip} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/[0.08]">
                                                    <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                                                </span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto pt-6">
                                        <button onClick={handleJoinSession} disabled={verifying} className={primaryBtn}>
                                            {verifying ? "Checking…" : "Join room"}
                                            {!verifying && <ArrowRightIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                <footer className="flex flex-col items-center justify-between gap-2 border-t border-neutral-200/70 py-6 text-xs text-neutral-400 dark:border-white/10 dark:text-neutral-500 sm:flex-row">
                    <span>Chatdrop</span>
                    <span>Rooms expire automatically. Nothing is stored.</span>
                </footer>
            </div>

            {/* alias modal */}
            {showAliasModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="alias-title"
                >
                    <div className="absolute inset-0 bg-black/60" onClick={handleModalClose} />
                    <div className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-2xl sm:p-7">
                        <h3 id="alias-title" className="text-lg font-semibold tracking-tight">
                            Choose an alias
                        </h3>
                        <p className="mt-1.5 break-words text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Others in &ldquo;{roomName}&rdquo; will see this name.
                        </p>

                        <div className={`mt-6 ${fieldBase} ${aliasError ? fieldBad : fieldOk}`}>
                            <UserIcon
                                className={`h-[18px] w-[18px] shrink-0 ${aliasError ? "text-red-500" : "text-neutral-400 dark:text-neutral-500"
                                    }`}
                            />
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => {
                                    setAlias(e.target.value);
                                    if (e.target.value.trim()) setAliasError("");
                                }}
                                placeholder="e.g. Anonymous Ghost"
                                maxLength={24}
                                className="w-full min-w-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleModalStartRoom();
                                    }
                                }}
                            />
                        </div>
                        {aliasError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{aliasError}</p>}

                        <div className="mt-7 flex gap-3 pb-[env(safe-area-inset-bottom)]">
                            <button
                                onClick={handleModalClose}
                                className="h-12 flex-1 cursor-pointer rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button onClick={handleModalStartRoom} className={`${primaryBtn} flex-[2]`}>
                                Start room
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HeroPage;