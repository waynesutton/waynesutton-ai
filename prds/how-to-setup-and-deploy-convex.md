# How to set up and deploy Convex apps

A setup and deploy guide for Convex in general, then the extra steps this site needs. It names environment variables and shows placeholder values only. Do not paste real keys, tokens, emails, inbox addresses, or deploy-key values into this file or any other committed file.

## Before you start

You need a Convex account, Node.js, and a terminal on a machine that can open a browser for `npx convex login`. This cloud agent VM cannot do that login. Production deploys from here need a deploy key in the environment, never in git.

Official docs: [docs.convex.dev](https://docs.convex.dev), [self-hosting](https://github.com/get-convex/self-hosting), [custom domains](https://docs.convex.dev/production/custom-domains), [environment variables](https://docs.convex.dev/production/environment-variables).

## Secrets stay out of git

Never commit these. They are gitignored on purpose:

- `.env.local`
- `.env.production.local`
- any file that contains a real deploy key, API key, OAuth secret, JWT private key, or inbox address

Never put real values in `prds/`, `AGENTS.md`, chat, or a pull request. If a command prints a key, copy it into the Convex dashboard or a local env file, then clear the terminal scrollback.

Safe to write down: variable **names**, placeholder URLs, and public site URLs.

## Set up a new Convex app

This is the generic path. Skip to "This app" if you already have this repo.

1. Create the frontend (Vite, Next.js, or similar) and install Convex:

```bash
npm install convex
npx convex dev
```

2. `npx convex dev` opens a browser login, creates a **dev** deployment, and writes `.env.local` with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`. Leave that file untracked.

3. Define tables in `convex/schema.ts`. Put queries, mutations, and actions in `convex/`. Every public function needs `args` and `returns` validators.

4. Point the client at the generated API (`convex/_generated/api`) with `ConvexProvider` and the URL from `.env.local`.

5. Keep `npx convex dev` running while you develop. It pushes schema and functions to the **dev** deployment on save. Run the frontend in a second terminal (`npm run dev` in this repo).

6. Set backend secrets in the Convex dashboard (Settings, Environment Variables) or with:

```bash
npx convex env set VARIABLE_NAME
```

The CLI prompts for the value. Do not put the value on the command line in a shared log.

7. Production is a second deployment. From a logged-in laptop:

```bash
npx convex deploy
```

That pushes functions and schema to prod. It does not upload a Vite `dist/` folder unless you add static hosting (this app does).

8. Custom domains are added in the Convex dashboard for the **prod** deployment. DNS is an apex or CNAME to the `*.convex.site` host Convex shows you. Set `SITE_URL` on prod to the public https origin.

### Dev vs prod

| Target | How you usually reach it | Typical command |
|--------|--------------------------|-----------------|
| Dev | `npx convex login` plus `.env.local` | `npx convex dev` |
| Prod | Same login, or a **production deploy key** | `npx convex deploy --yes` |

A production deploy key lives in the Convex dashboard under Project Settings, Deploy Keys. Export it only as `CONVEX_DEPLOY_KEY` in the shell or in a secret store. Never check it in.

`npx convex login` does not work in this cloud agent environment (no browser). A deploy key is the only way to ship from here.

## This app

Wayne Sutton's site. React, Vite, TypeScript, official Convex Auth, Convex static hosting. Netlify is disconnected. Do not add `netlify.toml` back.

Live deployment slugs and URLs are in `AGENTS.md`. Use those. Do not aim deploys at archived deployments listed there.

Three operations people mix up:

| Operation | What it updates | When you need it |
|-----------|-----------------|------------------|
| Content sync | `posts` and `pages` in the Convex database | Markdown in `content/` changed |
| Function deploy | `convex/` backend | Schema or functions changed |
| Static deploy | Built frontend in Convex storage | `src/`, `public/`, or styles changed |

Syncing markdown does not rebuild the React app. Deploying the app does not re-sync posts.

### Local setup

```bash
npm install
npx convex dev
```

That creates `.env.local` against the **dev** deployment. In a second terminal:

```bash
npm run dev
```

Site: `http://localhost:5173`. Then:

```bash
npm run sync
```

### First-time static hosting (once per project)

Only if this project has never run self-hosting setup on that Convex project:

```bash
npx @convex-dev/self-hosting setup
npx convex dev --once
```

After that, `convex/convex.config.ts` already uses the self-hosting component. Do not run setup again unless you are attaching a new project.

### Environment variables (names only)

**Local files** (gitignored, values filled by `npx convex dev` or you):

| Name | Where | Purpose |
|------|-------|---------|
| `CONVEX_DEPLOYMENT` | `.env.local` or `.env.production.local` | Which deployment the CLI targets |
| `VITE_CONVEX_URL` | same | Frontend Convex cloud URL |
| `VITE_CONVEX_SITE_URL` | same | Frontend `*.convex.site` URL |
| `CONVEX_DEPLOY_KEY` | shell or secret store, not git | Non-interactive prod deploys |

**Convex dashboard** (dev and prod are separate; set each you use):

| Name | Required for | Purpose |
|------|--------------|---------|
| `SITE_URL` | Prod SEO, RSS, OAuth | Public origin, `https://...` |
| `AUTH_GITHUB_ID` | Dashboard login | GitHub OAuth app client id |
| `AUTH_GITHUB_SECRET` | Dashboard login | GitHub OAuth app secret |
| `JWT_PRIVATE_KEY` | Convex Auth | Generated by auth setup, never commit |
| `JWKS` | Convex Auth | Public key set that matches the JWT key |
| `OPENAI_API_KEY` | Ask AI, embeddings, some jobs | Vendor key |
| `ANTHROPIC_API_KEY` | Claude models | Vendor key |
| `GOOGLE_AI_API_KEY` | Gemini | Vendor key |
| `FIRECRAWL_API_KEY` | URL import | Vendor key |
| `AGENTMAIL_API_KEY` | Newsletter and contact | Vendor key |
| `AGENTMAIL_INBOX` | Inbound mail | Inbox address (keep out of git) |
| `BLOG_POST_KEY` | Agent draft HTTP API | Pipeline key from the dashboard |

Optional media and other vendor names live in `prds/sync-deploy-commands.md`. Same rule: names in docs, values only in the dashboard or local env files.

Check names without printing values:

```bash
npm run validate:env
npm run validate:env:prod
```

### GitHub Auth (this app)

Create two GitHub OAuth apps (dev and prod). Homepage URL is the public origin for that environment. Callback URL is:

```text
https://<your-convex-site-or-custom-domain>/api/auth/callback/github
```

Put the client id and secret into that environment's Convex env vars using the names above. Do not commit them. After changing Auth env vars, redeploy functions.

### Deploy from a laptop (logged in)

You are already `npx convex login`'d. This is the easy path.

Functions only:

```bash
npx convex deploy
```

Frontend only (functions already on prod):

```bash
npm run deploy:static
```

Full prod (functions + static). On a laptop this usually works:

```bash
npm run deploy
```

That script is `npx @convex-dev/self-hosting deploy`. It builds Vite, deploys functions, then uploads `dist/`. Do not run `npm run build` first; the deploy command injects the prod Convex URL during its own build.

Dev static preview (functions already pushed by `npx convex dev`):

```bash
npm run deploy:dev
```

Then sync prod content when the markdown should go live:

```bash
npm run sync:prod
```

### Deploy from this cloud agent (or any non-interactive shell)

`npm run deploy` opens an interactive `npx convex deploy` prompt and dies here.

What this box needs first:

1. A **production** deploy key from the Convex dashboard (Project Settings, Deploy Keys).
2. `export CONVEX_DEPLOY_KEY=...` in the shell, or the same name in the Cursor environment secret store. Do not paste the key into chat.
3. A gitignored `.env.production.local` that points at the **prod** deployment from `AGENTS.md` (`CONVEX_DEPLOYMENT=prod:<slug>` and the matching `VITE_CONVEX_URL`). No other secrets belong in that file unless you need them for the build.

Then:

```bash
npx convex deploy --yes
npx @convex-dev/self-hosting deploy --skip-convex
```

`--yes` skips the prompt. `--skip-convex` uploads static files only after the function deploy already ran.

Say the target out loud before you run it: prod, the slug from `AGENTS.md`, live public site. Need a fresh "yes, deploy prod" in the session that runs it.

### Content vs app (again)

```bash
npm run sync                  # markdown to dev database
npm run sync:prod             # markdown to prod database
npm run sync:discovery        # refresh AGENTS.md, CLAUDE.md, llms.txt (dev)
npm run sync:all:prod         # content + discovery on prod
npm run export:db:prod        # pull dashboard-written posts back to files
```

Dashboard-created posts (`source: "dashboard"`) are not overwritten by sync. File-backed posts (`source: "sync"`) are.

### Check a deploy

```bash
npm run verify:deploy:prod
```

Or hit the public origin and confirm a new hashed asset name in the HTML. If the UI looks old, the static bundle was not uploaded. If data looks old, you synced the wrong deployment or did not sync.

### Common failures

| What you see | Likely cause | What to do |
|--------------|--------------|------------|
| `npx convex login` does nothing here | No browser on this VM | Use a deploy key, or run deploy on a laptop |
| `npm run deploy` hangs or exits in an agent | Interactive function-deploy prompt | `npx convex deploy --yes` then self-hosting `--skip-convex` |
| Auth or env errors on deploy | Missing `CONVEX_DEPLOY_KEY` / wrong `.env` | Confirm the key is exported and `CONVEX_DEPLOYMENT` is prod |
| Site loads but a UI fix is missing | Only functions deployed | Upload static (`deploy --skip-convex` or `npm run deploy:static`) |
| New markdown missing | Only the app was deployed | `npm run sync` or `sync:prod` |
| `Could not find function for 'staticHosting:generateUploadUrls'` | Static upload before functions | Deploy functions first, then upload |
| Login broken after a domain change | OAuth callback or `SITE_URL` mismatch | Update the GitHub app and prod `SITE_URL`, redeploy functions |

## Related

- `AGENTS.md` — current prod and dev deployments, commands, what not to target
- `prds/sync-deploy-commands.md` — full command list and env name tables
- `prds/self-hosting-deploy-dev.md` — dev vs prod self-hosting commands
- `prds/lessons.md` — `npm run deploy` fails in agent shells
- [Convex best practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex TypeScript](https://docs.convex.dev/understanding/best-practices/typescript)
