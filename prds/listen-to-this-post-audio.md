# Listen to this post audio

Created: 2026-08-20 02:45 UTC
Last Updated: 2026-08-20 03:15 UTC
Status: Done

## Summary

Add a listen-to-this-post player on published posts. Speech is generated with Kokoro-82M (Apache 2.0) and stored in Convex file storage. Site settings own the defaults. The Drafts Inbox shows the same defaults and writes the same store.

## Problem

Readers cannot listen to a post. There is no TTS pipeline, no per-post audio override, and no player on `Post.tsx`.

## Proposed solution

One config store: `siteConfig.audio` (`enabledDefault`, `defaultVoice`) saved through existing runtime overrides. Inbox toggles are a view of that store. `draftSettings` mirrors the same two fields in the same mutation so `materializeDraft` can stamp them the way it already stamps `aiWrittenDefault`.

Per-post `audio` and `audioVoice` are optional frontmatter overrides (same tri-state as `newsletter` / `showFooter`). Omitted uses the site default.

On publish or sync of a post that should have audio, enqueue a Node action:

1. Strip markdown to plain text (title + body, drop code fences and images)
2. Skip if `audioContentHash` matches
3. Synthesize with Kokoro-82M via `kokoro-js` (`af_heart` female, `am_adam` male)
4. If Kokoro OOMs, retry Piper in a fresh isolate
5. Store a WAV in Convex `_storage` and save `storageId`, duration, and hash on the post

Failed generation does not block publish. The player hides when `audio` is false or there is no file. Pending shows a quiet "Audio not ready" line. Failed generation can fall back to the Web Speech API (no file stored).

## Files to change

- `convex/schema.ts` - posts audio fields, draftSettings audio fields, audioJobs table
- `convex/lib/audioText.ts` - markdown strip, frontmatter parse, content hash
- `convex/audioDefaults.ts` - read/write site settings + inbox mirror
- `convex/audio.ts` - enqueue helper, job mutations, public post audio query pieces
- `convex/audioGeneration.ts` - Kokoro action + Piper fallback action
- `convex/siteConfigData.ts` - keep inbox in sync when Config saves `audio`
- `convex/drafts.ts` - stamp defaults on fresh inbox publish, enqueue generation
- `convex/cms.ts` / `convex/posts.ts` - validators, list/get/sync, enqueue on publish
- `src/config/siteConfig.ts` - `AudioConfig` defaults (on, female)
- `src/pages/Dashboard.tsx` - Config card + editor fields
- `src/components/dashboard/DraftsInbox.tsx` - audio toggles bound to site settings
- `src/components/FrontmatterForm.tsx` - per-post audio / voice overrides
- `src/components/PostAudioPlayer.tsx` - player
- `src/pages/Post.tsx` - player under the title
- `scripts/sync-posts.ts` - parse `audio` / `audioVoice`
- `.claude/skills/frontmatter.md` and `content/pages/docs-frontmatter.md`

Do not touch `convex/voiceAgent.ts`. Do not add a second config store. Convex only.

## Edge cases and gotchas

- Existing published posts do not get a file until you save them in the dashboard or sync the markdown. Setting `audio: true` (or leaving it omitted while the site default is on) and saving is enough
- Existing `draftSettings` rows lack the new fields; they are optional and fall back to site defaults (on, female)
- Inbox publish reuses an existing post without re-stamping, same as `aiWritten`; generation still runs if the published post should have audio
- Draft markdown `audio` / `audioVoice` wins over defaults
- Kokoro is large; q8 first, then a fresh Piper isolate, then fail the job
- `am_adam` is the documented Kokoro male id (lower grade than `am_michael`; keep the requested id)
- Never store signed storage URLs; resolve with `ctx.storage.getUrl` on read
- No email addresses in UI or posts

## Verification

- [ ] Site Config has Post audio card, default on, default voice female
- [ ] Saving Config updates inbox toggles without a second store
- [ ] Changing inbox writes the same site settings values
- [ ] Frontmatter `audio: false` hides the player
- [ ] Publishing a Grok / inbox draft with defaults on enqueues audio
- [ ] Player sits under the title, no autoplay, theme tokens only
- [ ] Typecheck and convex-doctor stay clean

## Related

- Existing inbox default: `prds/ai-written-banner.md`
- Kokoro: https://github.com/hexgrad/kokoro
- kokoro-js: https://www.npmjs.com/package/kokoro-js
