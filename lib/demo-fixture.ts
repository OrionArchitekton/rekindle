import type { RekindleResult } from "./core";

// Frozen REAL output for demo mode (?demo=1): captured 2026-07-10 from a live
// /api/rekindle call against the repo below (Gemini gemini-2.5-flash, temperature 0),
// checked in so the demo renders deterministically server-side. The paired
// public/demo-speech.mp3 is the real ElevenLabs audio for this hypeSpeech.
// Disclosed in the UI as a frozen result.
export const DEMO_REPO_URL = "https://github.com/OrionArchitekton/spark";

export const DEMO_META = {
  owner: "OrionArchitekton",
  repo: "spark",
  stars: 2,
  language: "TypeScript",
  dormantDays: 190,
};

export const DEMO_RESULT: RekindleResult = {
  flameStatus: "Dormant, but far from dead",
  diagnosis: "The project, Spark Ritual Web v2, shows a single initial commit followed by 190 days of silence. This pattern often indicates a burst of initial enthusiasm and a clear vision, as evidenced by the detailed README, but a subsequent stall before significant development could take hold. It suggests the project might have been a proof of concept or an ambitious start that encountered an early, perhaps unexpected, blocker or shift in priorities.",
  embers: [
    "A clear, detailed README outlining ambitious features and a solid technical stack",
    "A well-defined architecture with notes on state, persistence, and sharing",
    "A personal, specific use case for 'Dan & Elisabeth' that grounds the project in real need",
  ],
  plan: [
    { step: "Open the project in your IDE and run 'npm install' then 'npm run dev'.", why: "This tiny step will confirm the project still runs and get you back into the environment. It's a low-stakes way to reconnect." },
    { step: "Explore the 'src/data' folder, specifically 'presets.ts' and 'copyDictionary.ts'.", why: "The README highlights these as customization points. Seeing the existing data will remind you of the core logic and the fun, personalized aspects you envisioned." },
    { step: "Make a small, visible change, like adding a new label to an existing preset in 'src/data/presets.ts'.", why: "This builds on the previous step, allowing you to directly interact with the project's data and see an immediate, tangible result in the running application, reinforcing your agency." },
  ],
  hypeSpeech: "Spark Ritual Web v2, this isn't just some throwaway idea, is it? You poured thought into a 'Dynamic Copy Engine,' a 'Chemistry Meter,' and even 'Surprise Moments' for Dan and Elisabeth. That README isn't just documentation, it's a blueprint for connection, a testament to the care you put into this. Two stars, 190 days, but the vision is still crystal clear. You built a foundation for something truly unique and personal. The code is waiting, the ideas are still vibrant. Let's get that engine humming again. Tonight, just open the project and run 'npm install' then 'npm run dev'.",
};
