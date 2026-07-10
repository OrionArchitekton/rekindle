"use client";

import { useEffect, useRef, useState } from "react";
import type { RekindleResult } from "@/lib/core";

export interface RekindleMeta {
  owner: string;
  repo: string;
  stars: number;
  language: string | null;
  dormantDays: number;
}

interface Props {
  initialRepoUrl?: string;
  initialResult?: RekindleResult;
  initialMeta?: RekindleMeta;
  demoAudioSrc?: string;
}

const LOADING_LINES = [
  "Reading the commit history…",
  "Sifting through the ashes…",
  "Looking for embers…",
  "Writing your corner speech…",
];

type Status = "idle" | "loading" | "done" | "error";

export function RekindleApp({ initialRepoUrl, initialResult, initialMeta, demoAudioSrc }: Props) {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl ?? "");
  const [status, setStatus] = useState<Status>(initialResult ? "done" : "idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RekindleResult | null>(initialResult ?? null);
  const [meta, setMeta] = useState<RekindleMeta | null>(initialMeta ?? null);
  const [speechToken, setSpeechToken] = useState("");
  const [loadingLine, setLoadingLine] = useState(0);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "failed">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isDemo = Boolean(demoAudioSrc);

  useEffect(() => {
    if (status !== "loading") return;
    const t = setInterval(() => setLoadingLine((i) => (i + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(t);
  }, [status]);

  async function rekindle() {
    if (status === "loading" || !repoUrl.trim()) return;
    setStatus("loading");
    setError("");
    setResult(null);
    setAudioState("idle");
    try {
      const res = await fetch("/api/rekindle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setResult(data.result);
      setMeta(data.meta);
      setSpeechToken(data.speechToken);
      setStatus("done");
    } catch {
      setError("Network hiccup. Try again.");
      setStatus("error");
    }
  }

  async function playSpeech() {
    if (!result || audioState === "loading" || audioState === "playing") return;
    setAudioState("loading");
    try {
      let src = demoAudioSrc;
      if (!src) {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: result.hypeSpeech, token: speechToken }),
        });
        if (!res.ok) {
          setAudioState("failed");
          return;
        }
        src = URL.createObjectURL(await res.blob());
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => setAudioState("idle");
      audio.onerror = () => setAudioState("failed");
      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("failed");
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void rekindle();
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="github.com/you/that-project-you-abandoned"
          aria-label="GitHub repository URL"
          className="flex-1 rounded-xl border border-amber-900/40 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-6 py-3 font-semibold text-zinc-950 shadow-lg shadow-orange-900/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "loading" ? "Rekindling…" : "Rekindle it 🔥"}
        </button>
      </form>

      {status === "loading" && (
        <p className="text-center text-amber-300/80 animate-pulse" role="status">
          {LOADING_LINES[loadingLine]}
        </p>
      )}

      {status === "error" && (
        <p className="text-center text-red-400" role="alert">
          {error}
        </p>
      )}

      {status === "done" && result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
              🔥 {result.flameStatus}
            </span>
            {meta && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm text-zinc-400">
                {meta.owner}/{meta.repo} · quiet for {meta.dormantDays} days
              </span>
            )}
          </div>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
              The diagnosis
            </h2>
            <p className="leading-relaxed text-zinc-200">{result.diagnosis}</p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
              Still glowing
            </h2>
            <ul className="flex flex-col gap-2">
              {result.embers.map((ember, i) => (
                <li key={i} className="flex gap-2 text-zinc-200">
                  <span aria-hidden>✨</span>
                  <span>{ember}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
              The rekindle plan
            </h2>
            <ol className="flex flex-col gap-4">
              {result.plan.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-zinc-100">{p.step}</p>
                    <p className="text-sm text-zinc-400">{p.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-amber-700/40 bg-gradient-to-br from-amber-950/60 to-zinc-900 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
              Your corner speech
            </h2>
            <p className="mb-4 leading-relaxed text-amber-50 italic">
              “{result.hypeSpeech}”
            </p>
            <button
              onClick={() => void playSpeech()}
              disabled={audioState === "loading" || audioState === "playing"}
              className="rounded-xl border border-amber-500/60 bg-amber-500/10 px-5 py-2.5 font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              {audioState === "loading" && "Warming up the corner…"}
              {audioState === "playing" && "🔊 Playing…"}
              {(audioState === "idle" || audioState === "failed") && "Hear it out loud 🔊"}
            </button>
            {audioState === "failed" && (
              <p className="mt-2 text-sm text-red-400">Audio unavailable right now.</p>
            )}
          </section>

          {isDemo && (
            <p className="text-center text-xs text-zinc-500">
              Demo mode: this is a real Rekindle result, captured live and frozen for a
              deterministic demo. Try your own repo above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
