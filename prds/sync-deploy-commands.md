# Sync and deploy commands reference

How this app works, what every command does, and how to deploy with Convex self-hosting.

---

## How the app works

This is a React/Vite/Convex app with two separate concerns that are often confused:

1. **Content sync** - pushes markdown files from `content/` to the Convex database
2. **App deploy** - builds the React app and uploads static assets to Convex storage

These are independent operations. Syncing content does not redeploy the app. Deploying the app does not re-sync content.

### Data flow

```
content/blog/*.md       scripts/sync-posts.ts       Convex DB (posts table)
content/pages/*.md  -->  npm run sync           -->  Convex DB (pages table)
                                                      (live in browser instantly)

src/ + public/          vite build                  Convex storage (dev or prod)
convex/             -->  npm run deploy:dev     -->  dev: <name>.convex.site
                    -->  npm run deploy         -->  prod: <name>.convex.site
```

### Auth and hosting modes

The default configuration:

| Setting          | Value                | Provider                               |
| ---------------- | -------------------- | -------------------------------------- |
| `auth.mode`      | `convex-auth`        | Official Convex Auth (GitHub OAuth)    |
| `hosting.mode`   | `convex-self-hosted` | `@convex-dev/self-hosting`             |
| `media.provider` | `convex`             | ConvexFS + Bunny.net                   |

Legacy hosting modes and local fallback:

| Setting        | Value     | Notes                                     |
| -------------- | --------- | ----------------------------------------- |
| `hosting.mode` | `netlify` | Use `deploy:netlify:prod` script          |
| `auth.mode`    | `none`    | Local dev only, no auth enforced          |

---

## Environment variables

### Local development (`.env.local`)

| Variable                   | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `CONVEX_DEPLOYMENT`        | Auto-set by `npx convex dev`. Dev deployment name. |
| `VITE_CONVEX_URL`          | Auto-set. Your dev Convex cloud URL.               |
| `VITE_CONVEX_SITE_URL`     | Your dev Convex site URL (`.convex.site`).         |
| `FIRECRAWL_API_KEY`        | Optional. For `npm run import`.                    |
| `VITE_BUNNY_CDN_HOSTNAME`  | Optional. Bunny CDN hostname for media library.    |

### Convex dashboard environment variables (production)

Set these under your project in dashboard.convex.dev > Settings > Environment Variables.

| Variable                        | Required | Description                                             |
| ------------------------------- | -------- | ------------------------------------------------------- |
| `SITE_URL`                      | Yes      | Your production domain (e.g., `https://yourdomain.com`) |
| `CONVEX_SITE_URL`               | Auto     | Set automatically by Convex                             |
| `OPENAI_API_KEY`                | Optional | Semantic search + Ask AI (OpenAI models)                |
| `ANTHROPIC_API_KEY`             | Optional | Ask AI (Claude models)                                  |
| `GOOGLE_AI_API_KEY`             | Optional | Gemini chat + image generation                          |
| `AGENTMAIL_API_KEY`             | Optional | Newsletter and contact form emails                      |
| `AGENTMAIL_INBOX`               | Optional | Inbox address for AgentMail                             |
| `FIRECRAWL_API_KEY`             | Optional | URL import via dashboard                                |
| `BUNNY_API_KEY`                 | Optional | Media library file storage                              |
| `BUNNY_STORAGE_ZONE`            | Optional | Bunny.net storage zone name                             |
| `BUNNY_CDN_HOSTNAME`            | Optional | Bunny CDN delivery hostname                             |
| `AUTH_GITHUB_ID`                | Yes      | GitHub OAuth app client ID for Convex Auth              |
| `AUTH_GITHUB_SECRET`            | Yes      | GitHub OAuth app secret for Convex Auth                 |
| `JWT_PRIVATE_KEY`               | Yes      | Convex Auth JWT signing private key                     |
| `JWKS`                          | Yes      | Convex Auth public key set                              |
| `DASHBOARD_PRIMARY_ADMIN_EMAIL` | Optional | Single-admin mode only; leave unset for multi-admin     |

---

## Commands

### Development

```bash
npx convex dev          # Start Convex watcher (required for local dev)
npm run dev             # Start Vite dev server at localhost:5173
```

Run both in separate terminals during development.

### Content sync

```bash
npm run sync                  # Sync content/blog/ and content/pages/ to dev Convex DB
npm run sync:prod             # Same, but to production Convex DB
npm run sync:discovery        # Update AGENTS.md, CLAUDE.md, llms.txt with current stats (dev)
npm run sync:discovery:prod   # Same, but production
npm run sync:all              # sync + sync:discovery (dev)
npm run sync:all:prod         # sync:prod + sync:discovery:prod
```

Sync is non-destructive for `source: "dashboard"` content. Only content created from markdown files (`source: "sync"`) is overwritten on re-sync.

### Export dashboard content to markdown

```bash
npm run export:db             # Export dashboard-created posts/pages to content/ folders (dev)
npm run export:db:prod        # Same from production DB
```

Use this to pull content edited in the dashboard back to local markdown files before syncing.

### Deploy to dev (preview on your dev `.convex.site` URL)

```bash
npm run deploy:dev
```

Builds the Vite app, strips `dist/raw/` (served dynamically by Convex HTTP actions), and uploads static assets to your **dev** Convex deployment. The dev deployment is determined by `CONVEX_DEPLOYMENT` in `.env.local`.

Your dev site URL follows the pattern `https://<deployment-name>.convex.site`.

This does **not** deploy Convex functions. Those are pushed by `npx convex dev` which should already be running in a separate terminal.

### Deploy to production (Convex self-hosting — default)

```bash
# First-time setup only
npx @convex-dev/self-hosting setup
npx convex dev --once

# Every production deploy after that
npm run deploy
```

`npm run deploy` runs `npx @convex-dev/self-hosting deploy` which:

1. Builds the Vite app (`npm run build` internally)
2. Deploys Convex functions (`npx convex deploy` internally)
3. Uploads the `dist/` static assets to Convex production storage

Do not run `npm run build` before `npm run deploy`. The deploy command handles the build.

### Deploy static assets only (skip Convex function deploy)

```bash
npm run deploy:static
```

Runs `npx @convex-dev/self-hosting upload --build --prod`. Use when only frontend code changed and Convex functions are unchanged. Targets production.

### Deploy Convex functions only (skip static asset upload)

```bash
npx convex deploy
```

Use when only `convex/` files changed and the frontend is unchanged.

### Legacy Netlify deploy

```bash
npm run deploy:netlify        # Sync content + build (for Netlify CI to pick up)
npm run deploy:netlify:prod   # Deploy Convex functions + sync to production
```

These are only relevant when `hosting.mode: "netlify"` is set in `siteConfig.ts`.

---

## Full deploy sequences

### Dev deploy (preview before production)

```bash
# 1. Make sure Convex dev watcher is running in another terminal
npx convex dev

# 2. Sync content to dev Convex DB
npm run sync:all

# 3. Deploy static assets to dev
npm run deploy:dev

# View at https://<dev-deployment>.convex.site
```

### Production deploy (ship everything)

When you want to ship code changes + content:

```bash
# 1. Deploy the app (builds, uploads static assets, deploys Convex functions)
npm run deploy

# 2. Sync content to production Convex DB
npm run sync:all:prod
```

If only content changed (no code changes):

```bash
npm run sync:all:prod
```

If only code changed (no content changes):

```bash
npm run deploy
```

---

## Dashboard admin setup

After first deploy, grant yourself dashboard admin access:

```bash
npx convex run authAdmin:grantDashboardAdmin '{"email":"<admin-email>"}'
```

Or by auth subject:

```bash
npx convex run authAdmin:grantDashboardAdmin '{"subject":"<auth-subject>"}'
```

GitHub OAuth callback URL to register in your GitHub OAuth app:

```
https://<your-deployment>.convex.site/api/auth/callback/github
```

---

## Raw markdown serving

`/raw/{slug}.md` is served dynamically by a Convex HTTP action in `convex/http.ts`. It returns `Content-Type: text/plain; charset=utf-8` so:

- Browsers display the file as readable text
- Claude, ChatGPT, and Perplexity can fetch and read the content

The `CopyPageDropdown` "View as Markdown" and AI service links all use this endpoint. Content comes from the Convex DB, not from static files, so it is always current after `npm run sync`.

---

## Common mistakes

| Mistake                                              | Fix                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Running `npm run build` before `npm run deploy`      | Don't. `deploy` runs build internally. `deploy:dev` handles its own build too.          |
| `npm run deploy` goes to dev instead of prod         | `deploy` always targets production. Use `deploy:dev` for dev.                           |
| `npm run deploy:dev` but nothing loads               | Make sure `npx convex dev` is running in another terminal.                              |
| Syncing content but not seeing changes in production | Make sure you ran `sync:prod`, not `sync`                                               |
| Dashboard shows no content after deploy              | Run `npm run sync:prod` after deploy                                                    |
| `/raw/*.md` returning binary in browser              | `dist/raw/` is stripped during deploy:dev. Served dynamically via Convex HTTP action.   |
| Images not updating after deploy                     | Images are static assets. Run `npm run deploy` after adding images to `public/images/`. |
| Auth not working after first deploy                  | Run `npx convex run authAdmin:grantDashboardAdmin` to grant your email admin access     |
