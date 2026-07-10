# 🔥 Rekindle

Your abandoned side project misses you.

Paste a dormant GitHub repo. Rekindle reads its README, commit history, and file
tree, then delivers three things:

1. **A diagnosis**: why the flame died, read honestly from the commit cadence and
   the gap between README ambition and reality.
2. **A rekindle plan**: three steps, the first one small enough to do in under 15
   minutes tonight.
3. **A corner speech**: a 90-word hype speech about YOUR project, by name, spoken
   out loud like a cornerman between rounds.

Built for the [DEV Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09),
because passion is also the love that fuels late-night side projects, and every
developer has one whose flame went quiet.

## How it works

```
GitHub URL --> GitHub API (README, commits, tree)
                 |
                 v
          Gemini 2.5 Flash (temperature 0, JSON output)
                 |  diagnosis + embers + plan + hype speech
                 v
          ElevenLabs TTS --> your corner speech, out loud
```

- **Google AI (Gemini 2.5 Flash)** reads the repo snapshot and writes the
  diagnosis, plan, and speech as strict JSON (temperature 0, thinking disabled,
  defensively parsed and clamped server-side).
- **ElevenLabs** voices the speech (`eleven_multilingual_v2`).

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev
```

| Env var | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Gemini API access |
| `ELEVENLABS_API_KEY` | yes | Voice synthesis |
| `ELEVENLABS_VOICE_ID` | no | Override the default voice |
| `GITHUB_TOKEN` | no | Higher GitHub API rate limits |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | no | Durable rate limiting (Upstash REST also accepted) |

```bash
pnpm vitest run   # unit tests for the pure core (URL parse, prompt build, defensive parse)
pnpm build
```

## Security posture

- API keys live server-side only; the browser never sees them.
- `/api/speak` only voices text this server generated: `/api/rekindle` signs the
  hype speech with an HMAC token and `/api/speak` refuses anything unsigned
  (verified with a forged-token 403 test). Nobody can use the endpoint as a free
  TTS proxy.
- Per-IP and global rate limits on both API routes (Upstash/Vercel KV when
  configured, in-memory fallback otherwise).
- Prompt injection: repo content (README, commit messages) is framed as data,
  not instructions, and the model's output is schema-validated and length-clamped
  before rendering.

## Demo mode

`/?demo=1` server-renders a frozen result so the demo is deterministic. The
frozen content is a real captured output: a live `/api/rekindle` run against
[OrionArchitekton/spark](https://github.com/OrionArchitekton/spark) (a genuinely
abandoned New Year's Day project, quiet for 190 days), with the matching real
ElevenLabs audio checked in as `public/demo-speech.mp3`. The UI discloses demo
mode on the page.

## Honesty notes

- Built end-to-end in a Claude Code session (Claude Fable 5); the commit
  trailers carry `Co-Authored-By: Claude Fable 5`. The human in the loop chose
  the idea, gated the external actions, and owns the submission.
- The demo-mode result is frozen but real (see above). Live mode calls Gemini
  and ElevenLabs on every request.
