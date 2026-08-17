# Route conflict resolution for existing apps

## Problem

When `registerRoutes()` is called in an app that already defines `/sitemap.xml` or `/robots.txt` in its `httpRouter`, Convex throws a fatal error:

```
Failed to analyze http.js: Uncaught Error: Path '/sitemap.xml' for method GET already in use
```

The component registers these routes unconditionally. There is no way to skip them. Apps with existing sitemap or robots handlers cannot use the component without removing their own routes first.

## Who this affects

Any Convex app that already serves `/sitemap.xml` or `/robots.txt` before calling `registerRoutes()`. This includes apps using `@convex-dev/self-hosting` (which serves static `robots.txt`), apps with custom dynamic sitemaps, and apps with SEO middleware that owns these paths.

## Root cause

`registerRoutes()` registers all HTTP routes at import time regardless of config state. There is no option to skip specific routes or defer registration based on `agent-ready.config.json` settings.

## Proposed solution

Three changes across the CLI, config, and route registration.

### 1. CLI setup wizard: detect existing routes

During `npx agent-ready setup`, check if the user's `convex/http.ts` already registers `/sitemap.xml` or `/robots.txt`. If found:

```
Detected existing /sitemap.xml route in convex/http.ts.

? How do you want to handle /sitemap.xml?
  > Keep my existing route (agent-ready will skip it)
    Replace with agent-ready's route
    Skip for now

Detected existing /robots.txt route in convex/http.ts.

? How do you want to handle /robots.txt?
  > Keep my existing route (agent-ready will skip it)
    Replace with agent-ready's route
    Skip for now
```

Write the user's choice to `agent-ready.config.json`.

### 2. Config: add route toggle flags

Add two boolean fields under `settings` in `agent-ready.config.json`:

```json
{
  "settings": {
    "sitemapEnabled": false,
    "robotsTxtEnabled": false
  }
}
```

| Field | Default | Effect |
|-------|---------|--------|
| `sitemapEnabled` | `false` | When `true`, `registerRoutes` registers `/sitemap.xml`. When `false`, skips it. |
| `robotsTxtEnabled` | `false` | When `true`, `registerRoutes` registers `/robots.txt`. When `false`, skips it. |

Defaults should be `false` to avoid conflicts in existing apps. The CLI wizard sets them to `true` only when the user explicitly opts in.

### 3. registerRoutes: accept a skip option and read config

Option A (runtime config read):

```ts
registerRoutes(http, components.agentReady);
// Internally reads agent-ready.config.json and skips
// routes where the flag is false
```

Option B (explicit skip parameter, works without config file):

```ts
registerRoutes(http, components.agentReady, {
  skipRoutes: ["/sitemap.xml", "/robots.txt"],
});
```

Both options should be supported. The `skipRoutes` array takes precedence over config flags when provided. This gives users an escape hatch even without running the CLI.

## Files to change (in the component repo)

| File | Change |
|------|--------|
| `src/cli/setup.ts` | Add route detection and prompt during wizard |
| `src/cli/sync.ts` | Respect new config fields when syncing |
| `src/component/http.ts` | Read `sitemapEnabled` / `robotsTxtEnabled` before registering routes |
| `src/index.ts` (registerRoutes) | Accept `skipRoutes` option, check config flags |
| `README.md` | Document the new config fields and `skipRoutes` option |
| `agent-ready.config.json` schema | Add `sitemapEnabled` and `robotsTxtEnabled` |

## Edge cases

- **App has no existing routes**: Wizard detects nothing, defaults to `true`, registers everything. No change in behavior.
- **App adds routes after setup**: User can manually set `sitemapEnabled: false` in config and run `npx agent-ready sync`.
- **Static robots.txt via self-hosting**: `registerStaticRoutes` from `@convex-dev/self-hosting` serves files from the `dist/` folder. If `public/robots.txt` exists, it will conflict. The wizard should check for this file too.
- **User wants agent-ready to own sitemap later**: Set `sitemapEnabled: true`, remove the existing route from `convex/http.ts`, run `npx agent-ready sync`.

## Verification steps

1. Install component in an app that already has `/sitemap.xml` and `/robots.txt`
2. Run `npx agent-ready setup`
3. Confirm wizard detects existing routes and prompts
4. Choose "Keep my existing route" for both
5. Verify `agent-ready.config.json` has `sitemapEnabled: false` and `robotsTxtEnabled: false`
6. Run `npx convex dev`
7. Confirm no route conflict errors
8. Verify `/llms.txt`, `/agents.md`, `/llms-status` all return 200
9. Verify `/sitemap.xml` still returns the app's original sitemap
10. Change `sitemapEnabled` to `true`, remove app's sitemap route, run `npx agent-ready sync`
11. Verify `/sitemap.xml` now returns agent-ready's version

## Workaround for current users

Until this ships, users can remove their existing `/sitemap.xml` handler from `convex/http.ts` and let agent-ready own it. Or they can keep their route and wait for the fix.

## Environment

- `@waynesutton/agent-ready@0.1.6`
- `convex@1.31.7`
- Error reproduced with `npx convex dev` pushing to a deployment that already defines `/sitemap.xml` in `convex/http.ts`
