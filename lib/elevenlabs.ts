import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const EL_BASE = "https://api.elevenlabs.io/v1";
// "Adam" premade voice: warm, energetic. Override with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB";
export const MAX_SPEECH_CHARS = 900;

function hmacKey(): Buffer {
  // Derive a signing key from existing secret material; never expose the raw key.
  const secret = process.env.SPEECH_SIGNING_SECRET ?? process.env.ELEVENLABS_API_KEY ?? "";
  return createHash("sha256").update(`rekindle-speech-v1:${secret}`).digest();
}

/** Signs server-generated speech text so /api/speak only voices what we produced. */
export function speechToken(text: string): string {
  return createHmac("sha256", hmacKey()).update(text).digest("hex");
}

export function verifySpeechToken(text: string, token: string): boolean {
  if (typeof token !== "string" || token.length !== 64) return false;
  const expected = Buffer.from(speechToken(text), "hex");
  let provided: Buffer;
  try {
    provided = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(expected, provided);
}

export type SpeechResult =
  | { ok: true; audio: ArrayBuffer }
  | { ok: false; error: "config" | "rate_limited" | "upstream" };

export async function synthesizeSpeech(text: string): Promise<SpeechResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { ok: false, error: "config" };
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE;

  const res = await fetch(
    `${EL_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, MAX_SPEECH_CHARS),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.55 },
      }),
    },
  );

  if (res.status === 429) return { ok: false, error: "rate_limited" };
  if (!res.ok) return { ok: false, error: "upstream" };
  return { ok: true, audio: await res.arrayBuffer() };
}
