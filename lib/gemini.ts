const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; error: "config" | "rate_limited" | "upstream" };

/** Calls Gemini with temperature 0 for deterministic, demo-stable output. */
export async function callGemini(prompt: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "config" };
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        // 2.5 models count thinking tokens against maxOutputTokens; keep thinking
        // off for deterministic, fast, non-truncated JSON.
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (res.status === 429) return { ok: false, error: "rate_limited" };
  if (!res.ok) return { ok: false, error: "upstream" };

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) return { ok: false, error: "upstream" };
  return { ok: true, text };
}
