# DEV post: ready to paste

Title: `Rekindle: your abandoned side project misses you 🔥`
Tags: `devchallenge, weekendchallenge, ai, googleai`
Cover image: upload `docs/screenshots/cover.png`

---

*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09)*

## What I Built

Every developer has one: the side project you started with real love, pushed a
few passionate commits to, and then... life. The tab closed. The flame went
quiet. Mine is [spark](https://github.com/OrionArchitekton/spark), an intention
setting app I started for my partner and me as the new year turned. One commit.
190 days of silence.

**Rekindle** is a coach for exactly that repo. Paste a dormant GitHub project
and it gives you three things:

1. **A diagnosis**: why the flame died, read honestly from your commit cadence
   and the gap between README ambition and what got built.
2. **A rekindle plan**: three steps, the first one deliberately small enough to
   do in under 15 minutes tonight.
3. **A corner speech**: a roughly 90-word hype speech about YOUR project, by
   name, delivered out loud like a cornerman between rounds.

[IMAGE 1 HERE: upload docs/screenshots/result-top.png, then delete this line]

The theme is passion. This is the tool for the week after the passion: the one
that gets you to open the project again.

## Demo

Live app: **https://rekindle-sooty.vercel.app**

Try it on any public GitHub repo you've gone quiet on. If you just want to see
a result instantly, [this link](https://rekindle-sooty.vercel.app/?demo=1)
renders a frozen real result (a live run against my abandoned `spark` repo,
with the real ElevenLabs audio). Everything else is computed live per request.

[IMAGE 2 HERE: upload docs/screenshots/result-full.png, then delete this line]

## Code

{% embed https://github.com/OrionArchitekton/rekindle %}

## How I Built It

Next.js 16 (App Router) with two server routes and a deliberately small
surface:

```
GitHub URL --> GitHub API (README, last commits, file tree)
                 |
                 v
        Gemini 2.5 Flash (temperature 0, JSON output, thinking off)
                 |   diagnosis + embers + plan + hype speech
                 v
        ElevenLabs TTS --> the corner speech, out loud
```

**Google AI does the reading.** `/api/rekindle` snapshots the repo (metadata,
README excerpt, last 10 commits, top-level files) and hands it to Gemini 2.5
Flash with `temperature: 0`, `responseMimeType: application/json`, and thinking
disabled, so output is fast, stable, and cheap. The interesting part was
the failure I hit first: with thinking enabled, Gemini's reasoning tokens count
against `maxOutputTokens`, so my 2048 cap silently truncated the JSON mid-field
and my parser (correctly) rejected it. Thinking off + a bigger cap fixed it.
The model output is schema-validated and length-clamped server-side; anything
malformed renders as an error, never as half-parsed UI.

**ElevenLabs does the believing.** The hype speech only lands when you hear it.
One catch: a public TTS endpoint on a server-side key is a free-for-all wallet
drain, so `/api/rekindle` HMAC-signs the speech text it generates and
`/api/speak` refuses anything unsigned (I verified the refusal with a
forged-token test, and rate limits sit on both routes). Nobody gets to use my
key as a generic text-to-speech proxy.

**Honest demo mode.** `/?demo=1` server-renders a frozen result so the demo is
deterministic. The frozen content is a real captured output from a live run,
checked in with its matching real audio, and the page discloses it.

Unit tests cover the pure core (URL parsing, prompt build, defensive JSON
parse). Built end-to-end in a Claude Code session (Claude Fable 5); the commit
trailers carry the co-author record, and I made the calls on idea, scope, and
submission.

## Prize Categories

**Best Use of Google AI** and **Best Use of ElevenLabs**: Gemini 2.5 Flash
reads the repo and writes the diagnosis, plan, and speech as strict JSON;
ElevenLabs (`eleven_multilingual_v2`) turns the speech into the voice in your
corner. The two are chained: what Gemini writes about your specific repo is
exactly what ElevenLabs says out loud.

Thanks for reading. Now go run `npm install` on the one you know I'm talking
about. 🔥
