# Publish drafts from coding agents

Created: 2026-08-18 20:20 UTC
Last Updated: 2026-08-18 20:25 UTC
Status: Done

File a draft from Cursor, Claude Code, Codex, OpenCode, a terminal, Grok, or email. Nothing goes live until you approve it.

One person this is for: you, at the end of a session, saying "blog this" instead of copy-pasting into the dashboard.

## Before you start

You need:

- A signed-in dashboard on the **live** site: https://waynesutton.ai/dashboard
- Shell access to export an env var
- The repo clone so you can copy `blogskill/SKILL.md`

Localhost is the **dev** deployment (`notable-loris-927`). A key generated there will 401 against waynesutton.ai. Do steps 1 and 2 on prod.

## How it works

Agents never publish. They POST a draft. You approve it.

| Door | Auth | Use this |
|------|------|----------|
| `POST /api/v1/drafts` | `x-api-key: wsa_...` | Cursor, Claude Code, Codex, OpenCode, any terminal. Primary. |
| `POST /mcp` `create_draft` | Same `wsa_...` key in `x-api-key` | Optional. Nice if MCP is already connected. |
| Email the AgentMail inbox | Webhook secret + sender allowlist | Grok, ChatGPT, phone, anything that can send mail. Already working. |
| Dashboard paste box | Logged-in admin | Clipboard fallback. |
| X section | Logged-in admin | Paste an X URL. |

Two kinds of keys. Do not mix them.

- **Pipeline keys** (`wsa_...`): generated in Dashboard → API Keys. One per tool. Shown once. Stored hashed. Export as `BLOG_POST_KEY` **on your machine**.
- **Vendor keys** (`OPENAI_API_KEY`, `AGENTMAIL_*`, `GITHUB_*`): Convex env vars or dashboard overrides. They run the voice agent, email, and review PRs. Agents never see them.

Leave **Auto-publish** unchecked unless you really want that key to skip the inbox.

## Steps

### 1. Generate a pipeline key on prod

1. Open https://waynesutton.ai/dashboard
2. Sign in with GitHub
3. Open **API Keys**
4. Type a label naming the tool, for example `claude-code`
5. Leave **Auto-publish drafts from this key** unchecked
6. Click **Generate key**
7. Copy the `wsa_...` value immediately. It will not be shown again.

Generate one key per tool (`cursor`, `codex`, `opencode`). Drafts record which key submitted them. Revoking one tool does not break the others.

If you lose a key, revoke it and generate another.

### 2. Put the key in your shell

```bash
# Add to ~/.zshrc (or ~/.bashrc), then restart the terminal
export BLOG_POST_KEY=wsa_paste_the_key_here
```

Confirm it is set:

```bash
echo "${BLOG_POST_KEY:0:8}"
```

You should see `wsa_` plus four characters. Never commit this value. Never paste it into a PRD, chat, or screenshot.

### 3. Install the skill globally

`blogskill/SKILL.md` is a portable agent skill, not app code. Leaving it only in this repo means "blog this" only works while you are in this repo. Copy it out.

From the repo root:

```bash
mkdir -p ~/.claude/skills/blog-post
mkdir -p ~/.codex/skills/blog-post
mkdir -p ~/.cursor/skills-cursor/blog-post
mkdir -p ~/.opencode/skill/blog-post

cp blogskill/SKILL.md ~/.claude/skills/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.codex/skills/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.cursor/skills-cursor/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.opencode/skill/blog-post/SKILL.md
```

Restart the agent (new Claude Code / Cursor / Codex / OpenCode session) so it loads the skill.

### 4. Verify with curl

This is the check that matters. Do it before you ask an agent to post.

**Prod**

```bash
curl -X POST https://waynesutton.ai/api/v1/drafts \
  -H "Content-Type: application/json" \
  -H "x-api-key: $BLOG_POST_KEY" \
  -d '{
    "title": "Setup verification",
    "rawInput": "Checking that the pipeline key works from this machine.",
    "type": "session-summary",
    "mode": "as-is",
    "source": "curl"
  }'
```

A `201` with `{"draftId":"...","status":"inbox"}` means the key works.

Then open Dashboard → **Drafts Inbox** on prod. The row should be there. Delete it when you are done.

**Dev** (only if you generated the key on localhost)

```bash
curl -X POST https://notable-loris-927.convex.site/api/v1/drafts \
  -H "Content-Type: application/json" \
  -H "x-api-key: $BLOG_POST_KEY" \
  -d '{"title":"Dev verify","rawInput":"Dev key check.","mode":"as-is","source":"curl"}'
```

### 5. File a real draft from an agent

In any repo, after a session, say one of these:

- blog this
- blog to wsai
- send to wsai
- write to wsai
- post this to my blog
- write this up for the blog
- turn this session into a blog post
- turn this session into a blog post wsai
- draft a post about [what you shipped]
- wsai draft a post about [what you shipped]

The skill gathers what happened (files, decisions, what broke), POSTs to `/api/v1/drafts`, and reports the `draftId`. You still approve it.

For a finished article you already wrote, tell the agent to use `"mode": "as-is"`. For raw notes, use `"mode": "rewrite"` so the voice agent writes it in your voice.

### 6. Approve it

Pick one surface. All three write the same status field.

| Surface | How |
|---------|-----|
| Drafts Inbox | Open the draft. Publish, Publish unlisted, Save to draft, Edit, Rewrite, Reject, or Delete. |
| Email | After a rewrite, you get a preview at `AGENTMAIL_CONTACT_EMAIL` with subject `[draft <id>] title`. Reply with `publish`, `reject`, or `edit: <notes>` as the **first line**. |
| GitHub PR | Review PR on the draft, edit the markdown, merge. Needs `GITHUB_TOKEN`, `GITHUB_REVIEW_REPO`, `GITHUB_WEBHOOK_SECRET`. |

## Per tool

### Cursor

Skill path: `~/.cursor/skills-cursor/blog-post/SKILL.md`

Say "blog this" in the agent chat. Cursor reads `$BLOG_POST_KEY` from the environment of the terminal it spawned from. If the agent says the key is missing, restart Cursor after adding the export to `~/.zshrc`.

Optional MCP (HTTP transport):

```json
{
  "mcpServers": {
    "waynesutton-ai": {
      "url": "https://waynesutton.ai/mcp",
      "headers": {
        "x-api-key": "wsa_your_key_here"
      }
    }
  }
}
```

Read tools work without a key. `create_draft` fails without `x-api-key`.

### Claude Code

Skill path: `~/.claude/skills/blog-post/SKILL.md`

Same prompt. Same env var.

MCP via Claude Code settings, same JSON as above.

### Codex

Skill path: `~/.codex/skills/blog-post/SKILL.md`

Same prompt. Codex CLI inherits your shell env if you start it from that shell.

### OpenCode

Skill path: `~/.opencode/skill/blog-post/SKILL.md`

Same prompt. Confirm the OpenCode skill folder name on your machine if this path does not load.

### Grok and ChatGPT

No skill folder. Two doors:

1. **Email (easiest).** Copy the article. Send to `waynesuttonai@agentmail.to` from an allowed address. Subject `as-is: Your title` keeps the text. Any other subject runs rewrite.
   - **Photos take a different door.** An email with image attachments from an allowed sender goes to the `/photos` gallery, not the Drafts Inbox (`convex/photoEmails.ts`). Subject becomes the title, body the description, a `tags: a, b` line sets tags, inline images are ignored, up to 10 photos per email. They publish immediately unless **Auto publish emailed photos** is off in the dashboard Photos section. You get a reply with the `/photos/<slug>` links. Emails with no usable image still land as drafts. See `prds/photos-gallery.md`.
2. **curl.** Paste the article into the `rawInput` field of the verify command above, set `"mode": "as-is"` and `"source": "grok"` or `"chatgpt"`.

### Terminal with no agent

Use the curl in step 4. Change `rawInput`. That is the whole API.

## Optional MCP

The site serves JSON-RPC 2.0 at `POST https://waynesutton.ai/mcp`, rate limited at 50/min.

Read tools (`list_posts`, `get_post`, `list_pages`, `get_page`, `get_homepage`, `search_content`, `export_all`) are public unless Convex env `MCP_API_KEY` is set. If it is set, every call needs `Authorization: Bearer <MCP_API_KEY>`.

`create_draft` always needs a pipeline key:

- Send `x-api-key: wsa_...` (works whether `MCP_API_KEY` is set or not)
- Or, when `MCP_API_KEY` is **unset**, `Authorization: Bearer wsa_...`

Do not set a Convex env `BLOG_POST_KEY`. Writes use the client key, same as HTTP.

Verify MCP reads:

```bash
curl -X POST https://waynesutton.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Verify MCP write (should fail without a key, succeed with one):

```bash
curl -X POST https://waynesutton.ai/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: $BLOG_POST_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_draft","arguments":{"title":"MCP verify","rawInput":"MCP create_draft check.","mode":"as-is","source":"mcp"}}}'
```

## Voice profile

Empty rules produce generic rewrite copy. Fill this once.

1. Dashboard → Drafts Inbox → **Voice profile**
2. Paste `.agents/skills/write/SKILL.md` (banned words, banned openers, core principles at minimum)
3. Save
4. Click **Reindex voice context**

Reindex embeds published posts and pages. Click it again after you publish a batch. Needs `OPENAI_API_KEY` as a real Convex env var (`npx convex env set`), not only a dashboard override, until those actions are rewired.

## Convex environment variables

Set separately on **dev** and **prod**. Dashboard overrides in API Keys beat env for keys that resolve through `vendorKeys`. Webhook secrets and MCP gate always read `process.env`.

Set on prod:

```bash
npx convex env set --prod NAME value
```

Set on the linked dev deployment:

```bash
npx convex env set NAME value
```

### Required for publishing from agents

| Variable | Where | Purpose |
|----------|-------|---------|
| Pipeline key `wsa_...` | Your machine as `BLOG_POST_KEY` | HTTP and MCP `create_draft`. Not a Convex env var. |
| `OPENAI_API_KEY` | Convex env | Voice rewrite, embeddings, Ask AI |
| `SITE_URL` | Convex env | Canonical URLs (`https://waynesutton.ai` on prod) |

### Required for email door and approvals (already set on prod)

| Variable | Purpose |
|----------|---------|
| `AGENTMAIL_API_KEY` | Send mail |
| `AGENTMAIL_INBOX` | From-inbox id and the address people email |
| `AGENTMAIL_CONTACT_EMAIL` | Where previews, contact, and alerts land |
| `AGENTMAIL_WEBHOOK_SECRET` | Svix signature on inbound mail |
| `AGENTMAIL_ALLOWED_SENDERS` | Who may file drafts or run `publish` / `reject` / `edit`. Unset falls back to the contact address. |

### Optional

| Variable | Purpose |
|----------|---------|
| `MCP_API_KEY` | Gate **all** MCP calls, including reads. Leave unset for public discovery. |
| `ANTHROPIC_API_KEY` | Claude in AI chat |
| `GOOGLE_AI_API_KEY` | Gemini chat and images |
| `FIRECRAWL_API_KEY` | URL import |
| `GITHUB_TOKEN` | Review PRs (fine-grained PAT) |
| `GITHUB_REVIEW_REPO` | `owner/repo` |
| `GITHUB_WEBHOOK_SECRET` | PR merge publish |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X connect and posting |
| `X_BEARER_TOKEN` | Optional X read token |

Setting a value to the word `unset` means "intentionally not configured." Dev's email door uses that sentinel on `AGENTMAIL_WEBHOOK_SECRET`, so inbound mail on dev returns 503. Test email against prod.

### Deployments

| Environment | Deployment | HTTP actions |
|-------------|------------|--------------|
| Production | `helpful-ptarmigan-118` | https://waynesutton.ai and https://helpful-ptarmigan-118.convex.site |
| Development | `notable-loris-927` | https://notable-loris-927.convex.site |

Never deploy to `giant-grouse-674` or `agreeable-trout-200`.

## Payload

```json
{
  "type": "session-summary",
  "mode": "rewrite",
  "title": "optional working title",
  "rawInput": "notes, session summary, or full article",
  "source": "claude-code",
  "links": ["https://x.com/..."],
  "tags": ["convex", "agents"]
}
```

Required: `rawInput`. Defaults: `type` article, `mode` rewrite, `source` from the key label or `mcp`.

| Field | Values |
|-------|--------|
| type | `session-summary`, `link-commentary`, `article` |
| mode | `rewrite` (voice agent) or `as-is` (keep the text) |
| source | `claude-code`, `cursor`, `codex`, `chatgpt`, `grok`, `curl`, `mcp` |

Cap: 400k characters on `rawInput`. Links and tags capped at 10.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401` Missing or Invalid API key | Key generated on localhost, typo, or revoked | Generate on **prod** dashboard, re-export `BLOG_POST_KEY`, retry curl |
| `401` on prod after generating on localhost | Wrong deployment | Prod keys live in prod `apiKeys`. Localhost is dev. |
| Agent says `BLOG_POST_KEY` is missing | IDE did not inherit `~/.zshrc` | Restart the IDE from a shell that has the export, or set it in the IDE env UI |
| "blog this" does nothing | Skill only exists in this repo | Copy `blogskill/SKILL.md` to the global path and restart the agent |
| `429` | Rate limit (drafts 20/min, MCP 50/min) | Wait a minute, retry once |
| MCP `create_draft` missing key | No `x-api-key` header | Add the header. Server-side `BLOG_POST_KEY` is not used. |
| Rewrite sounds generic | `voiceProfile.rules` empty | Paste the write skill, save, reindex |
| Rewrite fails, `agent failed` | `OPENAI_API_KEY` missing as env | `npx convex env set --prod OPENAI_API_KEY sk-...` |
| Email does not create a draft | Sender not on allowlist, or self-sent | Send from `AGENTMAIL_CONTACT_EMAIL`. Check logs for `unauthorized-sender` or `self-sent`. |
| Email became photos instead of a draft | It had image attachments | Expected. Attachments route to `/photos`. Send text only, or paste images inline, for a draft. |
| Email preview never arrives | `AGENTMAIL_CONTACT_EMAIL` unset | Owner mail falls back to the inbox and you email yourself. Set the contact address. |
| Dashboard changes missing on live site | You used localhost | Open https://waynesutton.ai/dashboard |

## Related

- Dashboard → Docs → Publish from agents (same steps, copy as markdown)
- `blogskill/SKILL.md`
- `prds/agent-blog-pipeline-prd.md`
- `prds/email-setup-finish.md` (local, gitignored)

## Task completion log

- 2026-08-18 20:20 UTC: Guide drafted as the canonical setup for HTTP, skill install, MCP client keys, env tables, and troubleshooting.
- 2026-08-18 20:25 UTC: MCP \`create_draft\` verifies client \`x-api-key\` against hashed pipeline keys (no server \`BLOG_POST_KEY\`). Dashboard Docs rewritten with Copy markdown. API Keys panel shows export, curl, and MCP snippets after generate. Verified on dev: no key and bad key fail; tools/list still public.
