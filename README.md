# markdown "sync" framework

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Convex](https://img.shields.io/badge/Convex-enabled-ff6b6b.svg)
![Netlify](https://img.shields.io/badge/Netlify-hosted-00C7B7.svg)

An open-source publishing framework built for AI agents and developers to ship websites, docs, or blogs. Write markdown, sync from the terminal. Your content is instantly available to browsers, LLMs, and AI agents. Built on Convex and Netlify.

Write markdown locally, run `npm run sync` (dev) or `npm run sync:prod` (production), and content appears instantly across all connected browsers. Built with React, Convex, and Vite. Optimized for AEO, GEO, and LLM discovery.

**How publishing works:** Write posts in markdown, run `npm run sync` for development or `npm run sync:prod` for production, and they appear on your live site immediately. No rebuild or redeploy needed. Convex handles real-time data sync, so all connected browsers update automatically.

**Sync commands:**

Sync command scripts are located in `scripts/` (sync-posts.ts, sync-discovery-files.ts).

**Development:**

- `npm run sync` - Sync markdown content
- `npm run sync:discovery` - Update discovery files (AGENTS.md, llms.txt)
- `npm run sync:all` - Sync content + discovery files together

**Production:**

- `npm run sync:prod` - Sync markdown content
- `npm run sync:discovery:prod` - Update discovery files
- `npm run sync:all:prod` - Sync content + discovery files together

**Export dashboard content:**

- `npm run export:db` - Export dashboard posts/pages to content folders (development)
- `npm run export:db:prod` - Export dashboard posts/pages (production)

**How versioning works:** Markdown files live in `content/blog/` and `content/pages/`. These are regular files in your git repo. Commit changes, review diffs, roll back like any codebase. The sync command pushes content to Convex.

```bash
# Edit, commit, sync
git add content/blog/my-post.md
git commit -m "Update post"
npm run sync        # dev
npm run sync:prod   # production
```

## Documentation

Full documentation is available at **[markdown.fast/docs](https://www.markdown.fast/docs)**

### Guides

- [Setup Guide](https://www.markdown.fast/setup-guide) - Complete fork and deployment guide
- [Fork Configuration Guide](https://www.markdown.fast/fork-configuration-guide) - Automated or manual fork setup
- [Dashboard Guide](https://www.markdown.fast/how-to-use-the-markdown-sync-dashboard) - Content management and site configuration
- [WorkOS Setup](https://www.markdown.fast/how-to-setup-workos) - Authentication for dashboard protection
- [MCP Server](https://www.markdown.fast/how-to-use-mcp-server) - AI tool integration for Cursor and Claude Desktop
- [AgentMail Setup](https://www.markdown.fast/blog/how-to-use-agentmail) - Newsletter and contact form integration

### AI Development Tools

The project includes documentation optimized for AI coding assistants:

- **CLAUDE.md** - Project instructions for Claude Code CLI with workflows, commands, and conventions
- **AGENTS.md** - General AI agent instructions for understanding the codebase structure
- **llms.txt** - AI agent discovery file at `/llms.txt`
- **.claude/skills/** - Focused skill documentation:
  - `frontmatter.md` - Complete frontmatter syntax and all field options
  - `convex.md` - Convex patterns specific to this app
  - `sync.md` - How sync commands work and content flow

These files are automatically updated during `npm run sync:discovery` with current site statistics.

## Features

See the full feature list on the [About page](https://www.markdown.fast/about).

Key features include real-time sync, four theme options, full-text search, analytics dashboard, MCP server for AI tools, newsletter integration, and SEO optimization with RSS feeds, sitemaps, and structured data.

## Fork Configuration

After forking, run the automated configuration:

```bash
cp fork-config.json.example fork-config.json
# Edit fork-config.json with your site info
npm run configure
```

See the [Fork Configuration Guide](https://www.markdown.fast/fork-configuration-guide) for detailed instructions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Convex account

### Setup

1. Install dependencies:

```bash
npm install
```

2. Initialize Convex:

```bash
npx convex dev
```

This will create your Convex project and generate the `.env.local` file.

3. Start the development server:

```bash
npm run dev
```

4. Open http://localhost:5173

## Deployment

### Netlify

[![Netlify Status](https://api.netlify.com/api/v1/badges/d8c4d83d-7486-42de-844b-6f09986dc9aa/deploy-status)](https://app.netlify.com/projects/markdowncms/deploys)

1. Deploy Convex functions to production:

```bash
npx convex deploy
```

2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm ci --include=dev && npx convex deploy --cmd 'npm run build'`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `CONVEX_DEPLOY_KEY` - Generate from [Convex Dashboard](https://dashboard.convex.dev) > Project Settings > Deploy Key
   - `VITE_CONVEX_URL` - Your production Convex URL

For detailed setup, see the [Convex Netlify Deployment Guide](https://docs.convex.dev/production/hosting/netlify) and [netlify-deploy-fix.md](./netlify-deploy-fix.md) for troubleshooting.

## Tech Stack

React 18, TypeScript, Vite, Convex, Netlify

## Source

Fork this project: [github.com/waynesutton/markdown-site](https://github.com/waynesutton/markdown-site)

## License

This project is licensed under the [MIT License](https://github.com/waynesutton/markdown-site/blob/main/LICENSE).
