import { RekindleApp } from "./rekindle-app";
import { DEMO_META, DEMO_REPO_URL, DEMO_RESULT } from "@/lib/demo-fixture";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const isDemo = params.demo === "1";

  return (
    <main
      className="min-h-screen px-4 py-12 sm:py-16"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(217, 119, 6, 0.18), transparent), #09090b",
      }}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
          <span aria-hidden>🔥</span> Rekindle
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Your abandoned side project misses you. Get a diagnosis, a plan, and a
          corner speech to bring the flame back.
        </p>
      </div>

      <div className="mt-10">
        <RekindleApp
          initialRepoUrl={isDemo ? DEMO_REPO_URL : undefined}
          initialResult={isDemo ? DEMO_RESULT : undefined}
          initialMeta={isDemo ? DEMO_META : undefined}
          demoAudioSrc={isDemo ? "/demo-speech.mp3" : undefined}
        />
      </div>

      <footer className="mx-auto mt-16 max-w-2xl text-center text-sm text-zinc-600">
        <p>
          Built for the{" "}
          <a
            href="https://dev.to/challenges/weekend-2026-07-09"
            className="underline hover:text-zinc-400"
          >
            DEV Weekend Challenge: Passion Edition
          </a>{" "}
          · Gemini reads the repo, ElevenLabs voices the comeback ·{" "}
          <a
            href="https://github.com/OrionArchitekton/rekindle"
            className="underline hover:text-zinc-400"
          >
            source
          </a>
        </p>
      </footer>
    </main>
  );
}
