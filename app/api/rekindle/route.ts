import { NextRequest, NextResponse } from "next/server";
import { buildGeminiPrompt, daysBetween, parseGeminiResponse, parseRepoUrl } from "@/lib/core";
import { speechToken } from "@/lib/elevenlabs";
import { callGemini } from "@/lib/gemini";
import { fetchRepoSnapshot } from "@/lib/github";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const { allowed } = await checkRateLimit("rekindle", clientIp(req), 6, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Easy, champ. Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let repoUrl: unknown;
  try {
    ({ repoUrl } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = typeof repoUrl === "string" ? parseRepoUrl(repoUrl) : null;
  if (!parsed) {
    return NextResponse.json(
      { error: "That doesn't look like a GitHub repo. Try owner/repo or a github.com URL." },
      { status: 400 },
    );
  }

  const snap = await fetchRepoSnapshot(parsed.owner, parsed.repo);
  if (!snap.ok) {
    const map = {
      not_found: { status: 404, msg: "Repo not found (private repos can't be read)." },
      rate_limited: { status: 503, msg: "GitHub is rate-limiting us. Try again shortly." },
      upstream: { status: 502, msg: "GitHub API error. Try again." },
    } as const;
    const { status, msg } = map[snap.error];
    return NextResponse.json({ error: msg }, { status });
  }

  const nowIso = new Date().toISOString();
  const prompt = buildGeminiPrompt(snap.snapshot, nowIso);
  const gemini = await callGemini(prompt);
  if (!gemini.ok) {
    const msg =
      gemini.error === "rate_limited"
        ? "The AI coach is over capacity. Try again in a minute."
        : "The AI coach is unavailable right now.";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const result = parseGeminiResponse(gemini.text);
  if (!result) {
    return NextResponse.json(
      { error: "The AI coach returned something unusable. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    result,
    meta: {
      owner: snap.snapshot.owner,
      repo: snap.snapshot.repo,
      stars: snap.snapshot.stars,
      language: snap.snapshot.language,
      dormantDays: daysBetween(snap.snapshot.pushedAt, nowIso),
    },
    speechToken: speechToken(result.hypeSpeech),
  });
}
