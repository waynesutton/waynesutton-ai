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
| Drafts Inbox | Review drafts submitted by agents, email, or paste |
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
npm run sync        # dev deployment
npm run sync:prod   # prod deployment
npm run import <url>  # import an external URL as a draft post (needs FIRECRAWL_API_KEY)
\`\`\`

Content syncs instantly. No build step for markdown changes.

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

Email runs through AgentMail. Three environment variables control it:

| Variable | Purpose |
|----------|---------|
| AGENTMAIL_API_KEY | API access for sending |
| AGENTMAIL_INBOX | The from inbox id |
| AGENTMAIL_CONTACT_EMAIL | Contact form recipient, falls back to the inbox |

### Setup

1. Create an AgentMail account and an inbox
2. Copy the API key and inbox id
3. Set both env vars on dev and prod deployments
4. Turn on \`newsletter.enabled\` in siteConfig and pick signup placements

### How sends work

The Newsletter section lists subscribers and past sends. Compose a send from a published post or custom content. Sends go out through AgentMail with unsubscribe links handled per subscriber.

### Email door for drafts

Emails to your AgentMail inbox can create drafts in the Drafts Inbox. The webhook is verified with a Svix signature using AGENTMAIL_WEBHOOK_SECRET. Reply flows let you approve or reject a draft from your inbox without opening the dashboard.

### Contact form

Pages and posts can embed a contact form with frontmatter \`contactForm: true\`. Submissions send to AGENTMAIL_CONTACT_EMAIL.`,
  },
  {
    id: "agents",
    title: "Agent drafts and GitHub review",
    icon: <Robot size={16} />,
    content: `## Agent drafts and GitHub review

Agents submit drafts, you review, then publish. Four doors lead to the same Drafts Inbox:

1. **HTTP**: \`POST /api/v1/drafts\` with an Authorization bearer pipeline key
2. **MCP**: the create_draft tool on the site MCP server
3. **Email**: send to your AgentMail inbox
4. **Paste**: the paste box in the Drafts Inbox

### Draft flow

A draft carries rawInput plus optional title, type (session-summary, link-commentary, article), mode, source, and links. Mode rewrite runs the voice agent so the draft reads like you. Mode as-is keeps the text unchanged. X links get their post text pulled in through oEmbed.

### Review

The Drafts Inbox shows pending drafts with the rewrite beside the original. Approve to publish, or approve as draft to keep working on it in the editor. Pipeline keys created with auto publish skip review.

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

### Production

\`\`\`bash
npm run sync:all:prod  # content + discovery files to prod
npx convex deploy      # Convex functions to prod
npm run deploy         # static assets via Convex self hosting
\`\`\`

Run the three in that order when shipping a release. For content only changes, \`npm run sync:prod\` is enough and needs no deploy.

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
