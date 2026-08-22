# Move post audio synthesis from Kokoro to the OpenAI speech API

Created: 2026-08-22 08:16 UTC
Last Updated: 2026-08-22 08:16 UTC
Status: Done

## Problem

`npx convex dev` failed to bundle and no Convex function could be pushed:

```
✘ [ERROR] Could not resolve "kokoro-js"
    convex/audioGeneration.ts:118:37
```

The whole deployment was blocked, not just the audio feature.

## Root cause

Two layers, one hiding the other.

The surface error was a missing install. Commit `4ecca4e` added `kokoro-js` to `package.json` and `package-lock.json`, but `npm install` never ran locally, so esbuild had nothing to resolve.

Installing it exposed the real problem. `kokoro-js` depends on `@huggingface/transformers`, which depends on `onnxruntime-node`. That package ships prebuilt native `.node` binaries for six platform targets, 208MB in total. esbuild has no loader for `.node` files, so bundling fails by design:

```
✘ [ERROR] No loader is configured for ".node" files:
  node_modules/onnxruntime-node/bin/napi-v3/darwin/arm64/onnxruntime_binding.node
```

The documented escape hatch for this is `node.externalPackages` in `convex.json`. It was tested and Convex rejected the push on size:

```
ModulesTooLarge: Total module size exceeded the zipped maximum
(169.36 MiB > maximum size 42.92 MiB)
```

Convex allows 45MB zipped and 240MB unzipped for the bundle plus external packages. Kokoro needs roughly 375MB unzipped, about 4x over. There is no configuration that makes local ONNX inference fit inside a Convex action. The original design in `prds/listen-to-this-post-audio.md` assumed it would.

## Solution

Replace only the synthesis step. Everything else in the audio feature (schema, `audioJobs` queue, content hashing, config store, frontmatter overrides, file storage, player) was sound and is untouched.

`convex/audioGeneration.ts` now calls the OpenAI speech API with `gpt-4o-mini-tts`. The `openai` package is already in `convex.json` `externalPackages` and already carries an `OPENAI_API_KEY`, so this adds no new dependency and no new bundling risk.

Requests use `response_format: "pcm"`, which returns raw 24kHz 16-bit signed little endian mono. Raw PCM concatenates cleanly across chunks, so a long post stays a single seamless WAV. MP3 would have needed frame-aware joining.

The Piper WASM fallback is gone. It existed to recover from Kokoro running out of memory in the isolate, which is not a failure mode of an HTTP API call.

## Files changed

- `convex/audioGeneration.ts` - Kokoro and Piper synthesis replaced with one OpenAI call path; `encodeWav` now takes PCM bytes instead of `Float32Array`; `generateAudioPiper`, `asFloat32`, `readGeneratedAudio`, and `isMemoryError` deleted
- `convex/lib/audioText.ts` - `kokoroVoiceId` becomes `ttsVoiceId`, `af_heart`/`am_adam` become `nova`/`onyx`, chunk size default 420 to 3500
- `convex/audio.ts` - `retryWithPiper` argument and its scheduler branch removed from `failAudioJob`
- `package.json` / `package-lock.json` - `kokoro-js` removed

## Decisions

- Voices are `nova` (female) and `onyx` (male). The site only exposes a male/female choice, so the specific ids stay internal to `ttsVoiceId`
- Chunk ceiling is 3500 characters. The binding limit for `gpt-4o-mini-tts` is 2000 input tokens, not the 4096 characters that applies to `tts-1`, and 3500 characters of English prose is roughly 900 tokens. Sentence-boundary splitting is already handled by `splitSpeechChunks`
- Chunks are requested sequentially. A typical post is 2 to 5 requests, well inside the action timeout, and sequential avoids OpenAI rate limit bursts on long posts
- Model is `gpt-4o-mini-tts`, the cheapest current speech model. Roughly 13 cents per 1500-word post

## Edge cases

- Dev has `OPENAI_API_KEY` set to the literal string `unset`, so generation returns a 401 and the job fails cleanly. Publishing is unaffected. Prod has a real key
- A missing key is caught before any request and fails the job with a readable message
- Existing posts with `audioContentHash` still set from a Kokoro run will not regenerate, because the hash covers voice and text, not the engine. Re-save or re-sync a post to force new audio
- Any post generated before this change keeps playing; the stored file is a WAV either way

## Verification

- [x] `npm install` then `npm uninstall kokoro-js` leaves a clean tree (also cleared 3 high-severity advisories from the ONNX and sharp subtree)
- [x] `npm run typecheck` passes
- [x] `npx convex dev --once` pushes successfully, `audioJobs` indexes created
- [x] `npm run lint` reports only 4 pre-existing problems in files this change did not touch
- [x] `npx convex-doctor@latest` 91/100, no new finding categories
- [ ] Browser pass: publish a post with audio on and confirm a WAV is generated and the player works. Needs `OPENAI_API_KEY` in dev, or test against prod

## Follow-up: the browser fallback only read part of the post

Reported right after the migration: audio stopped partway through a post.

It was not the new pipeline. `npx convex data audioJobs` showed three dev jobs, all
failed with `401 Incorrect API key provided: unset`, and zero jobs in prod. No post
had `audioStatus: "ready"`, so no generated file existed anywhere. With no `audioUrl`
and a failed status, `PostAudioPlayer.tsx` renders its Web Speech API fallback, and
that is what was playing.

The fallback had two real defects:

1. It passed the entire post to a single `SpeechSynthesisUtterance`. Chrome abandons
   a long utterance after roughly 15 seconds, which is the truncation that was heard.
2. It read `document.querySelector(".post-content, .docs-article").textContent`, so it
   skipped the title and read code blocks aloud, unlike the server path which strips
   code and prepends the title.

Fixes in `src/components/PostAudioPlayer.tsx`:

- `splitForSpeech` breaks the text into ~200 character sentence-aligned utterances and
  queues them, so the browser is never handed one long job
- A 10 second interval calls `pause()` then `resume()` while the fallback is playing,
  the standard workaround for Chrome stalling a queued run. It is scoped to the
  fallback and does not touch file playback
- `collectFallbackText` clones the content node, removes `pre` and `code`, and prepends
  the `h1`, matching `stripPostToSpeechText`
- The queue is cancelled before a new run so a second click cannot overlap

This makes the fallback correct, but it is a fallback. Real audio still needs a key.

## Related

- Original feature: `prds/listen-to-this-post-audio.md`
- Convex bundling and external package limits: https://docs.convex.dev/functions/bundling
- OpenAI speech API: https://platform.openai.com/docs/guides/text-to-speech
