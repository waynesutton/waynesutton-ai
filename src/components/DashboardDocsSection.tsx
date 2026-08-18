import { useState } from "react";
import {
  BookOpen,
  PenNib,
  Sparkle,
  Key,
  EnvelopeSimple,
  Robot,
  Plug,
  Broadcast,
  PaintBrush,
  RocketLaunch,
  XLogo,
} from "@phosphor-icons/react";
import BlogPost from "./BlogPost";

interface DocsTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

const TOPICS: Array<DocsTopic> = [
  {
    id: "overview",
    title: "Overview",
    icon: <BookOpen size={16} />,
    content: `## How the dashboard works

The dashboard is the admin surface for this site. Everything behind this login writes to the same Convex deployment that serves the public site, so changes are live the moment you save.

### Sections

| Section | What it does |
|---------|--------------|
| Posts and Pages | List, filter, edit, and publish content |
| Write | Create new posts and pages with markdown, preview, and frontmatter fields |
| Drafts Inbox | Review drafts from agents, email, or paste, plus the voice profile |
| AI Agent | Multi model chat and image generation |
| Newsletter | Subscribers, sends, and signup stats |
| Media | Upload and manage images |
| Stats | Real time visitors and page views |
| API Keys | Vendor key status and pipeline keys |
| Agent Ready | Discovery files and widget controls |
| Config | Generate a new siteConfig.ts from UI controls |
| Docs | This section |

### Dev and prod

You run two Convex deployments. The dev deployment backs localhost, the prod deployment backs the live site. Environment variables, API keys, and content are separate per deployment. Anything you set here applies only to the deployment this dashboard is connected to.

### Keyboard shortcuts

- Cmd+. toggles the sidebar
- Cmd+K opens site search
- Cmd+J opens Ask AI when enabled`,
  },
  {
    id: "writing",
    title: "Writing and publishing",
    icon: <PenNib size={16} />,
    content: `## Writing and publishing

There are two ways to publish: write in the dashboard, or write markdown files locally and sync.

### Dashboard editor

Write post and Write page give you a markdown editor with live preview and a frontmatter panel. Fill in the fields instead of hand writing YAML. Required fields for posts: title, description, date, slug, published, tags. Pages need title, slug, and published.

Useful optional fields:

- **featured** and **featuredOrder** control the featured section
- **excerpt** shows in card view
- **image** sets the OG image
- **unlisted** hides content from lists and search but keeps the URL working, with noindex set for crawlers
- **authorName** and **authorImage** override the byline

### Local files and sync

Markdown lives in \`content/blog/\` and \`content/pages/\`. Sync commands push to Convex:

\`\`\`bash
# Content
npm run sync                # markdown content to dev
npm run sync:prod           # markdown content to prod

# Discovery files (AGENTS.md, CLAUDE.md, llms.txt)
npm run sync:discovery
npm run sync:discovery:prod

# Content + discovery in one command
npm run sync:all
npm run sync:all:prod

# Pull dashboard-written posts and pages back into content folders
npm run export:db
npm run export:db:prod

# Import an external URL as a draft post (needs FIRECRAWL_API_KEY)
npm run import <url>
\`\`\`

Content syncs instantly. No build step for markdown changes. Static assets (the React app itself) are a separate step:

\`\`\`bash
npm run deploy:dev   # build and upload static assets to the dev deployment
npm run deploy       # full static hosting deploy to prod
\`\`\`

You only need a static deploy when app code changes, never for markdown.

### Version history

The editor keeps versions as you save. Open version history from the editor toolbar to restore an earlier state.`,
  },
  {
    id: "ai-features",
    title: "AI features",
    icon: <Sparkle size={16} />,
    content: `## AI features

### AI chat

The AI Agent section and the Write page assistant support several models. Pick one from the model select:

| Model | Provider | Key |
|-------|----------|-----|
| Claude Sonnet 4 | Anthropic | ANTHROPIC_API_KEY |
| GPT-4.1 mini | OpenAI | OPENAI_API_KEY |
| Gemini 2.0 Flash | Google | GOOGLE_AI_API_KEY |
| Concentrate Auto | Concentrate gateway | CONCENTRATE_API_KEY |
| OpenRouter Auto | OpenRouter gateway | OPENROUTER_API_KEY |

The two gateway options route each request to a model chosen by the gateway. One key gives you access to many providers, with spend tracking on the gateway dashboard. Chat supports image attachments and link attachments. Links get scraped through Firecrawl when FIRECRAWL_API_KEY is set.

### Image generation

The image tab generates images and stores them in Convex storage:

| Model | Provider | Key |
|-------|----------|-----|
| Nano Banana | Google | GOOGLE_AI_API_KEY |
| Nano Banana Pro | Google | GOOGLE_AI_API_KEY |
| Runware Flux | Runware | RUNWARE_API_KEY |

Aspect ratio options apply to all models.

### Ask AI and semantic search

Ask AI (Cmd+J) answers visitor questions from site content using retrieval over OpenAI embeddings. It needs \`semanticSearch.enabled: true\` and \`askAI.enabled: true\` in siteConfig plus OPENAI_API_KEY. Answers stream from the \`/ask-ai-stream\` HTTP route with per user rate limits.

### Voice agent

Draft submissions with mode rewrite run through a voice agent built on the Convex agent component. It uses GPT-4.1 mini with retrieval over your published posts to match your writing voice.`,
  },
  {
    id: "api-keys",
    title: "API keys",
    icon: <Key size={16} />,
    content: `## API keys

### Vendor keys

Vendor keys come from two places, checked in order:

1. **Dashboard overrides**: set or overwrite a key right in the API Keys section. Overrides are stored in this deployment's database, so dev and prod each keep their own values. Remove an override to fall back to the environment variable.
2. **Convex environment variables**: one set per deployment, managed from the terminal or the Convex dashboard.

The API Keys section shows each key's status and where its value comes from (override, env, or not set). Values are never shown back.

Set a key from the terminal for dev:

\`\`\`bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
\`\`\`

For prod, add \`--prod\` or set it in the Convex dashboard under Settings, Environment Variables:

\`\`\`bash
npx convex env set --prod ANTHROPIC_API_KEY sk-ant-...
\`\`\`

Keys the app reads:

| Key | Used for |
|-----|----------|
| OPENAI_API_KEY | Voice agent, embeddings, Ask AI |
| ANTHROPIC_API_KEY | Claude models |
| GOOGLE_AI_API_KEY | Gemini chat and images |
| CONCENTRATE_API_KEY | Concentrate gateway |
| OPENROUTER_API_KEY | OpenRouter gateway |
| RUNWARE_API_KEY | Runware images |
| FIRECRAWL_API_KEY | URL import and link scraping |
| AGENTMAIL_API_KEY | Newsletter and draft emails |
| GITHUB_TOKEN | Review PRs |
| EXA_API_KEY | Research (optional) |

Setting a value to the word unset marks it as intentionally not configured.

### Pipeline keys

Pipeline keys authenticate agents that submit drafts to \`POST /api/v1/drafts\`. Generate one in the API Keys section with a label. The plaintext key starts with wsa_ and is shown exactly once. Only a SHA-256 hash is stored. Revoke a key at any time from the same panel.`,
  },
  {
    id: "newsletter",
    title: "Newsletter and AgentMail",
    icon: <EnvelopeSimple size={16} />,
    content: `## Newsletter and AgentMail

Email runs through AgentMail. Five variables control it. Each one can be set as a Convex env var or as a dashboard override in the API Keys section:

| Variable | Purpose | Needed for |
|----------|---------|------------|
| AGENTMAIL_API_KEY | API access for sending | All email |
| AGENTMAIL_INBOX | The from-inbox id, also the address people email | All email |
| AGENTMAIL_CONTACT_EMAIL | Where owner-facing mail is delivered | Contact form, subscriber alerts, draft previews, email approvals |
| AGENTMAIL_WEBHOOK_SECRET | Svix signing secret for inbound mail | Email door and email approvals |
| AGENTMAIL_ALLOWED_SENDERS | Who may submit drafts by email | Email door and email approvals |

### Set AGENTMAIL_CONTACT_EMAIL or owner mail goes nowhere

Without it, the code falls back to the inbox, so the app emails itself. Those messages sit in the AgentMail console as **sent** and never reach a real mailbox. Contact submissions, new subscriber alerts, weekly stats, and draft previews are all affected.

It also disables the email approval loop. The loop needs the preview to land in a real mailbox so your reply travels back into the AgentMail inbox as inbound mail. A self-addressed preview never leaves, so draft previews are now skipped when the recipient resolves to the inbox itself. Check the status in API Keys.

### Who is allowed to email the door

The inbox address is public by nature: it is the address you hand out. A webhook signature only proves AgentMail delivered the message, not that you sent it. So the email door authorizes the sender before it does anything, and that check covers both filing a draft and running publish, reject, or edit on an existing one.

| AGENTMAIL_ALLOWED_SENDERS | Behavior |
|---------------------------|----------|
| Set | Only those addresses can submit drafts or run email commands |
| Unset | Falls back to AGENTMAIL_CONTACT_EMAIL, so replies to your own previews work |
| Both unset | The door refuses everything and logs a warning |

Separate entries with commas, semicolons, or newlines. An entry starting with @ matches a whole domain. Refused mail returns 200 with \`{"skipped":"unauthorized-sender"}\`, since a 4xx would only make AgentMail retry.

Two things this does not do. Plus addresses are not implied, so \`you+blog@example.com\` needs its own entry or a domain entry. And a From header can be forged, which is why draft ids matter: an email command needs both an allowed sender and a live draft id, and that id only exists in the preview email sent to you. Keep draft ids out of public repos, issues, and screenshots.

### Setup

1. Create an AgentMail account and an inbox
2. Copy the API key and inbox id
3. Set all five values on both dev and prod deployments
4. Turn on \`newsletter.enabled\` in siteConfig and pick signup placements

### How sends work

The Newsletter section lists subscribers and past sends. Compose a send from a published post or custom content. Sends go out through AgentMail with unsubscribe links handled per subscriber.

### Contact form

Pages and posts can embed a contact form with frontmatter \`contactForm: true\`. Submissions send to AGENTMAIL_CONTACT_EMAIL.

### Reading the AgentMail console

Labels matter when you are debugging. **sent** means the app sent it, so it will never create a draft. **received** is inbound mail. **unauthenticated** is also inbound: Gmail and other personal mail often lands with that extra label because AgentMail could not verify SPF or DKIM. Those messages used to be dropped. The email door now accepts both \`message.received\` and \`message.received.unauthenticated\`. Spam and blocked stay out.

The webhook only fires for mail that arrives after it was created, so anything older than the webhook was never delivered to the endpoint. Use the inbox backfill if you need those older messages imported.`,
  },
  {
    id: "agents",
    title: "Agent drafts and GitHub review",
    icon: <Robot size={16} />,
    content: `## Agent drafts and GitHub review

Agents submit drafts, you review, then publish. Five doors lead to the same Drafts Inbox:

1. **HTTP**: \`POST /api/v1/drafts\` with the pipeline key in an \`x-api-key\` header
2. **MCP**: the create_draft tool on the site MCP server, which uses BLOG_POST_KEY server side
3. **Email**: send to your AgentMail inbox
4. **Paste**: the paste box in the Drafts Inbox
5. **X**: paste an X post URL in the X section

\`\`\`bash
curl -X POST https://waynesutton.ai/api/v1/drafts \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $BLOG_POST_KEY" \\
  -d '{"type":"article","mode":"as-is","title":"test","rawInput":"hello","source":"curl"}'
\`\`\`

A 201 returns \`{ "draftId": "...", "status": "inbox" }\`. A 401 means the key is missing, wrong, or revoked.

### The blogskill file

\`blogskill/SKILL.md\` in the repo is a portable agent skill, not app code. It teaches any coding agent to call the HTTP door when you say "blog this", so a session summary becomes a draft without you leaving the terminal.

Two steps make it work:

1. Generate a pipeline key in API Keys and export it as \`BLOG_POST_KEY\` in your shell profile
2. Copy the file into the global skills folder for each agent you use, for example \`~/.claude/skills/blog-post/SKILL.md\` or \`~/.codex/skills/blog-post/SKILL.md\`

Leaving it only in this repo means the skill loads only while you are working in this repo, which defeats the point. Copy it out to use it anywhere.

### Draft flow

A draft carries rawInput plus optional title, type (session-summary, link-commentary, article), mode, source, and links. Mode rewrite runs the voice agent so the draft reads like you. Mode as-is keeps the text unchanged. X links get their post text pulled in through oEmbed.

### The Drafts Inbox controls

Tabs filter by status: Inbox, Saved, Published, Rejected, All. Click any row to open the detail panel with the rendered markdown.

| Control | What it does |
|---------|--------------|
| Publish | Creates the post live and listed, flips status to published, writes the publish log |
| Publish unlisted | Creates the post live at its slug but hidden from the homepage, /blog, Cmd+K search, RSS, the sitemap, and the VFS, and served noindex |
| Save to draft | Creates the post unpublished so you can finish it in the post editor, and moves the draft to the Saved tab |
| Edit | Opens title and body in a textarea, saves without publishing |
| Rewrite | Reruns the voice agent, optionally with notes like "tighten the intro" |
| Reject | Marks the draft rejected and leaves it in the list |
| Delete | Hard removes the draft after an inline confirm, hidden while the agent runs |
| Review PR | Opens a GitHub pull request for the draft |
| Paste box | Creates a draft from pasted text, with an as-is checkbox |

Once a draft becomes a post, the row and detail panel link to it: the slug for anything published, or an Open button that loads a saved draft in the post editor. Saving then publishing flips the same post, so you never end up with duplicates. From that point content edits belong in the post editor; Publish from the inbox only changes visibility.

An **agent pending** or **agent running** badge means the voice agent is working. **agent failed** puts the reason above the preview, usually a missing OPENAI_API_KEY.

### Voice profile and reindex

Two controls in the Drafts Inbox toolbar decide how rewrites sound.

**Voice profile** stores your writing rules server side: sentence length, headings style, words to avoid, anything that makes a post sound like you. The rewrite agent reads it on every run. An empty voice profile means rewrites fall back to generic base instructions, so fill it in once. Paste the contents of your write skill.

**Reindex voice context** embeds every published post and page into a retrieval index. The agent pulls the three closest matches into each rewrite so new posts match the voice of existing ones. Click it after the first setup and again after publishing a batch of posts. It needs OPENAI_API_KEY, and reports how many items it indexed.

### Approving from email

Set AGENTMAIL_CONTACT_EMAIL and each finished rewrite emails you a preview with the draft id in the subject, like \`[draft abc123] post title\`. Reply with one of these as the first line of the body:

- \`publish\` publishes it
- \`reject\` closes it
- \`edit: tighten the intro\` sends notes back to the voice agent and mails a fresh preview

Quoted replies and signatures are stripped before parsing. Mail sent from the inbox itself is ignored, so app notifications can never become drafts.

### GitHub review PRs

With GITHUB_TOKEN (a fine grained PAT) and GITHUB_REVIEW_REPO (owner/repo) set, each draft can open a review PR in your repo. Edit the markdown in the PR, merge it, and the webhook (verified with GITHUB_WEBHOOK_SECRET) publishes the merged version. This gives you review from any device with GitHub access.`,
  },
  {
    id: "mcp",
    title: "MCP server",
    icon: <Plug size={16} />,
    content: `## MCP server

The site serves its own MCP server at \`POST /mcp\` on the Convex site URL. JSON-RPC 2.0 over HTTP, rate limited at 50 requests per minute. Set MCP_API_KEY as an env var to require a bearer token, or leave it unset for open read access.

### Tools

| Tool | What it does |
|------|--------------|
| list_posts | Post metadata for all published posts |
| get_post | One post with full content by slug |
| list_pages | Page metadata |
| get_page | One page with full content by slug |
| get_homepage | Recent posts and counts |
| search_content | Full text search |
| export_all | All posts with content |
| create_draft | Submit a draft to the review inbox |

### Connect a client

Add the server to Claude Code, Cursor, or any MCP client that supports HTTP transport:

\`\`\`json
{
  "mcpServers": {
    "waynesutton-ai": {
      "url": "https://waynesutton.ai/mcp"
    }
  }
}
\`\`\`

If MCP_API_KEY is set, add an Authorization header with the bearer token. The create_draft tool needs BLOG_POST_KEY configured on the server side.`,
  },
  {
    id: "agent-ready",
    title: "Agent ready discovery",
    icon: <Broadcast size={16} />,
    content: `## Agent ready discovery

The agent-ready component serves discovery files that tell AI agents what this site is and how to use it.

### Routes

| Route | Content |
|-------|---------|
| /llms.txt | Short site description with page and endpoint lists |
| /llms-full.txt | Expanded version with more detail |
| /agents.md | Agent instructions, opens inline in browsers |

### Configuration

\`agent-ready.config.json\` in the repo root holds the app name, site URL, description, agent instructions, page list, and API endpoint list. It is gitignored because it can differ per deployment. After editing, push it to the deployment:

\`\`\`bash
npx agent-ready sync         # dev
npx agent-ready sync --prod  # prod
\`\`\`

### Widget

The floating widget on the public site shows human, machine, and score tabs. Widget props are set in \`src/App.tsx\`: showHumanTab, showMachineTab, showScoreTab, showChatLinks, and defaultMobileCollapsed. The Agent Ready dashboard section shows current settings and cached file state.`,
  },
  {
    id: "x-integration",
    title: "X (Twitter)",
    icon: <XLogo size={16} />,
    content: `## X integration

Connect your X account to share posts and turn X posts into blog drafts.

### Setup

1. Create an app at developer.x.com with OAuth 2.0 enabled (confidential client, type Web App).
2. Set the callback URL to \`https://<your-convex-site>/x/callback\` for prod and the dev .convex.site URL for dev. Both deployments need their own callback entry.
3. In the API Keys section, set these vendor keys (or set the same names with npx convex env set):

| Key | Used for |
|-----|----------|
| X_CLIENT_ID | OAuth client id from the developer portal |
| X_CLIENT_SECRET | OAuth client secret |
| X_BEARER_TOKEN | Optional app-only token for reading posts during import |

4. Open the X section and click Connect. You approve scopes for reading, writing, and offline access, then land back in the dashboard.

Tokens are stored per deployment and refresh automatically. Disconnect any time from the X section.

### Posting

- Compose in the X section with a live character counter.
- In Write Post, turn on Share on X after publishing. The tweet contains the post title and canonical URL. A share failure never blocks the publish.
- Recent shares list in the X section links to each tweet.

### Import an X post as a draft

Paste an X post URL (x.com or twitter.com status link) in the X section. The pipeline reads the post, asks your configured AI model to expand it into a markdown draft, and drops the result into the Drafts Inbox with source x-import. Review and publish like any other draft.

Import needs one AI provider key set (Anthropic, OpenAI, Google, Concentrate, or OpenRouter) plus X read access.`,
  },
  {
    id: "themes",
    title: "Themes and appearance",
    icon: <PaintBrush size={16} />,
    content: `## Themes and appearance

Four themes ship with the site: dark, light, tan, and cloud. Visitors cycle them with the theme toggle, and the choice persists in localStorage.

### Defaults

\`defaultTheme\` in siteConfig sets what new visitors see. \`fontFamily\` picks serif, sans, or monospace for body text. Both have controls in the Config section.

### How theming works

Every theme is a block of CSS variables on \`html[data-theme]\` in \`src/styles/global.css\`. Colors, borders, code blocks, and surfaces all read from variables, so components never hardcode colors. The dashboard uses the same variables and follows the site theme.

### Font size

The dashboard font size control scales the base font size for your admin session. It is stored locally per browser and does not affect visitors.

### The critical path

\`index.html\` inlines a small copy of the theme variables and a script that reads localStorage before first paint so there is no theme flash. If you change theme colors in global.css, update the inline copy in index.html to match.`,
  },
  {
    id: "deploying",
    title: "Deploying",
    icon: <RocketLaunch size={16} />,
    content: `## Deploying

### Development

\`\`\`bash
npx convex dev   # Convex watcher, deploys functions to dev on save
npm run dev      # Vite dev server at localhost:5173
\`\`\`

Use these for all development. The dev deployment is isolated from prod.

To preview the built static app on the dev deployment's Convex hosting:

\`\`\`bash
npm run deploy:dev   # build + upload static assets to dev
\`\`\`

### Production

\`\`\`bash
npm run sync:all:prod  # content + discovery files to prod
npx convex deploy      # Convex functions to prod
npm run deploy         # static assets via Convex self hosting (full flow)
\`\`\`

Run the three in that order when shipping a release. \`npm run deploy:static\` uploads a fresh build to prod without the full flow. For content only changes, \`npm run sync:prod\` is enough and needs no deploy.

### Verify

\`\`\`bash
npm run validate:env       # check dev env vars
npm run validate:env:prod  # check prod env vars
npm run verify:deploy      # hit deployed dev endpoints
npm run verify:deploy:prod # hit deployed prod endpoints
\`\`\`

### Checks before shipping

1. \`npx tsc --noEmit\` passes
2. \`npm run build\` passes
3. \`npx convex-doctor@latest\` stays at 100
4. Spot check the dev site at localhost:5173

### Deployments

Production is helpful-ptarmigan-118 behind waynesutton.ai. Development is notable-loris-927. Never deploy to giant-grouse-674 or agreeable-trout-200.`,
  },
];

export default function DashboardDocsSection() {
  const [activeTopic, setActiveTopic] = useState<string>(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === activeTopic) ?? TOPICS[0];

  return (
    <div className="dashboard-docs">
      <nav className="dashboard-docs-nav" aria-label="Documentation topics">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            className={`dashboard-docs-nav-item ${t.id === activeTopic ? "active" : ""}`}
            onClick={() => setActiveTopic(t.id)}>
            {t.icon}
            <span>{t.title}</span>
          </button>
        ))}
      </nav>
      <div className="dashboard-docs-content">
        <BlogPost content={topic.content} slug="dashboard-docs" pageType="page" />
      </div>
    </div>
  );
}
