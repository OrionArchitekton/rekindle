import { NextRequest, NextResponse } from "next/server";
import { MAX_SPEECH_CHARS, synthesizeSpeech, verifySpeechToken } from "@/lib/elevenlabs";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  let text: unknown, token: unknown;
  try {
    ({ text, token } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof text !== "string" ||
    typeof token !== "string" ||
    text.length === 0 ||
    text.length > MAX_SPEECH_CHARS
  ) {
    return NextResponse.json({ error: "Invalid speech request." }, { status: 400 });
  }

  // Only voice text this server generated and signed — keeps the TTS wallet closed.
  if (!verifySpeechToken(text, token)) {
    return NextResponse.json({ error: "Speech text not recognized." }, { status: 403 });
  }

  const ip = clientIp(req);
  const [perClient, global] = await Promise.all([
    checkRateLimit("speak", ip, 4, 60),
    checkRateLimit("speak-global", "all", 300, 86_400),
  ]);
  if (!perClient.allowed || !global.allowed) {
    return NextResponse.json(
      { error: "Voice budget is catching its breath. Try again soon." },
      { status: 429 },
    );
  }

  const speech = await synthesizeSpeech(text);
  if (!speech.ok) {
    return NextResponse.json({ error: "Voice synthesis unavailable." }, { status: 503 });
  }

  return new Response(speech.audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
