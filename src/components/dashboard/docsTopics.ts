export interface DocsTopicContent {
  id: string;
  title: string;
  content: string;
}

export const DOCS_TOPICS: Array<DocsTopicContent> = [
  {
    id: "overview",
    title: "Overview",
    content: `## How this app works

The dashboard is the admin surface for waynesutton.ai. Everything behind this login writes to the same Convex deployment that serves the public site. Saves are live for data. App code still needs a static deploy.

**Copy as markdown** lives on every docs page. Paste a topic into Cursor, Claude Code, or Codex when you want an agent to follow it.

These pages are written to skim: curl before clicks, a prompt you can paste, copy as markdown, skip to the article, and stable heading anchors.

### The loop

1. Content lands as a post, a page, or a **draft**
2. Drafts wait in the Drafts Inbox until you publish, save, reject, or delete them
3. Published posts show on the site, RSS, search, and agent discovery files
4. Agents can **read** the public site with no auth. Agents can **write drafts** only with a pipeline key

### Sections

| Section | What it does |
|---------|--------------|
| Overview | Greeting, stats, shortcuts |
| Posts and Pages | List, filter, edit, unlisted, open live URL |
| Write | New posts and pages, markdown, frontmatter, AI assistant |
| Import URL | Firecrawl a public URL into a draft post |
| Drafts Inbox | Review agent, email, paste, and X drafts. Voice profile. |
| AI Agent | Multi model chat and image generation |
| Newsletter | Subscribers, sends, signup stats |
| Media | Image library (Bunny CDN) |
| Analytics | Real time visitors and page views |
| X | Connect, compose, import a post as a draft |
| API Keys | Pipeline keys for agents. Vendor key status. |
| Agent Ready | Discovery files and widget |
| Site Config | Live siteConfig overrides |
| Index HTML | Critical HTML, theme FOUC script, meta |
| Sync Content | Run or copy markdown sync commands |
| Docs | This section |

### Dev and prod

You run two Convex deployments. Keys, drafts, and content do not cross them.

| | Dev | Prod |
|--|-----|------|
| Deployment | notable-loris-927 | helpful-ptarmigan-118 |
| Dashboard | localhost:5173/dashboard | https://waynesutton.ai/dashboard |
| HTTP actions | https://notable-loris-927.convex.site | https://waynesutton.ai |

A pipeline key generated on localhost will 401 against waynesutton.ai. Generate live keys on the live dashboard.

### Keyboard shortcuts

- Cmd+. toggles the sidebar
- Cmd+K opens site search
- Cmd+J opens Ask AI when enabled

### Start here if you want agents to post

Open **Publish from agents**. Generate a key, export it, copy the skill, then curl once. Full file: \`prds/setup-agent-blog.md\`.`,
  },
  {
    id: "publish",
    title: "Publish from agents",
    content: `## Publish from agents

File a draft from Cursor, Claude Code, Codex, OpenCode, a terminal, Grok, or email. Nothing goes live until you approve it.

Say this to an agent after you finish the steps below:

\`\`\`
blog this
\`\`\`

Other prompts that trigger the skill: "blog to wsai", "send to wsai", "write to wsai", "post this to my blog", "write this up for the blog", "turn this session into a blog post", "turn this session into a blog post wsai", "draft a post about [what shipped]", "wsai draft a post about [what shipped]".

### Before you start

- You are signed in on **https://waynesutton.ai/dashboard** (not localhost)
- You can edit \`~/.zshrc\`
- You have this repo cloned so you can copy \`blogskill/SKILL.md\`

Localhost is the **dev** deployment. Skip it for this setup.

### Step 1. Generate a pipeline key

1. Open **API Keys** in this dashboard
2. Type a label naming the tool, for example \`claude-code\`
3. Leave **Auto-publish drafts from this key** unchecked
4. Click **Generate key**
5. Copy the \`wsa_...\` value. It is shown once.

Generate one key per tool (\`cursor\`, \`codex\`, \`opencode\`). Revoking one does not break the others. If you lose a key, revoke it and generate another.

### Step 2. Export it on your machine

\`\`\`bash
# Add to ~/.zshrc, then open a new terminal
export BLOG_POST_KEY=wsa_paste_the_key_here
echo "\${BLOG_POST_KEY:0:8}"
\`\`\`

You should see \`wsa_\` plus four characters. Never commit this value.

### Step 3. Copy the skill out of this repo

Leaving \`blogskill/SKILL.md\` only in this repo means "blog this" only works here. Copy it globally.

\`\`\`bash
mkdir -p ~/.claude/skills/blog-post ~/.codex/skills/blog-post ~/.cursor/skills-cursor/blog-post ~/.opencode/skill/blog-post
cp blogskill/SKILL.md ~/.claude/skills/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.codex/skills/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.cursor/skills-cursor/blog-post/SKILL.md
cp blogskill/SKILL.md ~/.opencode/skill/blog-post/SKILL.md
\`\`\`

Restart Cursor, Claude Code, Codex, or OpenCode so the skill loads.

### Step 4. Verify with curl

Do this before you ask an agent to post.

\`\`\`bash
curl -X POST https://waynesutton.ai/api/v1/drafts \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $BLOG_POST_KEY" \\
  -d '{
    "title": "Setup verification",
    "rawInput": "Checking that the pipeline key works from this machine.",
    "type": "session-summary",
    "mode": "as-is",
    "source": "curl"
  }'
\`\`\`

A \`201\` with \`{"draftId":"...","status":"inbox"}\` means the key works. Open **Drafts Inbox**. Delete the row when you are done.

A \`401\` means the key is missing, generated on localhost, mistyped, or revoked.

### Step 5. File a real draft

In **any** repo, after a session, say "blog this". The skill POSTs notes to \`/api/v1/drafts\` and reports the \`draftId\`.

- Raw notes: ask for \`mode: rewrite\` so the voice agent writes in your voice
- Finished article: ask for \`mode: as-is\` so the text stays yours

### Step 6. Approve it

| Surface | What you do |
|---------|-------------|
| Drafts Inbox | Publish, Publish unlisted, Save to draft, Edit, Rewrite, Reject, Delete |
| Email | Reply to the preview with \`publish\`, \`reject\`, or \`edit: tighten the intro\` as the first line |
| GitHub PR | Review PR on the draft, merge to publish |

### Per tool

**Cursor.** Skill: \`~/.cursor/skills-cursor/blog-post/SKILL.md\`. Restart Cursor after the \`~/.zshrc\` export.

**Claude Code.** Skill: \`~/.claude/skills/blog-post/SKILL.md\`.

**Codex.** Skill: \`~/.codex/skills/blog-post/SKILL.md\`. Start Codex from a shell that has \`BLOG_POST_KEY\`.

**OpenCode.** Skill: \`~/.opencode/skill/blog-post/SKILL.md\`.

**Grok and ChatGPT.** No skill folder. Email the article to \`waynesuttonai@agentmail.to\` from an allowed address with subject \`as-is: Your title\`, or run the curl above with \`"source":"grok"\`.

**Terminal.** The curl in step 4 is the whole API. Change \`rawInput\`.

### Optional MCP

Reads at \`POST https://waynesutton.ai/mcp\` are public. \`create_draft\` needs the same \`wsa_\` key in \`x-api-key\`. Full JSON and curl: **MCP server**.

### Payload

Required field: \`rawInput\`. Defaults: type \`article\`, mode \`rewrite\`.

| Field | Values |
|-------|--------|
| type | session-summary, link-commentary, article |
| mode | rewrite (voice agent) or as-is (keep the text) |
| source | claude-code, cursor, codex, chatgpt, grok, curl, mcp |
| links | X URLs get post text via oEmbed |
| tags | Suggested tags, max 10 |

Cap: 400k characters on \`rawInput\`.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 | Generate the key on **prod**, re-export \`BLOG_POST_KEY\`, retry curl |
| Agent cannot see the key | Restart the IDE from a shell that has the export |
| "blog this" does nothing | Copy the skill globally and restart the agent |
| 429 | Wait a minute. Drafts are 20/min. |
| Rewrite sounds generic | Drafts Inbox, Voice profile. Paste write skill, then Reindex |
| Email ignored | Send from the allowlist address. Logs show \`unauthorized-sender\` or \`self-sent\`. |

Canonical file in the repo: \`prds/setup-agent-blog.md\`.`,
  },
  {
    id: "writing",
    title: "Writing and publishing",
    content: `## Writing and publishing

Two ways to publish: write in the dashboard, or write markdown files locally and sync. Agents file drafts instead. See **Publish from agents**.

### Posts and Pages lists

Filter tabs: All, Published, Drafts, Unlisted (with counts). Click a title to open the editor. Published rows (including unlisted) have an open-in-new-tab icon to the live URL. Drafts do not, because unpublished slugs 404 on the public site.

You can drag the dashboard sidebar items to reorder them. The editor frontmatter blocks also drag. Order is per browser.

### Dashboard editor

Write post and Write page give you a markdown editor with live preview and a frontmatter panel. Fill in the fields instead of hand writing YAML.

Required for posts: title, description, date, slug, published, tags. Pages need title, slug, and published.

Useful optional fields:

- **featured** and **featuredOrder** control the featured section
- **excerpt** shows in card view
- **image** sets the featured / header image. Upload or paste a URL. Clear removes it.
- **ogImage** sets a different share image. **noOgImage** drops the share image. Clear removes the OG URL.
- **unlisted** hides content from lists and search but keeps the URL working, with noindex for crawlers
- **aiWritten** (posts only) shows a small note under the title that the post was written with AI and proofed by a human. Overrules the Drafts Inbox default.
- **authorName** and **authorImage** override the byline. Author image has Upload and Clear, same as the other image fields.
- **contactForm** embeds the contact form

### Local files and sync

Markdown lives in \`content/blog/\` and \`content/pages/\`. Sync commands push to Convex. No build step for markdown.

\`\`\`bash
npm run sync                # markdown to dev
npm run sync:prod           # markdown to prod
npm run sync:discovery      # AGENTS.md, CLAUDE.md, llms.txt to dev
npm run sync:discovery:prod
npm run sync:all            # content + discovery, dev
npm run sync:all:prod
npm run export:db           # pull dashboard-written content back to files
npm run export:db:prod
npm run import <url>        # Firecrawl import (needs FIRECRAWL_API_KEY)
\`\`\`

Static assets (the React app) are a separate step. You only need this when app code changes, never for markdown:

\`\`\`bash
npm run deploy:dev   # build and upload to the dev deployment
npx convex deploy --yes && npx @convex-dev/self-hosting deploy --skip-convex
\`\`\`

\`npm run deploy\` prompts interactively and fails in an agent shell. Run the two commands above for prod.

### Version history

The editor keeps versions as you save. Open version history from the editor toolbar to restore an earlier state.

### Unlisted vs draft vs published

| State | URL works | In /blog, search, RSS, sitemap |
|-------|-----------|--------------------------------|
| Draft (published false) | No | No |
| Published unlisted | Yes, noindex | No |
| Published | Yes | Yes |

### Import URL

Dashboard **Import URL** takes a public page. Firecrawl scrapes it to markdown and creates a post. Needs \`FIRECRAWL_API_KEY\`. From a terminal:

\`\`\`bash
npm run import https://example.com/article
\`\`\`

Imported posts land unpublished so you can edit before they go live.

### Demo mode

\`/dashboard\` without GitHub shows a 30 minute demo. Writes are gated. Sign in for the real sections.`,
  },
  {
    id: "agents",
    title: "Drafts Inbox",
    content: `## Drafts Inbox

Agents submit drafts. You review. Then you publish. Five doors feed the same inbox.

| Door | Auth | Notes |
|------|------|-------|
| HTTP \`POST /api/v1/drafts\` | \`x-api-key: wsa_...\` | Primary. Cursor, Claude Code, Codex, curl. |
| MCP \`create_draft\` | Same \`wsa_\` key in \`x-api-key\` | Optional. Reads stay public. |
| Email | Webhook secret + sender allowlist | Grok, ChatGPT, phone. Already working. |
| Paste box | Logged-in admin | Clipboard. |
| X import | Logged-in admin | Paste an X URL in the X section. |

Setup for HTTP and the skill: **Publish from agents**.

\`\`\`bash
curl -X POST https://waynesutton.ai/api/v1/drafts \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $BLOG_POST_KEY" \\
  -d '{"type":"article","mode":"as-is","title":"test","rawInput":"hello","source":"curl"}'
\`\`\`

A 201 returns \`{ "draftId": "...", "status": "inbox" }\`. A 401 means the key is missing, generated on the wrong deployment, or revoked.

### Inbox controls

Tabs: Inbox, Saved, Published, Rejected, All. Desktop shows the list on the left and the selected draft on the right. Under 900px you get a Back to list button.

| Control | What it does |
|---------|--------------|
| Publish | Creates the post live and listed |
| Publish unlisted | Live at its slug, hidden from homepage, /blog, search, RSS, sitemap, VFS, served noindex |
| Save to draft | Creates the post unpublished so you can finish it in the editor |
| Edit | Title and body in a textarea, saves without publishing |
| Rewrite | Reruns the voice agent, optionally with notes |
| Reject | Marks rejected, stays in the list |
| Delete | Hard remove after inline confirm. Hidden while the agent runs. |
| Review PR | Opens a GitHub pull request |
| Paste box | Creates a draft from pasted text, with an as-is checkbox |
| Written with AI | Inbox default. When on, new posts created from this inbox get a note under the title. Frontmatter \`aiWritten\` on the post overrules this. |

Once a draft becomes a post, the row links to it. Saving then publishing flips the same post. No duplicates. After that, content edits belong in the post editor.

**agent pending** / **agent running** means the voice agent is working. **agent failed** prints the reason, usually a missing \`OPENAI_API_KEY\`.

### Voice profile and reindex

**Voice profile** stores writing rules server side. Empty rules produce generic rewrite copy. Paste \`.agents/skills/write/SKILL.md\` (banned words, banned openers, core principles). Save.

**Reindex voice context** embeds published posts and pages. The agent pulls the three closest matches into each rewrite. Click it after setup and again after a batch of publishes. Needs \`OPENAI_API_KEY\` as a Convex env var.

### Approving from email

Set \`AGENTMAIL_CONTACT_EMAIL\`. Each finished rewrite emails a preview with the draft id in the subject, like \`[draft abc123] post title\`. Reply with one of these as the **first line**:

- \`publish\`
- \`reject\`
- \`edit: tighten the intro\`

Quoted replies and signatures are stripped. Mail sent from the inbox itself is ignored, so app notifications cannot become drafts.

Keep draft ids out of public repos. A draft id plus a spoofed From can hit the command branch.

### GitHub review PRs

Needs \`GITHUB_TOKEN\` (fine-grained PAT), \`GITHUB_REVIEW_REPO\` (\`owner/repo\`), and \`GITHUB_WEBHOOK_SECRET\`.

Review PR on a draft, edit the markdown on the branch, merge. The webhook publishes the merged file. Closed without merge marks the draft rejected.`,
  },
  {
    id: "mcp",
    title: "MCP server",
    content: `## MCP server

JSON-RPC 2.0 over HTTP at \`POST https://waynesutton.ai/mcp\`. Rate limited at 50 requests per minute.

Read tools are public unless Convex env \`MCP_API_KEY\` is set. \`create_draft\` always needs a pipeline key (\`wsa_...\`) from Dashboard, API Keys. It does **not** use a server-side \`BLOG_POST_KEY\`.

### Tools

| Tool | Auth | What it does |
|------|------|--------------|
| list_posts | public | Published post metadata |
| get_post | public | One post by slug, full content |
| list_pages | public | Published page metadata |
| get_page | public | One page by slug, full content |
| get_homepage | public | Recent posts and counts |
| search_content | public | Title, description, tag search |
| export_all | public | All posts with content |
| create_draft | pipeline key | Submit a review draft |

If \`MCP_API_KEY\` is set, every call (including the public reads) needs \`Authorization: Bearer <MCP_API_KEY>\`. Leave it unset for open discovery.

### Connect a client

Cursor, Claude Code, Codex, or any HTTP MCP client:

\`\`\`json
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
\`\`\`

Read tools work without the header. \`create_draft\` fails without it.

If you also set \`MCP_API_KEY\`, send that as \`Authorization: Bearer\` **and** keep \`x-api-key\` for writes.

### Verify reads

\`\`\`bash
curl -X POST https://waynesutton.ai/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
\`\`\`

You should see eight tools.

### Verify create_draft

Without a key this should error. With \`$BLOG_POST_KEY\` it should return a \`draftId\`.

\`\`\`bash
curl -X POST https://waynesutton.ai/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $BLOG_POST_KEY" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_draft","arguments":{"title":"MCP verify","rawInput":"MCP create_draft check.","mode":"as-is","source":"mcp"}}}'
\`\`\`

Prefer **Publish from agents** (HTTP + skill) as the daily path. MCP is optional.`,
  },
  {
    id: "api-keys",
    title: "API keys",
    content: `## API keys

Two kinds of keys. Do not mix them.

### Pipeline keys

These authenticate agents that submit drafts. Generate them in this API Keys section.

- Label the tool (\`claude-code\`, \`cursor\`, \`codex\`)
- Plaintext starts with \`wsa_\` and is shown **once**
- Only a SHA-256 hash is stored
- Export on your machine as \`BLOG_POST_KEY\`
- Send as \`x-api-key\` on \`POST /api/v1/drafts\` and MCP \`create_draft\`
- Revoke any time

After generate, the panel shows copy-ready export, curl, and MCP snippets.

Leave auto-publish off unless you want that key to skip the inbox.

Full setup: **Publish from agents**.

### Vendor keys

Vendor keys run OpenAI, AgentMail, GitHub, X, and the rest. Two sources, checked in order:

1. **Dashboard overrides** in this section. Stored in this deployment's database. Dev and prod each keep their own.
2. **Convex environment variables**

The grid shows Override, Env var, or Not set. Values are never shown back.

\`\`\`bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
npx convex env set --prod ANTHROPIC_API_KEY sk-ant-...
\`\`\`

Setting a value to the word \`unset\` marks it as intentionally not configured.

| Key | Used for |
|-----|----------|
| OPENAI_API_KEY | Voice agent, embeddings, Ask AI |
| ANTHROPIC_API_KEY | Claude models |
| GOOGLE_AI_API_KEY | Gemini chat and images |
| CONCENTRATE_API_KEY | Concentrate gateway |
| OPENROUTER_API_KEY | OpenRouter gateway |
| RUNWARE_API_KEY | Runware images |
| FIRECRAWL_API_KEY | URL import |
| AGENTMAIL_API_KEY | Newsletter, contact, draft emails |
| AGENTMAIL_INBOX | From-inbox id |
| AGENTMAIL_CONTACT_EMAIL | Where owner mail is delivered |
| AGENTMAIL_WEBHOOK_SECRET | Email door signature |
| AGENTMAIL_ALLOWED_SENDERS | Who may email drafts and commands |
| GITHUB_TOKEN | Review PRs |
| GITHUB_REVIEW_REPO | owner/repo |
| GITHUB_WEBHOOK_SECRET | PR merge publish |
| X_CLIENT_ID / X_CLIENT_SECRET | X OAuth |
| X_BEARER_TOKEN | Optional X read |
| EXA_API_KEY | Research (optional) |

Webhook secrets and the optional \`MCP_API_KEY\` always read Convex env, not dashboard overrides.

Voice agent, embeddings, Ask AI, newsletter, and contact still read \`process.env\` for some keys. A green check from an override can be misleading for those. Keep \`OPENAI_API_KEY\` set with \`npx convex env set\` until that is rewired.`,
  },
  {
    id: "newsletter",
    title: "Newsletter and AgentMail",
    content: `## Newsletter and AgentMail

Email runs through AgentMail. Five variables control it. Set them as Convex env vars or dashboard overrides.

| Variable | Purpose | Needed for |
|----------|---------|------------|
| AGENTMAIL_API_KEY | API access for sending | All email |
| AGENTMAIL_INBOX | From-inbox id, also the address people email | All email |
| AGENTMAIL_CONTACT_EMAIL | Where owner-facing mail is delivered | Contact, alerts, draft previews, email approvals |
| AGENTMAIL_WEBHOOK_SECRET | Svix signing secret | Email door and email approvals |
| AGENTMAIL_ALLOWED_SENDERS | Who may submit drafts by email | Email door and email approvals |

### Set AGENTMAIL_CONTACT_EMAIL or owner mail goes nowhere

Without it, the code falls back to the inbox, so the app emails itself. Those messages sit in the AgentMail console as **sent** and never reach a real mailbox. Contact submissions, subscriber alerts, weekly stats, and draft previews are all affected.

It also disables the email approval loop. The loop needs the preview in a real mailbox so your reply comes back as inbound mail.

### Who is allowed to email the door

The inbox address is public. A webhook signature only proves AgentMail delivered the message, not that you sent it. The door checks the sender before it files a draft or runs publish / reject / edit.

| AGENTMAIL_ALLOWED_SENDERS | Behavior |
|---------------------------|----------|
| Set | Only those addresses |
| Unset | Falls back to AGENTMAIL_CONTACT_EMAIL |
| Both unset | The door refuses everything |

Separate entries with commas, semicolons, or newlines. An entry starting with @ matches a whole domain. Refused mail returns 200 with \`{"skipped":"unauthorized-sender"}\`, since a 4xx would make AgentMail retry.

Plus addresses are not implied. \`you+blog@example.com\` needs its own entry or a domain entry. From headers can be forged, which is why draft ids stay private.

### Setup

1. Create an AgentMail account and an inbox
2. Copy the API key and inbox id
3. Set all five values on **both** dev and prod
4. Turn on \`newsletter.enabled\` in siteConfig and pick signup placements
5. Point the AgentMail webhook at \`https://waynesutton.ai/api/hooks/agentmail\` (prod) subscribed to \`message.received\` and \`message.received.unauthenticated\`

Dev's \`AGENTMAIL_WEBHOOK_SECRET\` is the sentinel \`unset\`, so the email door on dev returns 503. Test inbound mail against prod.

### How sends work

The Newsletter section lists subscribers and past sends. Compose from a published post or custom content. You can send to all subscribers or pick a subset. Targeted post sends do not mark the post as sent.

Sends include unsubscribe links per subscriber.

### Contact form

Pages and posts can embed a contact form with frontmatter \`contactForm: true\`. Submissions send to \`AGENTMAIL_CONTACT_EMAIL\`.

### Reading the AgentMail console

**sent** means the app sent it. It will never create a draft. **received** is inbound. **unauthenticated** is also inbound: Gmail often lands with that label. The door accepts both. Spam and blocked stay out.

The webhook only fires for mail that arrives after it was created. Use inbox backfill for older messages.`,
  },
  {
    id: "ai-features",
    title: "AI features",
    content: `## AI features

### AI chat

The AI Agent section and the Write page assistant support several models.

| Model | Provider | Key |
|-------|----------|-----|
| Claude Sonnet 4 | Anthropic | ANTHROPIC_API_KEY |
| GPT-4.1 mini | OpenAI | OPENAI_API_KEY |
| Gemini 2.0 Flash | Google | GOOGLE_AI_API_KEY |
| Concentrate Auto | Concentrate gateway | CONCENTRATE_API_KEY |
| OpenRouter Auto | OpenRouter gateway | OPENROUTER_API_KEY |

Gateway options route each request. Chat supports image attachments and link attachments. Links get scraped through Firecrawl when \`FIRECRAWL_API_KEY\` is set.

### Image generation

The image tab stores results in Convex storage.

| Model | Provider | Key |
|-------|----------|-----|
| Nano Banana | Google | GOOGLE_AI_API_KEY |
| Nano Banana Pro | Google | GOOGLE_AI_API_KEY |
| Runware Flux | Runware | RUNWARE_API_KEY |

Aspect ratio options apply to all models.

### Ask AI and semantic search

Ask AI (Cmd+J) answers visitor questions from site content using OpenAI embeddings. Needs \`semanticSearch.enabled: true\` and \`askAI.enabled: true\` in siteConfig plus \`OPENAI_API_KEY\`. Answers stream from \`/ask-ai-stream\` with per-user rate limits.

### Voice agent

Drafts with mode rewrite run through a voice agent on the Convex agent component. It uses GPT-4.1 mini plus retrieval over your published posts. Fill the voice profile first. See **Drafts Inbox**.`,
  },
  {
    id: "agent-ready",
    title: "Agent ready discovery",
    content: `## Agent ready discovery

Discovery files tell AI agents what this site is and how to **read** it. They do not advertise the write API. Draft submit stays behind this login and \`prds/setup-agent-blog.md\`.

### Routes

| Route | Content |
|-------|---------|
| /llms.txt | Short site description with page and endpoint lists |
| /llms-full.txt | Expanded version |
| /agents.md | Agent instructions, opens inline in browsers |

Agents can also:

\`\`\`bash
curl https://waynesutton.ai/api/export
curl https://waynesutton.ai/vfs/tree
curl -X POST https://waynesutton.ai/vfs/exec -H "Content-Type: application/json" -d '{"command":"ls /wiki"}'
curl https://waynesutton.ai/rss-full.xml
\`\`\`

No auth on those reads. Rate limited.

### Configuration

\`agent-ready.config.json\` in the repo root holds the app name, site URL, description, agent instructions, page list, and API endpoint list. It is gitignored because it can differ per deployment.

\`\`\`bash
npx agent-ready sync         # dev
npx agent-ready sync --prod  # prod
\`\`\`

### Auto sync on publish

The Agent Ready section has a Publishing toggle. When on, making a post public updates \`/llms.txt\` and \`/agents.md\` without a local sync command. Unpublish, unlist, rename, or delete archives the old path first.

### Widget

The floating widget on the public site shows human, machine, and score tabs. Controls live in this Agent Ready section and in \`src/App.tsx\`.`,
  },
  {
    id: "x-integration",
    title: "X (Twitter)",
    content: `## X integration

Connect your X account to share posts and turn X posts into blog drafts.

### Setup

1. Create an app at developer.x.com with OAuth 2.0 enabled (confidential client, type Web App)
2. Set the callback URL to \`https://helpful-ptarmigan-118.convex.site/x/callback\` for prod and the dev \`.convex.site\` URL for dev. Both deployments need their own callback entry
3. In API Keys, set \`X_CLIENT_ID\` and \`X_CLIENT_SECRET\` (optional \`X_BEARER_TOKEN\`)
4. Open the X section and click Connect

Tokens are stored per deployment and refresh automatically. Disconnect any time from the X section.

### Posting

- Compose in the X section with a live character counter
- In Write Post, turn on Share on X after publishing. The tweet contains the title and canonical URL. A share failure never blocks the publish
- Recent shares list in the X section

### Import an X post as a draft

Paste an X post URL (x.com or twitter.com status link). The pipeline reads the post, expands it into a markdown draft, and drops it in the Drafts Inbox with source x-import.

Import needs one AI provider key plus X read access.`,
  },
  {
    id: "themes",
    title: "Themes and appearance",
    content: `## Themes and appearance

Four themes ship with the site: dark, light, tan, and cloud. Visitors cycle them with the theme toggle. The choice persists in localStorage.

### Defaults

\`defaultTheme\` in siteConfig sets what new visitors see. \`fontFamily\` picks serif, sans, or monospace for body text. Both have controls in Config.

### How theming works

Every theme is a block of CSS variables on \`html[data-theme]\` in \`src/styles/global.css\`. Colors, borders, code blocks, and surfaces all read from variables. The dashboard uses the same variables.

### Font size

The dashboard font size control scales the base font size for your admin session. It is stored locally per browser and does not affect visitors.

### The critical path

\`index.html\` inlines a small copy of the theme variables and a script that reads localStorage before first paint so there is no theme flash. If you change theme colors in global.css, update the inline copy in index.html to match.`,
  },
  {
    id: "config",
    title: "Site Config",
    content: `## Site Config

Live overrides for \`src/config/siteConfig.ts\`. Save writes to Convex for this deployment. The public site reads overrides before first paint (3 second cap) and merges them onto the file.

Copy Code and Download still exist so you can commit the generated file as the build-time default.

Logo gallery images, social footer links, and custom nav items stay file-managed. Change those in \`siteConfig.ts\` and deploy static assets.

### What the cards cover

| Card | What it changes |
|------|-----------------|
| Site | Name, title, URL, default theme, font |
| Blog Page | Enable /blog, nav label, default view mode, show view toggle icons |
| Homepage | Display posts on homepage, featured view |
| Dashboard | Show dashboard in the public nav |
| Newsletter | Enable newsletter and signup placements |
| Ask AI / search | semanticSearch and askAI flags |
| Stats | Enable the public /stats page |
| Media | Enable the media library |
| Related posts | Default view and toggle on post pages |
| Agent Ready | Discovery widget defaults that also live in Agent Ready |

If you hide the view toggle icons, a visitor's saved list/cards preference is ignored so the configured default always wins.

### Index HTML

Theme colors must match in two places: \`src/styles/global.css\` and the inline block in \`index.html\` (stops a flash of the wrong theme). The Index HTML section generates that critical head. After you change theme tokens, update both, then deploy static assets.

### Save vs deploy

Config Save is live for data. Changing React or CSS still needs a static deploy. See **Deploying**.`,
  },
  {
    id: "site-ops",
    title: "Media, analytics, sync",
    content: `## Media, analytics, and sync

The remaining dashboard sections that keep the site running.

### Media

Upload PNG, JPG, GIF, or WebP (10MB cap). Files go through ConvexFS to Bunny.net CDN. Needs \`BUNNY_API_KEY\`, \`BUNNY_STORAGE_ZONE\`, and \`BUNNY_CDN_HOSTNAME\` in Convex env, plus \`media.enabled\` in Config.

Use the URL in frontmatter \`image\` or \`ogImage\`. The editor Upload buttons open the same library.

### Analytics

Dashboard **Analytics** is the admin view of the same data as the public \`/stats\` page (when \`statsPage.enabled\` is on).

Visitors send a heartbeat about every 45 seconds. Page views are event rows, not a counter on the post, so concurrent readers do not collide. Cross-tab BroadcastChannel keeps one tab as the heartbeat leader.

Turn stats off in Config if you do not want tracking.

### Sync Content

Markdown in \`content/blog/\` and \`content/pages/\` is the file source of truth. Dashboard edits live in Convex. Sync pushes files into Convex. Export pulls Convex back to files.

The Sync section copies or runs:

\`\`\`bash
npm run sync
npm run sync:prod
npm run sync:discovery
npm run sync:discovery:prod
npm run sync:all
npm run sync:all:prod
npm run export:db
npm run export:db:prod
\`\`\`

Execute buttons need \`npm run sync-server\` in a local terminal. On a laptop without that process, copy the command and run it yourself.

Dashboard-created posts have \`source: "dashboard"\` so a file sync will not overwrite them.

### Index HTML

Generator for the document head: theme FOUC script, meta, manifest, apple-mobile-web-app tags. Pair it with **Site Config** when you change default theme colors.`,
  },
  {
    id: "deploying",
    title: "Deploying",
    content: `## Deploying

### Development

\`\`\`bash
npx convex dev   # Convex watcher, deploys functions to dev on save
npm run dev      # Vite at localhost:5173
\`\`\`

Use these for all development. The dev deployment is isolated from prod.

\`\`\`bash
npm run deploy:dev   # build + upload static assets to dev
\`\`\`

### Production

\`\`\`bash
npm run sync:all:prod
npx convex deploy --yes
npx @convex-dev/self-hosting deploy --skip-convex
\`\`\`

Run those in that order when shipping a release. \`npm run deploy\` bundles an interactive Convex prompt and dies in a non-interactive shell.

For content only, \`npm run sync:prod\` is enough.

### Verify

\`\`\`bash
npm run validate:env
npm run validate:env:prod
npm run verify:deploy
npm run verify:deploy:prod
npx tsc --noEmit
npx convex-doctor@latest
\`\`\`

A frontend fix is not done until the **deployed** bundle has it. After a static upload, curl the live JS/CSS. Blank page with correct HTML usually means a missing lazy chunk or a cached 404.

### Deployments

Production is helpful-ptarmigan-118 behind waynesutton.ai. Development is notable-loris-927. Never deploy to giant-grouse-674 or agreeable-trout-200.`,
  },
];
