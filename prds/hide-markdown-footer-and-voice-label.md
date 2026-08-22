# Hide markdown footer and audio voice labels

Created: 2026-08-22 19:07 UTC
Last Updated: 2026-08-22 19:15 UTC
Status: Done

## Summary

Turn off the markdown "Connect with me" footer with the existing `footer.enabled` switch, and stop showing Male voice / Female voice on the listen player.

## Problem

The site renders two footers stacked:

1. Markdown footer from `content/pages/footer.md`: "Connect with me on Twitter/X, LinkedIn, and GitHub."
2. Social footer: icons, llms.txt / AGENTS.md, copyright.

They look like duplicates. The listen player also prints "Female voice" or "Male voice" under the title on posts.

## Root cause

Two independent footer systems. `siteConfig.footer` is the markdown block. `siteConfig.socialFooter` is the icon bar. Both were on.

The player always rendered `voiceLabel` next to duration, and "Browser voice · female voice" on the Web Speech fallback.

## Proposed solution

1. Set `siteConfig.footer.enabled` to `false`. Same master switch pattern as `newsletter.enabled`. Content in `footer.md` stays so it can be turned back on.
2. Clarify the Dashboard Config Footer card so it is obvious this is the markdown block above the social icon bar.
3. Remove the voice gender label from `PostAudioPlayer`. Keep Listen/Pause, progress, and duration. Browser fallback status stays "Browser voice" with no gender.

## Files to change

- `src/config/siteConfig.ts` - `footer.enabled: false`
- `src/pages/Dashboard.tsx` - Footer card copy so it is distinct from Social Footer
- `src/components/PostAudioPlayer.tsx` - drop Male/Female voice text
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases and gotchas

- Dashboard-saved Convex overrides merge on top of the file. If Enable footer was saved on, uncheck it in Config and Save or the markdown footer stays.
- Pages do not have a listen player. Voice labels only appear on posts.
- Per-post `showFooter: true` cannot bring the markdown footer back while the global switch is off. That matches newsletter.

## Verification

- [x] Homepage, a post, a page, and `/blog` show the icon footer only. No "Connect with me" line.
- [x] Dashboard Config Footer card unchecked for Enable footer. Social Footer still on.
- [x] A post with audio shows Listen, progress, and time. No Female voice or Male voice. Browser fallback says Browser voice only.

## Related

- `src/config/siteConfig.ts` `footer` vs `socialFooter`
- `prds/listen-to-this-post-audio.md`
