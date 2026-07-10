import { createHash } from "node:crypto";

// Fixed-window rate limit backed by Upstash/Vercel KV REST when configured,
// falling back to a per-instance in-memory window (best-effort on serverless).

function kvConfig(): { url: string; token: string } | null {
  // Vercel's Upstash integration injects KV_REST_API_*; raw Upstash uses UPSTASH_REDIS_REST_*.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryIncr(key: string, windowSeconds: number): number {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function kvIncr(key: string, windowSeconds: number): Promise<number | null> {
  const cfg = kvConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
      ]),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = data?.[0]?.result;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

export function clientKey(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export interface LimitCheck {
  allowed: boolean;
  backend: "kv" | "memory";
}

/** Returns whether this client may proceed for the given route window. */
export async function checkRateLimit(
  route: string,
  ip: string,
  limit: number,
  windowSeconds: number,
): Promise<LimitCheck> {
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${route}:${clientKey(ip)}:${windowId}`;
  const kvCount = await kvIncr(key, windowSeconds);
  if (kvCount !== null) return { allowed: kvCount <= limit, backend: "kv" };
  return { allowed: memoryIncr(key, windowSeconds) <= limit, backend: "memory" };
}
