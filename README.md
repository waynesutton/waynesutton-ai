# waynesutton.ai

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Convex](https://img.shields.io/badge/Convex-self--hosted-ff6b6b.svg)

The personal blog and publishing framework behind [waynesutton.ai](https://www.waynesutton.ai/). Wayne Sutton is a Head of Community, Events and Startup Programs at Convex, tech event organizer, and startup ecosystem builder writing about building developer communities, open source, and building with AI.

Posts are markdown files. Run one sync command and content is live on the site, in RSS, and readable by LLMs and AI agents. No rebuild, no redeploy. Convex keeps every connected browser in sync.

This site is a fork of [markdown-site](https://github.com/waynesutton/markdown-site), an open source markdown publishing framework. Fork that repo if you want your own.

## Key features

- **Markdown in git**: write in `content/blog/`, run `npm run sync`, and the post is live. Commits, diffs, and rollbacks come free.
- **Built for agents**: MCP server at `/mcp`, JSON API, raw markdown at `/raw/{slug}.md`, a shell-like virtual filesystem at `/vfs/exec`, and `/llms.txt` plus `/agents.md` discovery files. WebMCP tools let a browser agent search and read pages in place.
- **Agent blog pipeline**: coding agents, email, and a paste box submit drafts to a review inbox. A voice agent rewrites them in the site voice using RAG over published posts.
- **Ask AI and search**: semantic search with OpenAI embeddings, full text search on Command+K, and a site Q&A chat on Cmd+J with streamed answers.
- **Admin dashboard**: content management with live preview, drafts inbox, projects and skills directories, analytics, config editor, media library, newsletter, and runtime API keys.
- **X integration**: connect an account, post from the dashboard, share on publish, or turn an X post URL into a draft.
- **Four themes**: dark, light, tan, and cloud, with a font switcher.

## Stack

| Layer    | Technology                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | [React 18](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vite.dev), [React Router](https://reactrouter.com), [react-markdown](https://github.com/remarkjs/react-markdown)                              |
| Backend  | [Convex](https://convex.dev): database, functions, HTTP routes, scheduling, file storage, text and vector search                                                                                                                          |
| Auth     | [Convex Auth](https://labs.convex.dev/auth) with GitHub OAuth                                                                                                                                                                             |
| Hosting  | [Convex static hosting](https://github.com/get-convex/static-hosting) with a custom domain                                                                                                                                                |
| Media    | [Cloudflare R2](https://github.com/get-convex/r2) and [ConvexFS](https://convexfs.dev) with Bunny CDN                                                                                                                                     |
| AI       | [OpenAI](https://platform.openai.com/docs), [Anthropic](https://docs.anthropic.com), [Google Gemini](https://ai.google.dev), [Vercel AI SDK](https://ai-sdk.dev/docs), with OpenRouter, Concentrate, and Runware as dashboard vendor keys |
| Email    | [AgentMail](https://agentmail.to) for newsletter, contact form, and the email door for drafts                                                                                                                                             |
| Web      | [Firecrawl](https://docs.firecrawl.dev), [Exa](https://docs.exa.ai), and [Context.dev](https://context.dev/docs) read external URLs for URL import, chat links, and draft links. Bring your own keys; the dashboard picks the order and falls through on failure |
| Content  | Markdown with [gray-matter](https://github.com/jonschlinkert/gray-matter) frontmatter                                                                                                                                                     |
| Quality  | [Vitest](https://vitest.dev), [convex-test](https://github.com/get-convex/convex-test), [convex-doctor](https://github.com/nooesc/convex-doctor) at 100/100, [@convex-dev/eslint-plugin](https://docs.convex.dev/eslint)                  |

### Convex components

Everything registered in [`convex/convex.config.ts`](./convex/convex.config.ts). Browse more at the [components directory](https://www.convex.dev/components).

| Component                                                                                        | Used for                                                          |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| [@convex-dev/static-hosting](https://github.com/get-convex/static-hosting)                       | Serves the built Vite app from Convex storage with SPA fallback   |
| [@convex-dev/aggregate](https://github.com/get-convex/aggregate)                                 | Page view counts, unique visitors, and unique paths in O(log n)   |
| [@convex-dev/persistent-text-streaming](https://github.com/get-convex/persistent-text-streaming) | Streams Ask AI answers to every open tab                          |
| [@convex-dev/rate-limiter](https://github.com/get-convex/rate-limiter)                           | Limits on every public HTTP route and mutation                    |
| [@convex-dev/agent](https://github.com/get-convex/agent)                                         | Voice agent that rewrites submitted drafts                        |
| [@convex-dev/rag](https://github.com/get-convex/rag)                                             | Retrieval over published posts for the voice agent                |
| [@convex-dev/crons](https://github.com/get-convex/crons)                                         | Dynamic cron scheduling                                           |
| [@convex-dev/workpool](https://github.com/get-convex/workpool)                                   | Durable background jobs                                           |
| [@convex-dev/r2](https://github.com/get-convex/r2)                                               | Cloudflare R2 uploads for the media library                       |
| [convex-fs](https://github.com/jamwt/convex-fs)                                                  | File storage behind Bunny CDN                                     |
| [@waynesutton/agent-ready](https://github.com/waynesutton/agent-ready-component)                 | Generates `/llms.txt`, `/llms-full.txt`, and `/agents.md` on sync |

Web research talks to the [Exa](https://www.convex.dev/components/exalabs/convex-exa) and [Context.dev](https://www.convex.dev/components/context-dot-dev/convex) REST APIs directly instead of through their components. Components declare their API key as a required deploy-time env var, which would block `npx convex deploy` on a fork with no key. Calling the API from `convex/lib/webResearch.ts` keeps every provider optional and lets a key saved in the dashboard win over the env var.

### Convex docs used here

- [Convex docs](https://docs.convex.dev) and [best practices](https://docs.convex.dev/understanding/best-practices/)
- [Queries](https://docs.convex.dev/functions/query-functions), [mutations](https://docs.convex.dev/functions/mutation-functions), [actions](https://docs.convex.dev/functions/actions), and [HTTP actions](https://docs.convex.dev/functions/http-actions)
- [Schemas and indexes](https://docs.convex.dev/database/schemas), [full text search](https://docs.convex.dev/search/text-search), and [vector search](https://docs.convex.dev/search/vector-search)
- [Scheduling and crons](https://docs.convex.dev/scheduling), [file storage](https://docs.convex.dev/file-storage), and [testing](https://docs.convex.dev/functions/testing)
- [Convex Auth](https://labs.convex.dev/auth), [components](https://docs.convex.dev/components), and [avoiding write conflicts](https://docs.convex.dev/error#1)

## AI development files

This repo is set up for coding agents as much as for people.

| File or folder                        | Purpose                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md`              | Project instructions for agents. Both refresh during `npm run sync:discovery`                        |
| `public/llms.txt`, `public/AGENTS.md` | Agent discovery files served by the site, regenerated on the same sync                               |
| `convex/_generated/ai/guidelines.md`  | Convex API guidelines generated by the Convex CLI. Read first before touching `convex/`              |
| `.cursor/rules`, `.cursor/skills`     | Cursor rules for Convex patterns, write conflicts, git safety, and the project workflow, plus skills |
| `.claude/skills`, `.codex/skills`     | Skills for Claude Code and Codex covering Convex, auth, schema, frontmatter, and writing style       |
| `convex-doctor.toml`                  | Documented suppressions that keep the convex-doctor score at 100                                     |
| `prds/`                               | PRDs for every feature and fix, plus `prds/lessons.md`                                               |
| `changelog.md`, `files.md`, `TASK.md` | Release notes, file reference, and task tracking, updated after each change                          |

## Source

This is a personal site and stays that way. To build your own, fork [markdown-site](https://github.com/waynesutton/markdown-site) or run `npx create-markdown-sync my-site`. Source for this fork lives at [waynesutton/waynesutton-ai](https://github.com/waynesutton/waynesutton-ai).

## License

[MIT License](./LICENSE)
