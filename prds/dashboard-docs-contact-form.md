# Dashboard docs: how to place the contact form

Created: 2026-09-06 19:40 UTC
Last Updated: 2026-09-06 19:40 UTC
Status: Done

## Summary

Dashboard Docs never said how to put the contact form on a page. The Site Config card is a global switch. Placement is either `<!-- contactform -->` in the body or `contactForm: true` in frontmatter.

## Problem

An admin can turn on Site Config > Contact Form and still see no form. Docs only had one line: frontmatter `contactForm: true`. No shortcode. No note that the Config toggle does not place anything.

## Root cause

The writing topic lists `contactForm` as a one line field. The Newsletter topic repeats that one line. Site Config lists the card in the tabs table and never explains it.

## Proposed solution

Write the how-to in three docs topics, each answering the question from that screen:

- Writing: how to place it on a post or page
- Newsletter and AgentMail: mail delivery plus the same placement rules
- Site Config: the Audience card is the global switch, then go place it

Add a command palette feature entry for `contactform` / `contactForm` so Cmd+K opens the how-to.

## Files to change

- `src/components/dashboard/docsTopics.ts`
- `src/utils/dashboardSearch.ts`
- `src/components/dashboard/configGroups.ts`
- `src/utils/webmcp/catalog.test.tsx` (search assertion)
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Both placements at once: shortcode wins, one form only
- Global switch off: shortcode and frontmatter render nothing
- Mail needs `AGENTMAIL_API_KEY` and `AGENTMAIL_CONTACT_EMAIL` (inbox fallback)

## Verification

- [x] Writing, Newsletter, and Site Config topics include `<!-- contactform -->`, `contactForm: true`, and the Site Config switch
- [x] Cmd+K `contactform` hits the new feature entry
- [x] `tsc` and vitest pass
- [ ] Signed-in Docs click-through still open (dashboard login)
