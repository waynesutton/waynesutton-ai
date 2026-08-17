---
name: blog-post
description: Submit a blog draft to waynesutton.ai. Use when the user says "blog this", "post this to my blog", "write this up for the blog", or asks to turn a coding session, notes, or a link into a blog post. Drafts go to a review inbox and are never published without approval.
---

# Blog post skill for waynesutton.ai

Turn the current session, notes, or a shared link into a blog draft on waynesutton.ai. Every draft lands in a review inbox. Nothing publishes without Wayne approving it.

## Trigger phrases

- "blog this"
- "post this to my blog"
- "write this up for the blog"
- "turn this session into a blog post"
- "draft a post about ..."

## Requirements

The environment variable `BLOG_POST_KEY` must be set. It holds a pipeline API key generated in the waynesutton.ai dashboard under API Keys. If it is missing, tell the user to generate a key in the dashboard and export it:

```bash
export BLOG_POST_KEY=wsa_xxxxxxxx
```

## How to submit a draft

POST to the drafts endpoint with the key in the `x-api-key` header:

```bash
curl -X POST https://waynesutton.ai/api/v1/drafts \
  -H "Content-Type: application/json" \
  -H "x-api-key: $BLOG_POST_KEY" \
  -d '{
    "title": "Optional working title",
    "rawInput": "The draft content goes here",
    "type": "session-summary",
    "mode": "rewrite",
    "source": "claude-code",
    "links": ["https://x.com/example/status/123"],
    "tags": ["convex", "ai"]
  }'
```

A `201` response returns `{ "draftId": "...", "status": "inbox" }`.

## Payload fields

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| rawInput | yes | string | Notes, session summary, or full article text |
| title | no | string | Working title hint |
| type | no | session-summary, link-commentary, article | Default article |
| mode | no | rewrite, as-is | rewrite runs the voice agent; as-is keeps text unchanged |
| source | no | string | Name your tool: claude-code, cursor, codex, chatgpt, grok |
| links | no | array of strings | X links get their post text pulled in via oEmbed |
| tags | no | array of strings | Suggested tags |

## Writing the rawInput

For a session summary, cover:

1. What was built or fixed and why it mattered
2. The interesting decisions and tradeoffs
3. Code snippets worth showing (short, real ones)
4. What broke and how it got fixed
5. What comes next

Write plainly. Skip filler. Do not oversell. The voice agent rewrites drafts in Wayne's voice when mode is rewrite, so focus on getting the facts and the story right, not the polish.

For link commentary, include the link in `links`, set `type` to `link-commentary`, and put your take or the user's take in `rawInput`.

## Rules

- Never publish directly. The endpoint only creates review drafts.
- One draft per request. Do not batch.
- If the request fails with 401, the key is wrong or revoked; tell the user.
- If it fails with 429, wait a minute and retry once.
