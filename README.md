# waynesutton.ai

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Convex](https://img.shields.io/badge/Convex-self--hosted-ff6b6b.svg)

The personal blog and publishing framework behind [waynesutton.ai](https://www.waynesutton.ai/). Wayne Sutton is a Developer Community Lead at Convex, tech event organizer, and startup ecosystem builder writing about developer communities, open source, and building with AI.

Posts are markdown files. Run one sync command and content is live on the site, in RSS, and readable by LLMs and AI agents. No rebuild, no redeploy. Convex keeps every connected browser in sync.

This site is a fork of [markdown-site](https://github.com/waynesutton/markdown-site), an open source markdown publishing framework. Fork that repo if you want your own.

## How publishing works

Write a post in `content/blog/`, then sync:

```bash
npm run sync        # dev
npm run sync:prod   # production
npm run sync:all    # content + discovery files (AGENTS.md, llms.txt)
```

Markdown files live in git, so posts get commits, diffs, and rollbacks like any code. The dashboard can also write posts directly, and `npm run export:db` pulls dashboard content back into the content folders.

To lock the sync mutations to your machines, set `SYNC_SECRET` on the Convex deployment (`npx convex env set SYNC_SECRET <value>`) and put the same value in `.env.local` or `.env.production.local`. Without it, sync stays open as before. Signed-in dashboard admins never need the secret.

Lock the sync down before going public: set `SYNC_SECRET` on the Convex deployment (`npx convex env set SYNC_SECRET <value>`) and put the same value in `.env.local` or `.env.production.local`. Without it the sync mutations stay open, which is fine for a private fork and not fine for a live site.

## Features

- **Agent blog pipeline**: coding agents, email, and a paste box submit drafts to a review inbox. A voice agent rewrites them in the site voice using RAG over published posts.
- **X integration**: connect an X account, post from the dashboard, share posts on publish, or turn any X post URL into a blog draft.
- **Admin dashboard**: content management with live preview, drafts inbox, analytics, config editor, media library, internal docs, and runtime API key management.
- **Ask AI and search**: semantic search with OpenAI embeddings, full text search with Command+K, and a site Q&A chat on Cmd+J.
- **Agent access**: MCP server, JSON API, raw markdown at `/raw/{slug}.md`, a shell-like virtual filesystem at `/vfs/exec`, and discovery files at `/llms.txt` and `/agents.md`.
- **Newsletter and contact**: AgentMail handles signups, sends, and the contact form.
- **Themes**: dark and light defaults plus tan and cloud, with a font switcher.
- **Rate limiting**: every public endpoint is protected with `@convex-dev/rate-limiter`.

## Tech stack

| Layer    | Technology                                                     |
| -------- | -------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite                                     |
| Backend  | Convex (database, functions, HTTP routes, file storage)        |
| Hosting  | Convex self-hosting via `@convex-dev/self-hosting`             |
| Auth     | Convex Auth with GitHub OAuth                                  |
| AI       | OpenAI, Anthropic, Google, Concentrate, OpenRouter, Runware    |
| Email    | AgentMail                                                      |
| Content  | Markdown with gray-matter frontmatter                          |

## Getting started

Requires Node.js 18+ and a Convex account.

```bash
npm install
npx convex dev     # creates the Convex project and .env.local
npm run dev        # http://localhost:5173
npm run sync       # push markdown content
```

Deploy with `npx convex deploy` for functions and `npm run deploy` for static assets. Admin setup, auth config, and fork options are covered in [FORK_CONFIG.md](./FORK_CONFIG.md).

## AI development files

`CLAUDE.md` and `AGENTS.md` hold project instructions for coding agents, and `llms.txt` handles agent discovery. All three update automatically during `npm run sync:discovery`.

## Source

This is a personal site. To build your own, fork [markdown-site](https://github.com/waynesutton/markdown-site) or run `npx create-markdown-sync my-site`.

## License

[MIT License](./LICENSE)
