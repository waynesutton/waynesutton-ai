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

The dashboard is the admin surface for {{PUBLIC_HOST}}. Everything behind this login writes to the same Convex deployment that serves the public site. Saves are live for data. App code still needs a static deploy through Convex self-hosting.

**Copy as markdown** lives on every docs page. Paste a topic into Cursor, Claude Code, or Codex when you want an agent to follow it.

These pages are written to skim: curl before clicks, a prompt you can paste, copy as markdown, skip to the article, and stable heading anchors.

### The loop

1. Content lands as a post, a page, or a **draft**
2. Drafts wait in the Drafts Inbox until you publish, save, reject, or delete them
3. Published posts show on the site, RSS, search, and agent discovery files
4. Agents can **read** the public site with no auth. Agents can **write drafts** only with a pipeline key. A Chrome agent already in the tab can call **in-page tools** (search, open a post, subscribe) through WebMCP, with you watching

### Sections

| Section | What it does |
|---------|--------------|
| Overview | Greeting, stats, shortcuts |
| Posts and Pages | List, filter, edit, unlisted, open live URL |
| Write | New posts and pages, markdown, frontmatter, AI assistant |
| Homepage | Banner image, featured list, spotlight post and projects, category sections, post list, with a live running order |
| Projects | CRUD for the /projects index |
| Skills | Sections and skills for the /skills directory |
| Photos | Upload, tag, and publish photos for the /photos gallery. Email inbox. |
| Import URL | Scrape a public URL into a draft post (Firecrawl, Exa, or Context.dev) |
| Drafts Inbox | Review agent, email, paste, and X drafts. Voice profile. |
| AI Agent | Multi model chat and image generation |
| Newsletter | Subscribers, sends, signup stats |
| Media | Image library (Cloudflare R2, optional Bunny) |
| Analytics | Real time visitors and page views |
| X | Connect, compose, import a post as a draft |
| API Keys | Pipeline keys for agents. Vendor key status. |
| Agent Ready | Discovery files and widget |
| Site Config | Live siteConfig overrides |
| Index HTML | Critical HTML, theme FOUC script, meta |
| Sync Content | Run or copy markdown sync commands |
| Docs | This section, including WebMCP |

### Dev and prod

You run two Convex deployments. Keys, drafts, and content do not cross them. The names below come from \`.env.local\` (dev) and \`.env.production.local\` (prod), so a fork fills this table from its own Convex project.

| | Dev | Prod |
|--|-----|------|
| Deployment | {{DEV_NAME}} | {{PROD_NAME}} |
| Cloud | {{DEV_CLOUD}} | {{PROD_CLOUD}} |
| Dashboard | {{DEV_DASHBOARD}} | {{PROD_PUBLIC}} |
| HTTP actions | {{DEV_SITE}} | {{PROD_HTTP}} |

A pipeline key generated on localhost will 401 against {{PUBLIC_HOST}}. Generate live keys on the live dashboard.

If a prod cell says \`not set\`, create \`.env.production.local\` with \`VITE_CONVEX_URL\` (and usually \`VITE_SITE_URL\`) after you run \`npx convex deploy\` for the first time.

{{REPO_DEPLOY_NOTE}}

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

- You are signed in on **{{PUBLIC_URL}}/dashboard** (not localhost)
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
curl -X POST {{PUBLIC_URL}}/api/v1/drafts \\
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

Reads at \`POST {{PUBLIC_URL}}/mcp\` are public. \`create_draft\` needs the same \`wsa_\` key in \`x-api-key\`. Full JSON and curl: **MCP server**.

WebMCP (the in-page tools a Chrome agent sees on the live site) does not submit drafts. Publishing always goes through this HTTP door or MCP. See **WebMCP in the browser**.

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
- **minimap** (posts only) adds a right-side heading outline on the public post that follows scroll and highlights the current section. Reads h1 through h6 from the markdown, so a post with no headings shows nothing. The rail sits in the right margin so the article stays centered. It hides below 1135px and the headings move into the mobile menu. When both **minimap** and **rightSidebar** are on, the minimap shows and the AI chat does not. This is separate from the Minimap button in the Frontmatter panel toolbar, which is an editor-only outline of the panel sections.
- **hideNav** (posts only) lets the top nav start at the top of the post and scroll away with the page instead of staying pinned.
- **slides** turns the post or page into a deck. There is no dashboard switch yet. Put \`slides: true\` in the markdown file (see **Markdown slides** below).
- **authorName** and **authorImage** override the byline. Author image has Upload and Clear, same as the other image fields.
- **contactForm** puts the form at the bottom of that post or page. Or drop \`<!-- contactform -->\` in the body. The Site Config switch must be on. See **Contact form** below.

### Markdown slides

Set \`slides: true\` in frontmatter on a post or page, then split the body on standalone \`---\` lines (a normal markdown horizontal rule). Each block between those lines is one slide. Rules inside fenced code blocks do not split.

\`\`\`markdown
---
title: "Talk title"
slug: "talk-title"
description: "A short deck"
date: "2026-09-06"
published: true
tags: ["talk"]
slides: true
---

# Title slide

One idea per slide.

---

## Second slide

Lists, tables, images, and code all render.

---

## Last slide

Questions.
\`\`\`

The article still reads as a normal post. When \`slides\` is on, a **Present** button shows in the header. Click it for a fullscreen overlay.

| Key | What it does |
|-----|----------------|
| Right arrow, Space, click next | Next slide |
| Left arrow, click prev | Previous slide |
| Home / End | First / last slide |
| Escape | Exit |

Write the file under \`content/blog/\` or \`content/pages/\`, then:

\`\`\`bash
npm run sync          # this deployment (usually dev)
npm run sync:prod     # production Convex (\`.env.production.local\`)
\`\`\`

Working demo in the repo: \`content/blog/slide-template-example.md\`. Dashboard Write does not persist \`slides\` yet, so keep the flag in the markdown file.

### Contact form

Site Config > Audience > Contact Form is the global switch. Turn **Enable contact form** on and Save. That does not place a form on any page.

Then add it to a post or page.

Inline, where you want it in the body:

\`\`\`
<!-- contactform -->
\`\`\`

At the bottom of that post or page, set frontmatter:

\`\`\`
contactForm: true
\`\`\`

In the dashboard editor that is the Contact Form checkbox on the post or page, not the Site Config card.

If both are present, the shortcode wins and you get one form.

Submissions send to \`AGENTMAIL_CONTACT_EMAIL\` (falls back to \`AGENTMAIL_INBOX\`). You also need \`AGENTMAIL_API_KEY\`. Set them in API Keys or Convex env. See **Newsletter and AgentMail**.

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
npm run import <url>        # URL import (any web research key)
\`\`\`

Static assets (the React app) are a separate step. You only need this when app code changes, never for markdown. This site uses Convex static self-hosting, not Netlify. There is no \`npm run deploy --prod\` script. See **Deploying** for \`npm run deploy:dev\`, \`npm run deploy:static\`, and when to pass \`--prod\`.

### Frontmatter panel

The panel to the right of the editor groups fields into Essentials, Visibility, Taxonomy, Media, Author, and Advanced. Collapsed groups list the YAML keys inside so nothing is hidden without a trace.

- The readout at the top says **Required fields set** or **Missing: Title, Date**. Save stays enabled but the site will reject a post without them.
- The map icon toggles the **section outline**: one chip per group with a filled count. A dot in the accent color means a required field inside is empty. Click a chip to open that group and scroll to it.
- The arrows icon expands or collapses every group at once.
- Groups and the fields inside them drag to reorder. Grab the six-dot handle that appears on hover. Order and open state are saved per browser, per content type.
- Drag the divider between the editor and the panel to resize it. The width is shared between Write and Edit.
- Toggle the panel with the sidebar button in its header, or hide both sidebars with focus mode.

### Embeds

The **Embed** toolbar button takes an X post or YouTube link and inserts an iframe at the cursor. Full guide, including what the sanitizer allows: **Embed X posts and video**.

### Version history

The editor keeps versions as you save. Open version history from the editor toolbar to restore an earlier state.

### Unlisted vs draft vs published

| State | URL works | In /blog, search, RSS, sitemap |
|-------|-----------|--------------------------------|
| Draft (published false) | No | No |
| Published unlisted | Yes, noindex | No |
| Published | Yes | Yes |

### Import URL

Dashboard **Import URL** takes a public page, scrapes it to markdown, and creates a post. Scraping runs through the web research chain: Firecrawl, Exa, and Context.dev. Any one key works (\`FIRECRAWL_API_KEY\`, \`EXA_API_KEY\`, or \`CONTEXT_DEV_API_KEY\`). Pick which provider goes first in **API Keys > Web research**; the others are fallbacks. From a terminal:

\`\`\`bash
npm run import https://example.com/article
\`\`\`

Imported posts land unpublished so you can edit before they go live.

### Demo mode

\`/dashboard\` without GitHub shows a 30 minute demo. Writes are gated. Sign in for the real sections.`,
  },
  {
    id: "embeds",
    title: "Embed X posts and video",
    content: `## Embed X posts and video

Posts and pages can show an X post or a YouTube video inline. Both go in as a raw \`<iframe>\` in the markdown body. The site renderer only allows iframes from a short list of hosts, so the shape matters.

### The fast way

1. In Write or Edit, put the cursor where the embed should go
2. Click **Embed** in the toolbar (markdown mode only, rich text does not accept raw HTML)
3. Paste the link. Any of these work:
   - \`https://x.com/convex_dev/status/1234567890123456789\`
   - \`https://twitter.com/convex_dev/status/1234567890123456789\`
   - a bare tweet id like \`1234567890123456789\`
   - \`https://www.youtube.com/watch?v=dQw4w9WgXcQ\`, \`https://youtu.be/dQw4w9WgXcQ\`, or a Shorts link
4. Check the preview line, then press Enter or click **Insert**

The dialog writes the exact markup below. Preview in the editor shows the live embed.

### X post markup

\`\`\`html
<iframe src="https://platform.twitter.com/embed/Tweet.html?id=1234567890123456789&theme=light&dnt=true" width="550" height="600" style="border:0;max-width:100%;" title="X post"></iframe>
\`\`\`

This is the X embed page itself, so it works without \`widgets.js\` and survives the sanitizer. \`dnt=true\` turns off X tracking for readers. Swap \`theme=light\` for \`theme=dark\` if the post sits in a dark section.

Two things that do not work here:

- The \`<blockquote class="twitter-tweet">\` plus \`<script>\` snippet from the X share menu. Scripts are stripped.
- Links to a profile or a search. Only \`/status/<id>\` URLs have an id to embed.

### YouTube markup

\`\`\`html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" style="border:0;max-width:100%;aspect-ratio:16/9;height:auto;" title="YouTube video" allowfullscreen></iframe>
\`\`\`

The \`aspect-ratio\` style keeps it 16:9 on phones. Use \`youtube.com/embed/<id>\`, never the \`watch?v=\` URL, in the \`src\`.

### What the sanitizer allows

\`src/components/BlogPost.tsx\` keeps the whitelist in \`ALLOWED_IFRAME_DOMAINS\`:

| Host | Used for |
|------|----------|
| youtube.com, www.youtube.com | Video |
| youtube-nocookie.com, www.youtube-nocookie.com | Video without YouTube cookies |
| platform.twitter.com, platform.x.com | X posts |

\`youtu.be\` is a share link, not an embed host. The Embed dialog converts it to \`www.youtube.com/embed/<id>\` for you.

Allowed iframe attributes: \`src\`, \`width\`, \`height\`, \`style\`, \`title\`, \`allow\`, \`allowfullscreen\`, \`frameborder\`. The renderer adds \`loading="lazy"\` and a sandbox on its own. Anything else on the tag is dropped. Iframes from other hosts do not render.

### Writing from files or agents

The same markup works in \`content/blog/*.md\` and in drafts filed through \`POST /api/v1/drafts\`. Agents can build it with the two templates above. Paste this into a coding agent:

\`\`\`
When I ask you to embed an X post in a blog draft, insert
<iframe src="https://platform.twitter.com/embed/Tweet.html?id=TWEET_ID&theme=light&dnt=true" width="550" height="600" style="border:0;max-width:100%;" title="X post"></iframe>
with TWEET_ID taken from the /status/ URL. For YouTube use
<iframe src="https://www.youtube.com/embed/VIDEO_ID" width="560" height="315" style="border:0;max-width:100%;aspect-ratio:16/9;height:auto;" title="YouTube video" allowfullscreen></iframe>
\`\`\`

### Adding another host

Add the domain to \`ALLOWED_IFRAME_DOMAINS\` in \`src/components/BlogPost.tsx\`, then to \`dashboardSanitizeSchema\` in \`src/pages/Dashboard.tsx\` so the editor preview matches. Redeploy the static app. Keep the list short: every host you add can run its own scripts inside the frame.`,
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

Setup for HTTP and the skill: **Publish from agents**. WebMCP in-page tools never create drafts; a browser agent on the live site can read, search, subscribe, and send a contact message, nothing more.

\`\`\`bash
curl -X POST {{PUBLIC_URL}}/api/v1/drafts \\
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

JSON-RPC 2.0 over HTTP at \`POST {{PUBLIC_URL}}/mcp\`. Rate limited at 50 requests per minute.

Read tools are public unless Convex env \`MCP_API_KEY\` is set. \`create_draft\` always needs a pipeline key (\`wsa_...\`) from Dashboard, API Keys. It does **not** use a server-side \`BLOG_POST_KEY\`.

### Remote vs in-page

This endpoint is for **remote** agents: Cursor, Claude Code, Codex, a script. They connect over HTTP from outside the tab and get the full read set plus \`create_draft\`.

A Chrome agent that already has {{PUBLIC_HOST}} open uses a different, smaller surface: **WebMCP** tools registered by the page itself (search, read the current page, open a post, subscribe with a confirm dialog). Nothing in the browser can create drafts or export the site. See **WebMCP in the browser**.

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
      "{{GITHUB_REPO}}": {
      "url": "{{PUBLIC_URL}}/mcp",
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
curl -X POST {{PUBLIC_URL}}/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
\`\`\`

Without a key you should see **seven** tools. \`tools/list\` hides \`create_draft\` from anonymous callers so crawlers and browser side proxies never see a privileged tool they cannot use. Add \`-H "x-api-key: $BLOG_POST_KEY"\` and the list grows to **eight**. Calling \`create_draft\` without a key fails the same way it always did.

### Verify create_draft

Without a key this should error. With \`$BLOG_POST_KEY\` it should return a \`draftId\`.

\`\`\`bash
curl -X POST {{PUBLIC_URL}}/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $BLOG_POST_KEY" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_draft","arguments":{"title":"MCP verify","rawInput":"MCP create_draft check.","mode":"as-is","source":"mcp"}}}'
\`\`\`

Prefer **Publish from agents** (HTTP + skill) as the daily path. MCP is optional.`,
  },
  {
    id: "webmcp",
    title: "WebMCP in the browser",
    content: `## WebMCP in the browser

WebMCP lets a page describe what an agent may do on it. The site calls \`document.modelContext.registerTool()\` with a name, a description, a JSON Schema for inputs, and an \`execute\` callback. A Chrome agent (Gemini in Chrome, an extension, the Model Context Tool Inspector) reads that list and calls the tools instead of guessing at DOM selectors. You are in the tab the whole time.

{{PUBLIC_HOST}} registers a small allowlist on every public page. Browsers without the API see no change. Registration failures are swallowed, so a spec change cannot break the site.

### What it is not

WebMCP does not replace \`POST /mcp\`. Remote agents (Cursor, Claude Code, Codex, scripts) still connect over HTTP and get the full read set plus \`create_draft\`. The in-page tools are a second, smaller door for an agent that already has the site open. Same Convex data, same UI, human present.

| | Remote MCP | In-page WebMCP |
|--|-----------|----------------|
| Who | Cursor, Claude Code, scripts | Chrome agent in your tab |
| Where | \`POST /mcp\` | \`document.modelContext\` |
| Auth | none for reads, \`wsa_\` key for drafts | you, watching |
| Writes | drafts with a key | newsletter and contact behind a confirm dialog |
| Setup | MCP client config | none, ships with the site |

### Test it locally

1. Open \`chrome://flags/#enable-webmcp-testing\` in Chrome 146 or newer, set it to Enabled, relaunch
2. Install the **Model Context Tool Inspector** extension from the Chrome Web Store
3. Load \`http://localhost:5173\` (or the live site) and open the extension. You should see the tools below
4. Run \`search_site\` with \`{ "query": "convex" }\`. The site search modal opens with the query typed in
5. Open a post and rerun. \`get_current_page\` returns that post. If the post has a generated reading, \`listen_to_post\` appears

Without the flag nothing registers and the console stays clean. Chrome DevTools, Console, \`typeof document.modelContext\` tells you which state you are in.

### In-page tools

| Tool | When | What it does |
|------|------|--------------|
| search_site | every public page | Opens the Cmd+K modal with the query filled in |
| get_current_page | every public page | Slug, title, description, tags, date, type for the current published post or page |
| list_recent_posts | every public page | Up to ten recent published posts, metadata only |
| open_post | every public page | Navigates this tab to a published post by slug. Unlisted slugs are refused. |
| open_page | every public page | Same for pages |
| set_theme | every public page | dark, light, tan, or cloud |
| subscribe_newsletter | signup form on the page | Confirm dialog, then the same mutation the form uses |
| submit_contact | contact form on the page | Confirm dialog, then the same mutation the form uses |
| listen_to_post | post with a rendered player | Presses play on the audio player |

Form tools only exist while that form is mounted. Navigate away and they unregister. The honeypot stays empty on agent submits, so the same anti spam path applies. Tool names are a fixed allowlist in \`src/utils/webmcp/catalog.ts\`; the same file tags each remote MCP tool with its audience so the two lists cannot drift apart.

### Never in the browser

- \`create_draft\` and \`export_all\`
- Dashboard writes, publishing, API key reads
- Anything on \`/dashboard\`, \`/write\`, or \`/newsletter-admin\` (no tools register there)
- Cloudflare Agent Readiness packs (\`mcp-server-client\`, HTMLRewriter injection). Those would proxy backend MCP tools into every page with no human in the loop. Leave them off.

### Turn it off

Site Config, Features, **WebMCP**. Uncheck and save. Or set \`webmcp.enabled: false\` in \`src/config/siteConfig.ts\`. The catalog and the confirm dialog stay in the bundle; nothing registers.

### Origin trial for real visitors

The local flag only works on your machine. To turn the tools on for visitors who have not flipped a flag, register \`{{PUBLIC_URL}}\` for the WebMCP origin trial at Chrome origin trials, then add the token to \`index.html\` as \`<meta http-equiv="origin-trial" content="...">\`. Until you do that, only flagged browsers see the tools. The trial is time boxed; check the Chrome status page before relying on it.

### Verify

- Home with the flag: tool list shows six tools, \`search_site\` opens the modal, \`get_current_page\` returns the home entry
- A post: \`open_post\` on a listed slug navigates; on an unlisted slug it returns \`ok: false\`
- Newsletter or contact section: \`subscribe_newsletter\` shows the site dialog. Cancel returns \`ok: false\` with nothing sent. Confirm submits for real
- \`/dashboard\`: no tools
- Chrome without the flag, Safari, Firefox: no console errors, site works

Deep link to this page: \`/dashboard?docs=webmcp\`.

Spec: github.com/webmachinelearning/webmcp. Chrome docs: developer.chrome.com/docs/ai/webmcp. PRD: \`prds/webmcp-in-page-tools.md\`.`,
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

The grid shows Override, Override (env set), Env var, or Not set. Values are never shown back. Every feature in the table below reads keys the same way, so a green check means the feature will work.

\`\`\`bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
npx convex env set --prod ANTHROPIC_API_KEY sk-ant-...
\`\`\`

Setting a value to the word \`unset\` marks it as intentionally not configured.

**Bring your own key without touching env vars.** Saving a key here never edits or deletes a Convex environment variable. When a key already comes from env, the button reads Override and the badge becomes Override (env set) after you save. Remove the override and the env var takes over again. Replace swaps one dashboard override for another.

**Model overrides.** Once a model vendor key is configured, its row shows a Model docs link to that provider's model list and one line per model slot (chat, image, or speech) with the id each feature sends. Set model stores a different id for that slot; every feature that routes to the vendor uses it on the next call, in AI chat, Ask AI, image generation, post audio, and the voice agent rewrite. Reset returns to the hardcoded default. Embedding models are not overridable because the vector indexes are sized for them.

**Web research.** Import URL, AI chat link attachments, and the voice agent's draft link context all scrape pages through one chain: Firecrawl, then Exa, then Context.dev. Any single key is enough. The Web research card below the grid shows the live order and a Try first select. Auto keeps catalog order; picking a provider moves it to the front. A provider whose key is missing or whose request fails is skipped and the next one runs. Nothing here is required at deploy time, so \`npx convex deploy\` and \`npm run sync\` work with zero research keys set.

| Key | Used for |
|-----|----------|
| OPENAI_API_KEY | Voice agent, embeddings, Ask AI |
| ANTHROPIC_API_KEY | Claude models |
| GOOGLE_AI_API_KEY | Gemini chat and images |
| CONCENTRATE_API_KEY | Concentrate gateway |
| OPENROUTER_API_KEY | OpenRouter gateway |
| RUNWARE_API_KEY | Runware images |
| FIRECRAWL_API_KEY | Web research (URL import, chat links, draft links) |
| EXA_API_KEY | Web research fallback |
| CONTEXT_DEV_API_KEY | Web research fallback |
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

Only the optional \`MCP_API_KEY\` and the R2 and Bunny storage credentials read Convex env alone. Everything in the table, including the two webhook secrets, honors a dashboard override first.`,
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
5. Point the AgentMail webhook at \`{{PUBLIC_URL}}/api/hooks/agentmail\` (prod) subscribed to \`message.received\` and \`message.received.unauthenticated\`

Dev's \`AGENTMAIL_WEBHOOK_SECRET\` is the sentinel \`unset\`, so the email door on dev returns 503. Test inbound mail against prod.

### How sends work

The Newsletter section lists subscribers and past sends. Compose from a published post or custom content. You can send to all subscribers or pick a subset. Targeted post sends do not mark the post as sent.

Sends include unsubscribe links per subscriber.

### Contact form

Site Config > Audience > Contact Form is the global switch. Turn **Enable contact form** on and Save. That does not place a form on any page.

Then add it to a post or page in one of two ways.

Inline, where you want it:

\`\`\`
<!-- contactform -->
\`\`\`

At the bottom of that post or page, set frontmatter:

\`\`\`
contactForm: true
\`\`\`

In the dashboard editor that is the Contact Form checkbox on the post or page, not the Site Config card.

If both are present, the shortcode wins and you get one form.

Submissions send to \`AGENTMAIL_CONTACT_EMAIL\` (falls back to \`AGENTMAIL_INBOX\`). You also need \`AGENTMAIL_API_KEY\`. Set them in API Keys or Convex env.

### Reading the AgentMail console

**sent** means the app sent it. It will never create a draft. **received** is inbound. **unauthenticated** is also inbound: Gmail often lands with that label. The door accepts both. Spam and blocked stay out.

The webhook only fires for mail that arrives after it was created. Use inbox backfill for older messages.`,
  },
  {
    id: "ai-features",
    title: "AI features",
    content: `## AI features

### Which models show up

The model picker in AI Agent chat and image tabs only lists models whose provider has a key. It reads the same status as **API Keys** > Vendor keys: a dashboard override or a Convex env var both count. No key, no model.

- One usable model: it shows as a static label. There is nothing to switch to, so there is no dropdown.
- Two or more usable models: a dropdown lists them with the provider next to each name.
- A key icon lists the providers that have a key on this deployment.
- An **N hidden** badge counts models without a key. Hover it to see which env var to add.

If a model you expect is missing, open API Keys and check the row for its provider. The table below maps each model to its key.

### AI chat

The AI Agent section and the Write page assistant support several models.

| Model | Provider | Key |
|-------|----------|-----|
| Claude Sonnet 4 | Anthropic | ANTHROPIC_API_KEY |
| GPT-4.1 mini | OpenAI | OPENAI_API_KEY |
| Gemini 2.0 Flash | Google | GOOGLE_AI_API_KEY |
| Concentrate Auto | Concentrate gateway | CONCENTRATE_API_KEY |
| OpenRouter Auto | OpenRouter gateway | OPENROUTER_API_KEY |

Gateway options route each request. Chat supports image attachments and link attachments. Links get scraped through the web research chain (Firecrawl, Exa, Context.dev) when any of those keys is set.

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
curl {{PUBLIC_URL}}/api/export
curl {{PUBLIC_URL}}/vfs/tree
curl -X POST {{PUBLIC_URL}}/vfs/exec -H "Content-Type: application/json" -d '{"command":"ls /wiki"}'
curl {{PUBLIC_URL}}/rss-full.xml
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
2. Set the callback URL to \`{{X_CALLBACK_PROD}}\` for prod and \`{{X_CALLBACK_DEV}}\` for dev. Both deployments need their own callback entry
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

Logo gallery images stay dashboard-managed. Custom nav items stay in \`siteConfig.ts\`. Footer social icon URLs are now rows on the Footer card. Closing note markdown is the textarea on Closing note.

### Tabs

The tab bar under the section title sticks to the top while you scroll. **All** shows every card with a label between groups. Pick a group tab to see only that group. Your last tab is remembered on this device.

Switching tabs never drops unsaved edits. Every card stays on the page, hidden panels are just hidden, so Save still writes the whole config.

| Tab | Cards |
|-----|-------|
| Site | Basic Settings, Inner Page Logo, Right Sidebar, Footer, Closing note |
| Homepage | Homepage route, Homepage content (a pointer to the Homepage section, including named external links), Logo Gallery |
| Blog, projects, skills, and photos | Blog Page, Projects Page, Skills Page, Photos Page, Share this post (heading, channels, AI writing note), Related Posts, Post audio, Image Lightbox |
| Audience | Automatic newsletters, Newsletter Signup Locations, Contact Form |
| Features | Features, AI Chat, Semantic Search, Ask AI, WebMCP, Media Library |
| Developer | GitHub Repository, Version Control, MCP server |

The command palette (Cmd+K) knows every card. Type a setting name like "read time", "lightbox", or "mcp" and pick the result: the right tab opens, the page scrolls to the card, and the card flashes so you can find it.

If you hide the view toggle icons, a visitor's saved list/cards preference is ignored so the configured default always wins.

### Contact Form

The Audience tab card is a global switch: Enable contact form, title, description. Save. That does not put a form on any page.

To show the form, pick one placement on that post or page:

- Frontmatter \`contactForm: true\` (or the Contact Form checkbox in the editor). The form lands at the bottom.
- The shortcode \`<!-- contactform -->\` in the markdown body. The form lands where you put it.

Both need the global switch on. If you use both, the shortcode wins and you get one form.

Mail goes to \`AGENTMAIL_CONTACT_EMAIL\`. See **Writing and publishing** for placement and **Newsletter and AgentMail** for keys.

### Index HTML

Theme colors must match in two places: \`src/styles/global.css\` and the inline block in \`index.html\` (stops a flash of the wrong theme). The Index HTML section generates that critical head. After you change theme tokens, update both, then deploy static assets.

The reminder banner at the top of Site Config has an X. Dismissing it is remembered in this browser until the site name, title, or bio changes, at which point it comes back because \`index.html\` is stale again.

### Save vs deploy

Config Save is live for data. Changing React or CSS still needs a static deploy. See **Deploying**.`,
  },
  {
    id: "site-ops",
    title: "Media, analytics, sync",
    content: `## Media, analytics, and sync

The remaining dashboard sections that keep the site running, plus the two shell features that span every section: search and tooltips.

### Dashboard search

The search box in the header (Cmd+K, or Ctrl+K) is a command palette. It matches:

- **Sections**: type "config", "keys", "sync" to jump to a dashboard section
- **Posts and pages** by title or slug, opening straight into the editor
- **Settings**: any Site Config card by name or by the fields inside it ("read time", "lightbox", "mcp") opens the right tab and scrolls to the card
- **Features**: "embed", "unlisted", "vendor keys", "minimap", "slides", "skills", "photos", "gallery", "lightbox", "slideshow", "contact form", "voice profile" land on the section that owns them, even when the word never appears in the nav
- **Docs topics**: matches against the full body of every topic, so "iframe" finds the embeds guide. Results open the topic in Docs.
- **Actions**: "new post", "new page", "sync dev", "sync prod"

Arrow keys move, Enter opens, Escape closes. Every word you type has to match, so adding words narrows the list. Title matches rank above description matches, which rank above body matches. The index is built in the browser when the dashboard loads, no Convex round trip. Public site search (the Cmd+K on the site itself) is a separate Convex search index over post content, and Ask AI is vector search over embeddings.

Add an entry in \`src/utils/dashboardSearch.ts\` under \`FEATURE_ENTRIES\` when you ship something an admin might hunt for by a word that is not in the nav.

### Tooltips

Most toolbar buttons, switches, and sync commands show a short hint on hover or keyboard focus, with the shortcut when there is one. They wait about a third of a second so they stay out of the way while you click around. Hints are for what a control does and what it costs. Labels stay the visible copy. Tooltips are built on Radix and styled with the site tokens in \`src/styles/tooltip.css\`. Wrap a control in \`<Tip content="...">\` from \`src/components/ui/Tooltip.tsx\` to add one.

### Media

Dashboard uploads go to **Cloudflare R2** (the editor Upload and Media gallery path). Turn \`media.enabled\` on in Config. R2 needs the Convex R2 env vars for this deployment (bucket, token, public host). Use the returned URL in frontmatter \`image\` or \`ogImage\`.

Bunny.net / ConvexFS remains available if \`media.provider\` is set that way. That path needs \`BUNNY_API_KEY\`, \`BUNNY_STORAGE_ZONE\`, and \`BUNNY_CDN_HOSTNAME\`. PNG, JPG, GIF, WebP, with the Config upload cap.

The editor Upload buttons open the same library.

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
    id: "skills",
    title: "Skills directory",
    content: `## Skills directory

Optional public page at \`/skills\` for agent skills you ship or recommend. Off until you turn **Skills Page** on in Site Config. Show in nav is a separate toggle.

The dashboard **Skills** section is the only writer. Agents can read the same text from \`cat /skills.md\` on the VFS and from the Skills entry in \`/llms.txt\`.

### Sections

A section is a heading on the page: "My skills", "Skills I recommend", or your own title. Optional collection install command sits under that heading. Deleting a section unassigns its skills. It does not delete them. Skills with no section, or whose section is unpublished, land under a default "Skills" heading.

### One skill

| Field | What readers see |
|-------|------------------|
| slug | Anchor at \`/skills#slug\` |
| title | Card title |
| command | Optional slash command, shown in mono |
| description | One line under the title |
| details | Collapsible extra copy |
| author | Name plus optional URL |
| install commands | Up to four labeled lines (\`npx skills add\`, \`skills.sh\`, \`git clone\`) with copy |
| links | repo, skills.sh, docs, X. Empty URLs hide the icon |

### Prefill from SKILL.md

Paste a GitHub blob, tree, raw, or repo URL. The browser fetches \`SKILL.md\` and fills title, slug, command, description, repo link, and a Skills CLI install suggestion. You still Save.

### Site Config

Skills Page card: enable the route, show in nav, title, description, nav order. The public page 404s when the route is off. Deep links still work once it is on.

### Copy as markdown

The public page button, the VFS file, and agent-ready discovery all use \`convex/lib/skillsDirectory.ts\`, so they stay in lockstep. Publishing a skill schedules a discovery refresh the same way a post does.`,
  },
  {
    id: "photos",
    title: "Photo gallery",
    content: `## Photo gallery

Optional public gallery at \`/photos\`. Off until you turn **Photos Page** on in Site Config. Show in nav is a separate toggle. Every published photo also gets its own link at \`/photos/<slug>\`, which opens the gallery with that photo in the lightbox. Share it, paste it in a post, or hand it to an agent.

The dashboard **Photos** section and the email inbox are the only writers. Photos live in their own table, not the Media Library, so cleaning up media never orphans a gallery image. Files go to Cloudflare R2 when the R2 provider is configured, otherwise Convex storage.

### Upload from the dashboard

Drop files on the zone or click to pick several at once. Rules:

- PNG, JPEG, GIF, WebP, up to 10 MB each
- HEIC is not supported. Browsers cannot decode it. Export as JPEG first.
- Each file shows its own progress row and error text if it fails
- The browser makes an 800px WebP thumbnail for the grid and records the natural width and height so tiles never shift
- Set default tags and the publish state in the row above the zone before you drop. Uploads land unpublished unless you tick **Publish on upload**

### One photo

| Field | What readers see |
|-------|------------------|
| title | Caption in the lightbox and under the full frame view. Optional. |
| description | One line under the title. Optional. |
| tags | Lowercase chips. Drive the tag rail and the \`?tag=\` filter. |
| date | Manual capture date. Controls sort order, newest first. Falls back to the upload time. |
| slug | Auto from the title or filename. Editable. Collisions get \`-2\`, \`-3\`. |
| published | Only published photos show on the site and in agent files |

Click a tile or its title to open the editor. Existing tags appear as suggestions so spelling stays consistent.

### Tags and views

Grid is the default: square tiles, five across on desktop. **Full frame** stacks each photo at its natural aspect with title, description, and tags under it. Readers can flip between the two when **Show view toggle** is on, and the choice sticks in their browser.

The TAGS rail sits on the right on desktop and becomes a chip row on mobile. Picking a tag rewrites the URL to \`/photos?tag=name\`, so a filtered view is a link you can share. The count under the rail follows the filter.

### Lightbox and presentation

Click a tile to open the lightbox. Arrows or Left and Right step through the filtered set. Home and End jump to the ends. Escape closes. Swipe works on touch. Neighbors preload so stepping feels instant.

**Present** starts a fullscreen slideshow from the first photo in the current view. It autoplays at the interval set in Site Config, Space pauses, arrows step, and \`P\` toggles between lightbox and presentation. Crossfade is off when the reader has asked for reduced motion.

### Email photos in

Send from an address on the AgentMail allowlist to your inbox with images attached:

- **Subject** becomes the title. If you leave it blank the filename is used.
- **Body** becomes the description. A line like \`tags: canmore, nature\` sets tags and is removed from the description.
- Inline images (signatures, tracking pixels) and non image attachments are ignored
- Up to 10 photos per email, 10 MB each. Others are skipped and named in the reply.
- Emails with no usable image fall through to the Drafts Inbox exactly as before

Photos publish immediately when **Auto publish emailed photos** is on (the default). Turn it off in the email card and they wait under the **Unpublished** filter instead. Either way you get a reply listing the new \`/photos/<slug>\` links. A retried webhook never creates a duplicate.

Emailed photos arrive without a thumbnail. Run **Generate missing thumbnails** in the Photos section once in a while. The browser downloads each original, encodes the WebP, and uploads it. Until then the grid shows the original, which works but is heavier.

### Site Config

Photos Page card: enable the route, show in nav, title, description, default view (grid or full frame), show view toggle, show tag filter, slideshow interval, nav order. The public page 404s when the route is off. Deep links start working the moment it is on.

### Agents

- \`cat /photos.md\` on the VFS returns the whole gallery as markdown: one heading per photo with title, description, tags, page URL, image URL, and date
- The same text is the \`/photos\` entry in \`/llms.txt\` and agent-ready discovery
- MCP tool \`list_photos\` (optional \`tag\` argument) returns structured rows. WebMCP adds \`list_photos\` and \`open_photo\` in the tab.
- The sitemap lists \`/photos\` and every \`/photos/<slug>\`
- Publishing, editing, or deleting a photo schedules a discovery refresh the same way a post does
- **Copy as markdown** on the public page uses the same builder, \`convex/lib/photosDirectory.ts\`, so agents and readers see identical text

### Troubleshooting

| Symptom | Check |
|---------|-------|
| Photo missing on the site | Is it published? Is Photos Page enabled? Is a tag filter active in the URL? |
| Email ignored | Sender on the allowlist? Image attached, not inline? Not HEIC? |
| Email landed in Drafts Inbox | No usable image attachment was found, so it took the text path |
| Grid loads slowly | Run Generate missing thumbnails |
| Upload rejected | Over 10 MB or an unsupported type |`,
  },
  {
    id: "git-guide",
    title: "Git guide",
    content: `## Git guide

The repo is [{{GITHUB_REPO}}]({{GITHUB_URL}}). Branch \`main\`, remote \`origin\`. Git holds the app code and every markdown file in \`content/\`. Convex holds the live data. Two stores, one habit:

**Pull before you work. Sync after you pull. Export before you commit.**

This repo also has an \`upstream\` remote pointing at markdown-site, the fork source. Day to day you only talk to \`origin\`. Leave \`upstream\` alone unless you are intentionally merging framework updates.

### The order of operations

Start of a session:

\`\`\`bash
git status        # 1. where you stand
git pull          # 2. bring down remote changes from origin/main
npm install       # 3. only if the pull touched package-lock.json
npm run sync      # 4. only if the pull touched content/, pushes markdown to dev Convex
\`\`\`

End of a session:

\`\`\`bash
npm run export:db          # 1. only if you wrote or edited in the dashboard
git status                 # 2. see what changed
git diff                   # 3. read it before you stage it
git add content/ src/      # 4. stage the paths you mean, not everything blindly
git commit -m "feat: what changed"
git push                   # 5. up to GitHub
\`\`\`

Skipping the export step is how dashboard posts end up living only in Convex while GitHub falls behind.

### See if GitHub has changes before pulling

\`git fetch\` downloads what GitHub knows without changing any of your files. Safe to run any time.

\`\`\`bash
git fetch origin
git status
\`\`\`

\`git status\` then tells you one of three things:

| Status says | Meaning |
|-------------|---------|
| up to date with origin/main | Nothing to pull |
| behind origin/main by N commits | GitHub has changes. Pull. |
| ahead of origin/main by N commits | You have unpushed commits. Push when ready. |
| diverged | Both sides have new commits. See conflicts below. |

To read the incoming changes before you take them:

\`\`\`bash
git log HEAD..origin/main --oneline    # commits you do not have yet
git diff HEAD..origin/main --stat      # files those commits touch
\`\`\`

### Pull, then run the right follow-up

\`\`\`bash
git pull
\`\`\`

What you run next depends on what the pull touched:

| The pull touched | Run |
|------------------|-----|
| content/blog or content/pages | \`npm run sync\` (dev) or \`npm run sync:prod\` |
| package.json or package-lock.json | \`npm install\` |
| convex/ | Nothing if \`npx convex dev\` is running. It deploys functions on save. |
| src/, index.html, styles | \`npm run dev\` picks it up locally. Prod needs a static deploy. See **Deploying**. |
| agent-ready.config.json | \`npx agent-ready sync\` (add \`--prod\` for prod) |

Nothing changed in a category, skip its step.

### Commit your work

Dashboard writes live in Convex, not in files. Pull them into \`content/\` first so they get committed:

\`\`\`bash
npm run export:db        # dev data to files
npm run export:db:prod   # prod data to files
\`\`\`

Then the normal loop:

\`\`\`bash
git status
git diff                             # or git diff <file> for one file
git add content/blog/my-post.md
git commit -m "feat: add post on x"
git push
\`\`\`

Commit subjects: present tense, under 50 characters, prefixed with \`feat:\`, \`fix:\`, \`docs:\`, or \`chore:\`.

Never commit \`.env.local\`, \`.env.production.local\`, or anything holding a \`wsa_\` pipeline key. Both env files are gitignored. Keep them that way.

### When git blocks the pull

Uncommitted local changes that overlap the incoming ones make \`git pull\` refuse. Park your work, pull, take it back:

\`\`\`bash
git stash push -m "wip: what I was doing"
git pull
git stash pop
\`\`\`

If the pop reports conflicts, resolve them the same way as below. Your stash stays saved until it pops cleanly, so nothing is lost.

### Merge conflicts

A diverged branch or an overlapping stash pop leaves conflict markers in files.

1. \`git status\` lists every conflicted file under "both modified"
2. Open each one, find the \`<<<<<<<\` / \`=======\` / \`>>>>>>>\` markers, keep the lines you want, delete the markers
3. \`git add\` each resolved file
4. \`git commit\` to finish the merge
5. If a resolved file was in \`content/\`, run \`npm run sync\` again so Convex matches the files

### Safety rules

These come from hard experience in this repo.

- Read \`git diff <file>\` before discarding anything. Once discarded, uncommitted work is gone.
- Do not use \`git checkout -- <file>\`, \`git reset --hard\`, or \`git clean -fd\` to tidy up. All three destroy uncommitted work permanently. Stash instead.
- To undo something specific, edit the file back by hand or use \`git stash\` so the work stays recoverable.
- \`git fetch\`, \`git status\`, \`git log\`, and \`git diff\` never change your files. When unsure, start with those.`,
  },
  {
    id: "deploying",
    title: "Deploying",
    content: `## Deploying

This app is **Convex static self-hosting** (\`@convex-dev/self-hosting\` in \`convex.config.ts\`). Markdown sync is not a deploy. A deploy is either Convex functions, the static Vite bundle, or both.

There is no \`npm run deploy --prod\` script. Production targeting is either a \`:prod\` npm script (reads \`.env.production.local\`) or \`--prod\` on the Convex CLI.

### This project's deployments

Filled from \`.env.local\` and \`.env.production.local\` so a fork shows its own names.

| | Dev | Prod |
|--|-----|------|
| Deployment | {{DEV_NAME}} | {{PROD_NAME}} |
| Cloud | {{DEV_CLOUD}} | {{PROD_CLOUD}} |
| HTTP / static host | {{DEV_SITE}} | {{PROD_HTTP}} |
| Public site | {{DEV_DASHBOARD}} | {{PUBLIC_URL}} |

{{REPO_DEPLOY_NOTE}}

### When to use --prod

| You want | Command | Why this one |
|----------|---------|--------------|
| Markdown into the deployment in \`.env.local\` | \`npm run sync\` or \`npm run sync:all\` | No \`--prod\`. Dev Convex. |
| Markdown into production Convex | \`npm run sync:prod\` or \`npm run sync:all:prod\` | The \`:prod\` suffix loads \`.env.production.local\`. |
| Discovery files on production | \`npx agent-ready sync --prod\` | \`--prod\` here is the agent-ready CLI flag. |
| Env var on the current (usually dev) deployment | \`npx convex env set KEY value\` | No \`--prod\`. |
| Env var on production Convex | \`npx convex env set --prod KEY value\` | \`--prod\` is the Convex CLI flag. |
| Check \`.env.local\` | \`npm run validate:env\` | |
| Check \`.env.production.local\` | \`npm run validate:env:prod\` | The script's own \`--prod\` switch. |
| Smoke-check the URL in \`.env.local\` | \`npm run verify:deploy\` | |
| Smoke-check production | \`npm run verify:deploy:prod\` | |
| Backend functions to production | \`npx convex deploy --yes\` | Production is the default target for \`convex deploy\`. |
| Static bundle to the current/dev deployment | \`npm run deploy:dev\` | Builds, then \`self-hosting upload\` with no \`--prod\`. |
| Static bundle to production | \`npm run deploy:static\` | Already passes \`--prod\` into \`self-hosting upload --build\`. |
| Interactive full self-hosting deploy | \`npm run deploy\` | Runs \`npx @convex-dev/self-hosting deploy\`. Prompts. Dies in a non-interactive agent shell. |

Do not write \`npm run deploy --prod\`. npm would pass \`--prod\` through, but this repo does not document or test that path. Use \`deploy:static\` for production HTML/JS/CSS.

### Development

\`\`\`bash
npx convex dev   # functions to the dev deployment on save
npm run dev      # Vite at localhost:5173
npm run deploy:dev   # only when you need the static app on the dev .convex.site URL
\`\`\`

Use these for all development. Keys and content do not copy to prod.

### Production release

When app code changed:

\`\`\`bash
npm run sync:all:prod
npx convex deploy --yes
npm run deploy:static
\`\`\`

When only markdown changed:

\`\`\`bash
npm run sync:prod
\`\`\`

In an agent shell, skip \`npm run deploy\` (interactive). \`npx convex deploy --yes\` then \`npx @convex-dev/self-hosting deploy --skip-convex\` is the non-interactive equivalent of functions plus static. Prefer \`npm run deploy:static\` when functions are already on prod and you only need the Vite bundle. \`deploy:static\` injects \`VITE_CONVEX_URL\` during \`--build\`. Do not run a separate \`npm run build\` first for that path.

### Verify

\`\`\`bash
npm run validate:env
npm run validate:env:prod
npm run verify:deploy
npm run verify:deploy:prod
npx tsc --noEmit
npx convex-doctor@latest
\`\`\`

A frontend fix is not done until the **deployed** bundle has it. After a static upload, curl the live JS/CSS. A blank page with correct HTML usually means a missing lazy chunk or a cached 404.`,
  },
];
