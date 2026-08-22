# Rename markdown footer to closing note

Created: 2026-08-22 19:20 UTC
Last Updated: 2026-08-22 19:25 UTC
Status: Done

## Summary

The Connect with me markdown is not the site footer. Rename Dashboard and editor labels to Closing note. The icon bar is the Footer. Code keys stay `footer` and `socialFooter`.

## Problem

Site Config had a card called Markdown footer sitting above Social Footer. Both said footer. The markdown block is a sign-off line. The icon bar is the real footer.

## Proposed solution

User-facing copy only:

- Dashboard card: Closing note, checkbox Enable closing note
- Social Footer card title: Footer
- Post/page editor: Show closing note, Closing note, Show footer
- Comments in siteConfig and Footer.tsx match that language

Keep `siteConfig.footer`, `showFooter`, `content/pages/footer.md`, and `Footer.tsx`. Renaming those would break frontmatter and saved config.

## Files to change

- `src/pages/Dashboard.tsx`
- `src/config/siteConfig.ts`
- `src/components/Footer.tsx`
- `TASK.md`, `changelog.md`, `files.md`

## Verification

- [x] Site Config shows Closing note, not Markdown footer
- [x] The icon bar card is titled Footer
- [x] Enable closing note still writes `footer.enabled`
