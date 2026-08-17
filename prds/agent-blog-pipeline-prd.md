# PRD for the agent to blog pipeline on waynesutton.ai

One inbox where your agents file their work. You press publish.

Any coding tool, chatbot, or email can send content to waynesutton.ai. A server-side agent turns raw notes into a post in your voice, or passes finished articles through as-is. Everything lands in a review queue first. You approve, it publishes.

## Who this is for

You, first. Then anyone on the web who wants their agents to publish for them, even if their blog has no API. This PRD covers the single-tenant build on waynesutton.ai. The multi-tenant product reuses the same pipeline later.

## How the pipeline works

Five doors in, one queue, one button out.

```
INPUTS                          PIPELINE                     OUTPUT
claude code (skill/plugin)  →
cursor (skill)              →   POST /api/v1/drafts
codex (skill)               →   → voice agent rewrites   →  drafts inbox
email via agentmail         →     (or passes as-is)         → approve
x link                      →                                → published on
chatgpt / claude / grok     →                                  waynesutton.ai
```

Two modes decide what the server does with what arrives:

- **rewrite**: raw notes come in, the voice agent writes the post in your voice
- **as-is**: a finished article comes in, the server formats it and skips the rewrite

## What you need before you start

You already have most of this.

- Convex deployment for waynesutton.ai (markdown-site). Have it.
- AgentMail account. Have it, wired for newsletters already.
- GitHub account for the skill repo. Have it.
- One new env var on your machine: `BLOG_POST_KEY`
- Optional for the X feature: nothing. The free oEmbed endpoint covers single posts.

No new paid services for phase one.

## Convex schema

Four tables added to the markdown-site deployment.

```ts
drafts: defineTable({
  title: v.optional(v.string()),
  rawInput: v.string(),          // what arrived
  postBody: v.optional(v.string()), // what the voice agent wrote
  type: v.union(v.literal("session-summary"), v.literal("link-commentary"), v.literal("article")),
  mode: v.union(v.literal("rewrite"), v.literal("as-is")),
  source: v.string(),            // claude-code, cursor, codex, chatgpt, grok, claude, email
  links: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
  status: v.union(v.literal("inbox"), v.literal("approved"), v.literal("published"), v.literal("rejected")),
}).index("by_status", ["status"])

apiKeys: defineTable({
  keyHash: v.string(),
  label: v.string(),             // one key per tool so drafts show their source
  autoPublish: v.boolean(),
  lastUsed: v.optional(v.number()),
}).index("by_hash", ["keyHash"])

voiceProfile: defineTable({
  rules: v.string(),             // your write skill content, stored server-side
})

publishLog: defineTable({
  draftId: v.id("drafts"),
  publishedAt: v.number(),
  slug: v.string(),
})
```

Steal the key issue and hash pattern from your humanagent repo. It already does per-key scopes and usage tracking.

## Phase 1, the drafts API and review inbox

The write path. Everything else depends on this.

1. Add a Convex HTTP action at `POST /api/v1/drafts`. It checks the `x-api-key` header against `apiKeys`, validates the payload, inserts into `drafts` with status `inbox`.
2. Add a drafts view to your existing admin dashboard. List by status. Preview the post. Three buttons: publish, edit, reject.
3. Publish moves the content into your normal markdown-site content flow and writes to `publishLog`.
4. Generate three keys: claude-code, cursor, codex. Store hashes only.

Test it with curl before touching anything else:

```bash
curl -X POST https://waynesutton.ai/api/v1/drafts \
  -H "x-api-key: $BLOG_POST_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"article","mode":"as-is","title":"test","rawInput":"hello from curl","source":"curl"}'
```

If a draft shows up in your admin, phase one is done.

## Phase 2, the voice agent

A Convex action using the agent component. When a draft arrives with mode `rewrite`, it runs. It reads `rawInput` plus the `voiceProfile` rules, writes the post, saves it to `postBody`, and emails you a preview through AgentMail.

The voice profile is your write skill: short punchy sentences, sentence case headings, the banned word list, no em dashes. Paste it into the `voiceProfile` table once through the admin.

Mode `as-is` skips the agent. The server cleans up formatting, adds frontmatter, and queues it.

## Phase 3, the email door

This is the universal input. An email address is an API every tool already supports.

1. Create an inbox in AgentMail, something like `post@` on a domain you control.
2. Point its webhook at a new Convex HTTP action, `POST /api/hooks/agentmail`.
3. The action strips signatures and quoted replies, then inserts a draft with source `email`.
4. Subject line becomes the title hint. A subject starting with `as-is:` sets mode to as-is. Everything else defaults to rewrite.

Now Grok, a phone, a cron job, or a friend can all publish to your queue with zero setup.

## Phase 4, the skill for Claude Code, Cursor, and Codex

One SKILL.md in a new repo, `waynesutton/blogskill`. The skill instructs the agent to gather what happened this session (files changed, commits, decisions, gotchas), build the JSON payload, and curl it to the drafts endpoint using `$BLOG_POST_KEY`.

Install once per machine:

```bash
npx skills add waynesutton/blogskill
```

That drops the skill into the right folder for Claude Code, Cursor, and Codex. Trigger phrases in the skill description: "post this session", "write this up", "blog this".

Claude Code extra: a plugin with a `/post` command, plus an optional SessionEnd hook that offers a writeup when you close a session. Cursor and Codex just use the skill.

## Feature, turn an X link into a blog post

You send a link, the pipeline writes commentary on it.

How you send it, any door works:

- Email the link to `post@` with a line of context
- Tell Claude Code "blog about this: https://x.com/..." and the skill sends it as `link-commentary`
- Paste it into a quick-add box in the admin

What the server does:

1. Sees a `links` array containing an x.com URL
2. Fetches the post text through the free oEmbed endpoint: `https://publish.twitter.com/oembed?url={link}`. No auth, no cost, works for single public posts.
3. Voice agent writes your take: what the post says, why it caught your attention, your angle. Quotes stay short, link included.
4. Draft lands in the inbox like everything else.

Limit to know: oEmbed returns one post, not a full thread. For threads, paste the text into the email or note and include the link for attribution. If this becomes a daily habit, the X API basic tier is the upgrade path, but do not start there.

## Feature, send a finished article from ChatGPT, Claude, or Grok

You wrote the article in a chatbot. It should hit your blog without a copy-paste-format dance.

Ranked by effort:

1. **Email, works for all three today.** Copy the article, email it to `post@` with subject `as-is: {title}`. Done. Grok has no connector system, so this is the Grok path, full stop.
2. **MCP connector, for ChatGPT and Claude.** Both support custom connectors. Point them at the markdown-site MCP server with a new `create_draft` tool. Then "send this to my blog" works inside the chat itself.
3. **Admin paste box.** A textarea in the dashboard that creates an as-is draft. The fallback when you have the text on your clipboard anyway.

As-is mode means the pipeline respects your words. It formats, adds frontmatter and tags, and queues it. No rewrite.

## Phase 5, GitHub pull request review

An optional review surface. Instead of approving in the dashboard, you review posts as PRs. Merge equals publish.

Setup, one evening:

1. Create a content repo, `waynesutton/blog-content`. Posts live as markdown files with frontmatter in `/posts`.
2. Create a fine-grained PAT (or a small GitHub App) scoped to that one repo with contents and pull request permissions. Store it as a Convex env var, `GITHUB_TOKEN`.
3. Add a Convex action `openReviewPr`. It takes a draft, creates branch `post/{slug}`, commits the markdown file, opens a PR with the preview in the description.
4. Add a repo webhook for merged PRs pointing at `POST /api/hooks/github`. On merge, the action reads the file, publishes it to waynesutton.ai, flips the draft to published, writes `publishLog`.
5. Closed-without-merge marks the draft rejected.

What this buys you:

- Review from the GitHub mobile app with a real diff
- Edit the post by pushing to the branch, or point Claude Code at the branch to revise it
- Full version history and a git backup of every post for free

Frontmatter carries the draft id so the webhook knows what it published:

```yaml
---
draftId: "abc123"
title: "what I shipped this week"
tags: [convex, agents]
source: claude-code
---
```

## Phase 6, AgentMail approval loop

The second optional surface. Run the whole blog by replying to email.

1. After the voice agent writes a draft, an action sends the full rendered post to your personal email through AgentMail. Subject carries the draft id: `[draft abc123] what I shipped this week`.
2. Your reply hits the same AgentMail webhook from phase 3. The handler checks for a draft id in the subject before treating mail as a new submission.
3. First line of the reply is the command:
   - `publish` flips status and pushes it live
   - `edit: tighten the intro, cut the last section` sends the notes back through the voice agent, and a fresh preview lands in your inbox
   - `reject` closes it
4. Anything unrecognized gets a reply asking for one of the three commands.

No dashboard. Approve a post from your phone in the security line.

## Choosing a review surface per source

One status field, three surfaces. Set a default per API key or source in the `apiKeys` table:

| Source | Default surface | Why |
|--------|----------------|-----|
| Session summaries | Email reply | Low stakes, fast approve |
| Articles from chatbots | Email reply | Already written, just confirm |
| Long-form posts | GitHub PR | You want the diff and history |
| Anything | Admin dashboard | Always available as the fallback |

The pipeline does not care which surface flips the status. All three write to the same drafts table.

## Payload spec

Keep it dumb. The less the tools think, the more consistent the pipeline.

```json
{
  "type": "session-summary | link-commentary | article",
  "mode": "rewrite | as-is",
  "title": "optional hint",
  "rawInput": "markdown notes, article text, or a line of context",
  "links": ["https://x.com/..."],
  "source": "claude-code",
  "tags": ["convex", "agents"]
}
```

Required: type, mode, rawInput, source. Everything else optional.

## Build order

- **Weekend one**: phase 1. Drafts endpoint, keys, admin queue. Curl test passes.
- **Week one**: phase 2 voice agent, then phase 4 skill. Use it daily in Claude Code and Cursor.
- **Week two**: phase 3 email door, X link handler, as-is subject parsing.
- **Week three**: phase 6 AgentMail approval loop (small, reuses the phase 3 webhook), then phase 5 GitHub PR review.
- **Later**: nightly cron reading OpenSync sessions for the automatic daily summary, MCP `create_draft` tool, then the multi-tenant product.

Ship phase 1 first and use it for a week before building the rest. If the review queue feels good with curl-posted drafts, everything after it is just more doors.

## Completion log

- 2026-08-16 05:25 UTC: Phases 1 through 6 built in one pass, including the deferred MCP `create_draft` tool and the blog skill.
  - Phase 1: `convex/drafts.ts`, `convex/pipelineKeys.ts`, `POST /api/v1/drafts`, dashboard Drafts Inbox and API Keys sections. Curl test passed on dev (201 valid key, 401 invalid, publish flow verified).
  - Phase 2: `convex/voiceAgent.ts` on `@convex-dev/agent` with voice profile, RAG over published content, and X oEmbed link context.
  - Phase 3: email door in `POST /api/hooks/agentmail` with `as-is:` subject parsing and reply cleaning.
  - Phase 4: `blogskill/SKILL.md` authored locally; publish to `waynesutton/blogskill` manually.
  - Phase 5: `convex/githubReview.ts` opens review PRs; the GitHub webhook publishes on merge and rejects on close.
  - Phase 6: `convex/draftEmails.ts` sends previews; replies with publish, reject, or edit drive the approval loop.
  - MCP: `create_draft` tool added behind `BLOG_POST_KEY` (now lives in `convex/mcp.ts`, served at `/mcp` by Convex).
  - Remaining manual setup lives in `prds/finish-updating-guide.md`. Not built: the nightly OpenSync cron and the multi-tenant product (listed as Later).
