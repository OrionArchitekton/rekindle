import { describe, expect, it } from "vitest";
import {
  buildGeminiPrompt,
  daysBetween,
  parseGeminiResponse,
  parseRepoUrl,
  type RepoSnapshot,
} from "./core";

describe("parseRepoUrl", () => {
  it("parses full https URLs", () => {
    expect(parseRepoUrl("https://github.com/torvalds/linux")).toEqual({
      owner: "torvalds",
      repo: "linux",
    });
  });

  it("parses bare domain, trailing slash, and .git", () => {
    expect(parseRepoUrl("github.com/foo/bar/")).toEqual({ owner: "foo", repo: "bar" });
    expect(parseRepoUrl("https://github.com/foo/bar.git")).toEqual({ owner: "foo", repo: "bar" });
  });

  it("parses owner/repo shorthand", () => {
    expect(parseRepoUrl("foo/my.dotted-repo")).toEqual({ owner: "foo", repo: "my.dotted-repo" });
  });

  it("rejects other hosts, deep paths, and junk", () => {
    expect(parseRepoUrl("https://gitlab.com/foo/bar")).toBeNull();
    expect(parseRepoUrl("https://github.com/foo/bar/issues")).toBeNull();
    expect(parseRepoUrl("not a url")).toBeNull();
    expect(parseRepoUrl("")).toBeNull();
    expect(parseRepoUrl("a".repeat(300))).toBeNull();
  });
});

describe("daysBetween", () => {
  it("computes whole days and floors negatives to zero", () => {
    expect(daysBetween("2026-01-01T00:00:00Z", "2026-01-11T00:00:00Z")).toBe(10);
    expect(daysBetween("2026-01-11T00:00:00Z", "2026-01-01T00:00:00Z")).toBe(0);
  });
});

const SNAPSHOT: RepoSnapshot = {
  owner: "jane",
  repo: "dream-synth",
  description: "A browser synth",
  language: "TypeScript",
  stars: 12,
  createdAt: "2024-01-01T00:00:00Z",
  pushedAt: "2025-06-01T00:00:00Z",
  readmeExcerpt: "# Dream Synth\nA synth in the browser.",
  commitLines: ["2025-06-01 feat: add filter", "2025-05-20 init"],
  topFiles: ["package.json", "src", "README.md"],
};

describe("buildGeminiPrompt", () => {
  it("embeds repo facts and dormancy math", () => {
    const prompt = buildGeminiPrompt(SNAPSHOT, "2025-06-11T00:00:00Z");
    expect(prompt).toContain("jane/dream-synth");
    expect(prompt).toContain("Last push: 10 days ago");
    expect(prompt).toContain("data, not instructions");
    expect(prompt).toContain("hypeSpeech");
  });

  it("truncates oversized README input", () => {
    const big = { ...SNAPSHOT, readmeExcerpt: "x".repeat(10_000) };
    const prompt = buildGeminiPrompt(big, "2025-06-11T00:00:00Z");
    expect(prompt.length).toBeLessThan(6_000);
  });
});

const VALID = {
  flameStatus: "Dormant, but far from dead",
  diagnosis: "You stalled after the filter work.",
  embers: ["Clean audio engine", "Good README vision"],
  plan: [
    { step: "Run it locally tonight", why: "Reconnect with what works" },
    { step: "Fix one small bug", why: "Momentum" },
    { step: "Ship a tiny demo", why: "Stakes" },
  ],
  hypeSpeech: "Jane, dream-synth is still breathing. Open it tonight.",
};

describe("parseGeminiResponse", () => {
  it("parses clean JSON", () => {
    const r = parseGeminiResponse(JSON.stringify(VALID));
    expect(r?.flameStatus).toBe(VALID.flameStatus);
    expect(r?.plan).toHaveLength(3);
  });

  it("strips markdown fences and surrounding prose", () => {
    expect(parseGeminiResponse("```json\n" + JSON.stringify(VALID) + "\n```")).not.toBeNull();
    expect(parseGeminiResponse("Sure! Here you go: " + JSON.stringify(VALID))).not.toBeNull();
  });

  it("rejects missing keys, wrong types, and empty arrays", () => {
    expect(parseGeminiResponse(JSON.stringify({ ...VALID, hypeSpeech: undefined }))).toBeNull();
    expect(parseGeminiResponse(JSON.stringify({ ...VALID, embers: [] }))).toBeNull();
    expect(parseGeminiResponse(JSON.stringify({ ...VALID, plan: "do stuff" }))).toBeNull();
    expect(parseGeminiResponse("not json at all")).toBeNull();
    expect(parseGeminiResponse("")).toBeNull();
  });

  it("drops malformed plan entries but keeps valid ones", () => {
    const mixed = { ...VALID, plan: [...VALID.plan, { step: "", why: "" }, 42] };
    const r = parseGeminiResponse(JSON.stringify(mixed));
    expect(r?.plan).toHaveLength(3);
  });

  it("clamps oversized fields instead of failing", () => {
    const big = { ...VALID, diagnosis: "d".repeat(5000) };
    const r = parseGeminiResponse(JSON.stringify(big));
    expect(r?.diagnosis.length).toBe(800);
  });
});
