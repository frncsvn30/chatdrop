import { useState, useEffect } from "react";

// ui components
import TypewriterText from './components/TypeWriter';
import { GLSLHills } from "@/components/ui/glsl-hills";

// headless ui
import { Listbox } from "@headlessui/react";

// icons
import {
  UserIcon,
  UsersIcon,
  ClockIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";

import { CheckIcon } from "@heroicons/react/24/solid";

function HeroPage({ onStartRoom }) {
    const [isDark, setIsDark] = useState(true);
    const [roomNameError, setRoomNameError] = useState("");
    const [aliasError, setAliasError] = useState("");
    const [showAliasModal, setShowAliasModal] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const durations = [
        { label: "5 Minutes", seconds: 300 },
        { label: "10 Minutes", seconds: 600 },
        { label: "15 Minutes", seconds: 900 },
        { label: "30 Minutes", seconds: 1800 },
        { label: "1 Hour", seconds: 3600 },
    ];

    const [roomName, setRoomName] = useState("");
    const [alias, setAlias] = useState("");
    const [duration, setDuration] = useState(durations[0]);
    const [maxParticipants, setMaxParticipants] = useState(2);

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

    const handleModalClose = () => {
        setShowAliasModal(false);
        setAliasError("");
    };

    return (
        <div className="relative min-h-screen overflow-hidden">

            {/* background */}
            <div className="absolute inset-0 z-0">
                <GLSLHills dark={isDark} />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_40%,#ffffff_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_40%,#0d0d0d_100%)]" />
            </div>

            <div className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-6 md:px-8 lg:px-12">
                <header className="flex items-center justify-between py-8">
                    <div className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                        Chatdrop
                    </div>

                    <button
                        onClick={() => setIsDark(!isDark)}
                        aria-label="Toggle dark mode"
                        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/60 backdrop-blur-sm transition-all hover:border-neutral-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-[18px] w-[18px] text-neutral-700 transition-all duration-300 dark:text-neutral-200 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
                            style={{ position: isDark ? "absolute" : "static" }}
                        >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-[18px] w-[18px] text-neutral-200 transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"}`}
                        >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" /><path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" /><path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                    </button>
                </header>

                <div className="flex flex-col items-center pt-8 text-center">
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/60 px-4 py-1.5 text-sm text-neutral-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                        No sign-up required
                    </span>

                    <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-neutral-900 dark:text-white md:text-6xl">
                        Welcome to{" "}
                        <span className="hidden sm:inline">
                            <TypewriterText text="Chatdrop" speed={100} pause={5000} />
                        </span>
                        <span className="sm:hidden">Chatdrop</span>
                    </h1>

                    <p className="mt-5 max-w-md text-lg text-neutral-500 dark:text-neutral-400">
                        Create temporary chat rooms in seconds. No accounts, no clutter — just drop in and talk.
                    </p>

                    <button hidden className="mt-8 rounded-full bg-neutral-900 px-6 py-3 text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 cursor-pointer">
                        Create Room
                    </button>

                    {/* Cards section */}
                    <div className="grid grid-cols-1 gap-6 pt-16 pb-16 md:grid-cols-2">

                        {/* Card 1 — Initialize Secure Room */}
                        <div className="rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03]">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                                Initialize Secure Room
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Configure your temporary workspace. All parameters are immutable once created.
                            </p>

{/* Room name input */}
                             <div className="mt-6">
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                    Room Name
                                </label>

                                <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors focus-within:ring-2 dark:bg-neutral-900 ${
                                    roomNameError ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200 dark:border-red-500/50" : "border-neutral-200 focus-within:border-neutral-400 focus-within:ring-neutral-200 dark:border-neutral-800"
                                }`}>
                                    <UserIcon className={`h-5 w-5 ${roomNameError ? "text-red-400" : "text-neutral-400 dark:text-neutral-500"}`} />

                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => {
                                            setRoomName(e.target.value);
                                            if (e.target.value.trim()) setRoomNameError("");
                                        }}
                                        placeholder="e.g. Design Hangout"
                                        className="w-full bg-transparent font-medium text-neutral-900 text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 dark:text-white"
                                    />
                                </div>
                                {roomNameError && (
                                    <p className="mt-1 px-3 text-xs text-left text-red-500 dark:text-red-400">{roomNameError}</p>
                                )}
                            </div>
                            {/* Duration + participants */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                        Room Duration
                                    </label>

                                    <Listbox value={duration} onChange={setDuration}>
                                        <div className="relative">
                                            <Listbox.Button className="group flex h-12 w-full items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 transition-all hover:border-neutral-300 focus:outline-none focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-700 dark:focus-visible:border-neutral-500 dark:focus-visible:ring-neutral-800">
                                                <ClockIcon className="mr-3 h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500" />

                                                <span className="flex-1 text-left">{duration.label}</span>

                                                <ChevronUpDownIcon className="h-5 w-5 text-neutral-400 transition group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
                                            </Listbox.Button>

                                            <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
                                                {durations.map((item) => (
                                                    <Listbox.Option
                                                        key={item.label}
                                                        value={item}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm transition ${active
                                                                ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                                : "text-neutral-700 dark:text-neutral-200"
                                                            }`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <div className="flex items-center justify-between">
                                                                <span
                                                                    className={
                                                                        selected ? "font-medium text-neutral-900 dark:text-white" : ""
                                                                    }
                                                                >
                                                                    {item.label}
                                                                </span>

                                                                        {selected && (
                                                                            <CheckIcon className="h-4 w-4 text-neutral-500" />
                                                                        )}
                                                            </div>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </div>
                                    </Listbox>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                        Max Participants
                                    </label>

                                    <div className="relative">
                                        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 transition-colors focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-800">
                                            <UsersIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                                            <input
                                                type="number"
                                                min="2"
                                                max="20"
                                                value={maxParticipants}
                                                onChange={(e) => setMaxParticipants(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
                                                className="w-full bg-transparent font-medium text-sm text-neutral-900 outline-none dark:text-white"
                                            />
                                        </div>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setMaxParticipants(Math.max(2, maxParticipants - 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMaxParticipants(Math.min(20, maxParticipants + 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

{/* CTA */}
                              <button onClick={handleStartRoomClick} className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                                  Start Temporary Room
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                  </svg>
                              </button>
                        </div>

                        {/* Card 2 — Join Existing */}
                        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-white/[0.03]">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                                Join Existing
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Enter a shared session code to connect instantly.
                            </p>

                            {/* Access token */}
                            <div className="mt-6">
                                <label className="mb-2 block text-center text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                    Access Token
                                </label>
                                <div className="flex items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white/50 py-4 dark:border-white/10 dark:bg-black/30">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            placeholder="-"
                                            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-transparent text-center font-medium text-sm text-neutral-900 outline-none dark:border-white/10 dark:text-white"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <button className="mt-6 w-full cursor-pointer rounded-xl border border-neutral-200 bg-white py-3.5 font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
                                Join Session
                            </button>

                            {/* Verified protocol badge */}
                            <div className="mt-auto flex items-center text-left gap-3 pt-6">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Private Room Codes</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Messages deleted after expiration</p>
                                </div>
                            </div>
                        </div>

                        </div>
                    </div>

                    {showAliasModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleModalClose} />
                            <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    Set Your Alias
                                </h3>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    Choose a nickname for "{roomName}". This will be visible to other participants.
                                </p>

                                <div className={`mt-5 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors focus-within:ring-2 dark:bg-neutral-900 ${
                                    aliasError ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200 dark:border-red-500/50" : "border-neutral-200 focus-within:border-neutral-400 focus-within:ring-neutral-200 dark:border-neutral-800"
                                }`}>
                                    <UserIcon className={`h-5 w-5 ${aliasError ? "text-red-400" : "text-neutral-400 dark:text-neutral-500"}`} />

                                    <input
                                        type="text"
                                        value={alias}
                                        onChange={(e) => {
                                            setAlias(e.target.value);
                                            if (e.target.value.trim()) setAliasError("");
                                        }}
                                        placeholder="e.g. Anonymous Ghost"
                                        className="w-full bg-transparent font-medium text-neutral-900 text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 dark:text-white"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleModalStartRoom();
                                            }
                                        }}
                                    />
                                </div>
                                {aliasError && (
                                    <p className="mt-1 px-3 text-xs text-left text-red-500 dark:text-red-400">{aliasError}</p>
                                )}

                                <div className="mt-6 flex gap-3">
                                    <button onClick={handleModalClose} className="flex-1 cursor-pointer rounded-xl border border-neutral-200 py-3 font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10">
                                        Cancel
                                    </button>
                                    <button onClick={handleModalStartRoom} className="flex-[2] cursor-pointer rounded-xl bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                                        Join Room
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
    );
}

export default HeroPage;